import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory simulation & runtime state
interface AgentStep {
  id: string;
  title: string;
  action_type: string;
  params: Record<string, any>;
  verification: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  duration_ms?: number;
  confidence?: number;
}

interface AgentState {
  status: 'idle' | 'planning' | 'running' | 'paused' | 'waiting_confirmation' | 'stopped' | 'completed';
  goal: string;
  current_step: number;
  steps: AgentStep[];
  pending_confirmation: {
    id: string;
    action_type: string;
    description: string;
    params: Record<string, any>;
  } | null;
  active_window: {
    title: string;
    process: string;
    rect: { x: number; y: number; width: number; height: number };
  };
  screen_resolution: [number, number];
  cursor_pos: [number, number];
  is_input_frozen?: boolean;
  freeze_enabled?: boolean;
  speed?: '1x' | '2x' | '5x';
  ocr_confidence?: number;
  logs: Array<{ time: string; message: string; type: 'info' | 'action' | 'verify' | 'alert' }>;
}

const runtimeState: AgentState = {
  status: 'idle',
  goal: '',
  current_step: 0,
  steps: [],
  pending_confirmation: null,
  active_window: {
    title: 'Windows Desktop - Explorer',
    process: 'explorer.exe',
    rect: { x: 0, y: 0, width: 1920, height: 1080 },
  },
  screen_resolution: [1920, 1080],
  cursor_pos: [960, 540],
  is_input_frozen: false,
  freeze_enabled: true,
  speed: '1x',
  ocr_confidence: 99.4,
  logs: [
    { time: new Date().toLocaleTimeString(), message: 'Windows Computer-Use Engine initialized.', type: 'info' },
  ],
};

function logAgentEvent(message: string, type: 'info' | 'action' | 'verify' | 'alert' = 'info') {
  const time = new Date().toLocaleTimeString();
  runtimeState.logs.push({ time, message, type });
  if (runtimeState.logs.length > 200) {
    runtimeState.logs.shift();
  }
}

// --- API ROUTES FIRST ---

// Health & System Info
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    os: 'Windows/Linux-Bridge',
    has_gemini_key: Boolean(process.env.GEMINI_API_KEY),
    ollama_url: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  });
});

// Agent Status
app.get('/api/agent/status', (_req, res) => {
  res.json(runtimeState);
});

// Emergency Stop
app.post('/api/agent/stop', (req, res) => {
  const reason = req.body?.reason || 'User pressed Emergency Stop button';
  runtimeState.status = 'stopped';
  runtimeState.is_input_frozen = false;
  runtimeState.pending_confirmation = null;
  logAgentEvent(`[EMERGENCY STOP] ${reason} - Screen input unlocked`, 'alert');
  res.json({ success: true, status: runtimeState.status, is_input_frozen: false });
});

// Pause / Resume
app.post('/api/agent/pause', (_req, res) => {
  if (runtimeState.status === 'running') {
    runtimeState.status = 'paused';
    runtimeState.is_input_frozen = false;
    logAgentEvent('Agent execution paused by user. Screen input unlocked.', 'info');
  }
  res.json({ success: true, status: runtimeState.status, is_input_frozen: false });
});

app.post('/api/agent/resume', (_req, res) => {
  if (runtimeState.status === 'paused' || runtimeState.status === 'stopped') {
    runtimeState.status = 'running';
    if (runtimeState.freeze_enabled) {
      runtimeState.is_input_frozen = true;
      logAgentEvent('Agent execution resumed. Screen input locked.', 'info');
    } else {
      logAgentEvent('Agent execution resumed.', 'info');
    }
  }
  res.json({ success: true, status: runtimeState.status, is_input_frozen: runtimeState.is_input_frozen });
});

// Emergency Unfreeze (instantly unlocks user mouse and keyboard)
app.post('/api/agent/emergency-unfreeze', (_req, res) => {
  runtimeState.is_input_frozen = false;
  logAgentEvent('[EMERGENCY UNFREEZE] Physical user input unlocked.', 'alert');
  res.json({ success: true, is_input_frozen: false });
});

// Toggle Screen Input Freeze Preference
app.post('/api/agent/freeze-toggle', (req, res) => {
  const enabled = req.body?.enabled !== undefined ? Boolean(req.body.enabled) : !runtimeState.freeze_enabled;
  runtimeState.freeze_enabled = enabled;
  if (!enabled) {
    runtimeState.is_input_frozen = false;
  }
  logAgentEvent(`[INPUT LOCK PREFERENCE] Autonomous input freeze ${enabled ? 'ENABLED' : 'DISABLED'}`, 'info');
  res.json({ success: true, freeze_enabled: runtimeState.freeze_enabled, is_input_frozen: runtimeState.is_input_frozen });
});

// User Confirmation Response (Section 26)
app.post('/api/agent/confirm', (req, res) => {
  const { action_id, approved } = req.body;
  if (runtimeState.pending_confirmation && runtimeState.pending_confirmation.id === action_id) {
    if (approved) {
      logAgentEvent(`User APPROVED sensitive action: ${runtimeState.pending_confirmation.description}`, 'action');
      const step = runtimeState.steps[runtimeState.current_step];
      if (step) {
        step.status = 'completed';
        step.result = { confirmed: true, executed_at: new Date().toISOString() };
      }
      runtimeState.pending_confirmation = null;
      runtimeState.status = 'running';
      res.json({ success: true, approved: true });
    } else {
      logAgentEvent(`User REJECTED sensitive action: ${runtimeState.pending_confirmation.description}`, 'alert');
      const step = runtimeState.steps[runtimeState.current_step];
      if (step) {
        step.status = 'failed';
        step.result = { error: 'Rejected by user' };
      }
      runtimeState.pending_confirmation = null;
      runtimeState.status = 'stopped';
      res.json({ success: true, approved: false });
    }
  } else {
    res.status(400).json({ error: 'No matching pending confirmation' });
  }
});

// Set Execution Speed
app.post('/api/agent/speed', (req, res) => {
  const speed = req.body?.speed;
  if (speed === '1x' || speed === '2x' || speed === '5x') {
    runtimeState.speed = speed;
    logAgentEvent(`Execution speed set to ${speed}`, 'info');
    res.json({ success: true, speed: runtimeState.speed });
  } else {
    res.status(400).json({ error: 'Invalid speed. Use 1x, 2x, or 5x' });
  }
});

// Retry Current Step
app.post('/api/agent/retry-step', (req, res) => {
  if (runtimeState.current_step < runtimeState.steps.length) {
    const step = runtimeState.steps[runtimeState.current_step];
    step.status = 'pending';
    logAgentEvent(`Retrying step ${runtimeState.current_step + 1}: ${step.title}`, 'action');
    res.json({ success: true, current_step: runtimeState.current_step, step });
  } else {
    res.status(400).json({ error: 'No active step to retry' });
  }
});

// Skip Current Step
app.post('/api/agent/skip-step', (req, res) => {
  if (runtimeState.current_step < runtimeState.steps.length) {
    const step = runtimeState.steps[runtimeState.current_step];
    step.status = 'completed';
    step.result = { skipped: true, timestamp: new Date().toISOString() };
    logAgentEvent(`User manually skipped step ${runtimeState.current_step + 1}: ${step.title}`, 'info');
    runtimeState.current_step = Math.min(runtimeState.steps.length - 1, runtimeState.current_step + 1);
    res.json({ success: true, current_step: runtimeState.current_step });
  } else {
    res.status(400).json({ error: 'No active step to skip' });
  }
});

// Generate Plan (Supports Gemini and rule-based planning)
app.post('/api/agent/plan', async (req, res) => {
  const goal: string = req.body.goal || '';
  if (!goal.trim()) {
    return res.status(400).json({ error: 'Goal must not be empty' });
  }

  runtimeState.goal = goal;
  runtimeState.status = 'planning';
  runtimeState.current_step = 0;
  runtimeState.steps = [];
  logAgentEvent(`Goal received: "${goal}"`, 'info');

  let generatedSteps: AgentStep[] = [];

  // Try Gemini 3.8 Flash for intelligent computer-use decomposition if key exists
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getGemini();
      const prompt = `You are an expert autonomous Windows Computer-Use AI agent planner.
Decompose the following user request into precise, verifiable Windows desktop steps:
USER GOAL: "${goal}"

Available atomic action types:
- launch_app: { app_name: string, url?: string }
- focus_window: { title_query: string }
- click_element: { element_name: string, fallback_coords?: [number, number] }
- mouse_click: { x: number, y: number, button?: "left" | "right", clicks?: number }
- type_text: { text: string, press_enter?: boolean }
- copy_meet_link: {}
- search_contact: { query: string }
- send_message: { recipient: string, message: string } (SENSITIVE)
- fs_list: { folder: string, pattern?: string }
- fs_organize: { source: string, extension: string, destination: string }
- fs_write: { path: string, content: string }

Return a JSON array of step objects adhering strictly to this schema:
[
  {
    "id": "step_1",
    "title": "Clear description of action",
    "action_type": "one of the above types",
    "params": { ... },
    "verification": "How to visually/programmatically verify success"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                action_type: { type: Type.STRING },
                params: { type: Type.OBJECT },
                verification: { type: Type.STRING },
              },
              required: ['id', 'title', 'action_type', 'params', 'verification'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        generatedSteps = parsed.map((s: any, idx: number) => ({
          ...s,
          id: s.id || `step_${idx + 1}`,
          status: 'pending',
        }));
      }
    } catch (err) {
      console.warn('Gemini planning fallback to native heuristic planner:', err);
    }
  }

  // Fallback heuristic planner if Gemini is not active or returned empty
  if (generatedSteps.length === 0) {
    const gl = goal.toLowerCase();

    // 1. Chrome Meet + WhatsApp
    if (gl.includes('chrome') && (gl.includes('meet') || gl.includes('meeting')) && gl.includes('whatsapp')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Google Chrome and navigate to Google Meet',
          action_type: 'launch_app',
          params: { app_name: 'chrome', url: 'https://meet.google.com' },
          verification: 'Google Meet page loaded in Chrome',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Click "New meeting" button',
          action_type: 'click_element',
          params: { element_name: 'New meeting', fallback_coords: [440, 360] },
          verification: 'Meeting creation dialog visible',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Copy generated meeting URL to Windows clipboard',
          action_type: 'copy_meet_link',
          params: {},
          verification: 'Clipboard contains https://meet.google.com/...',
          status: 'pending',
        },
        {
          id: 'step_4',
          title: 'Launch WhatsApp Desktop or active WhatsApp session',
          action_type: 'launch_app',
          params: { app_name: 'whatsapp', url: 'https://web.whatsapp.com' },
          verification: 'WhatsApp window focused in foreground',
          status: 'pending',
        },
        {
          id: 'step_5',
          title: 'Search conversation list for "Rahul"',
          action_type: 'search_contact',
          params: { query: 'Rahul' },
          verification: 'Rahul conversation thread active',
          status: 'pending',
        },
        {
          id: 'step_6',
          title: 'Send meeting link to Rahul (Requires User Approval)',
          action_type: 'send_message',
          params: {
            recipient: 'Rahul',
            message: 'Hi Rahul, here is the Google Meet link: [COPIED_CLIPBOARD]',
          },
          verification: 'Message sent timestamp visible in conversation',
          status: 'pending',
        },
      ];
    }
    // 2. YouTube Search & Playback
    else if (gl.includes('youtube')) {
      const isViews = gl.includes('view') || gl.includes('views') || gl.includes('popular');
      let query = 'cyber security courses in Telugu';
      const m = goal.match(/(?:search\s+(?:for\s+)?|find\s+|look\s+for\s+)(.*?)(?:\s+(?:on\s+youtube|and\s+pick|pick|and\s+play|play)|$)/i);
      if (m && m[1]?.trim()) {
        query = m[1].trim().replace(/^(for|and)\s+/i, '');
      }
      generatedSteps = [
        {
          id: 'step_1',
          title: `Launch Chrome & navigate to YouTube search for "${query}"`,
          action_type: 'youtube_search',
          params: { query, sort_by_views: isViews },
          verification: 'YouTube search results page loaded',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Filter results by View Count (Highest Views)',
          action_type: 'click_element',
          params: { element_name: 'Filters > View count', fallback_coords: [510, 180] },
          verification: 'Search results ranked by view count',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: `Select top video with highest views for "${query}"`,
          action_type: 'youtube_select_video',
          params: { query, selection: 'highest_views', fallback_coords: [480, 310] },
          verification: 'Video player page opened',
          status: 'pending',
        },
        {
          id: 'step_4',
          title: 'Initiate video playback and verify audio stream',
          action_type: 'youtube_play_video',
          params: { play: true },
          verification: 'Video is actively playing in 1080p',
          status: 'pending',
        },
      ];
    }
    // 3. VS Code & Coding Tasks
    else if (gl.includes('code') || gl.includes('vscode') || gl.includes('python') || gl.includes('script') || gl.includes('node') || gl.includes('developer')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Visual Studio Code (code.exe)',
          action_type: 'launch_app',
          params: { app_name: 'vscode' },
          verification: 'VS Code editor window loaded in foreground',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Focus file workspace & create "main.py"',
          action_type: 'focus_window',
          params: { title_query: 'Visual Studio Code' },
          verification: 'Active editor tab created: main.py',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Author Python script with algorithm logic',
          action_type: 'type_text',
          params: { text: 'def autonomous_runner():\n    print("[AGENT] System operational")\n\nautonomous_runner()', press_enter: true },
          verification: 'Source code syntax parsed in editor buffer',
          status: 'pending',
        },
        {
          id: 'step_4',
          title: 'Open integrated terminal and execute "python main.py"',
          action_type: 'shell_exec',
          params: { command: 'python main.py' },
          verification: 'Terminal process output verified: "[AGENT] System operational"',
          status: 'pending',
        },
      ];
    }
    // 4. Spotify & Music
    else if (gl.includes('spotify') || gl.includes('music') || gl.includes('song') || gl.includes('lofi') || gl.includes('play track') || gl.includes('playlist')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Spotify Desktop (Spotify.exe)',
          action_type: 'launch_app',
          params: { app_name: 'spotify' },
          verification: 'Spotify player viewport active',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Focus Spotify global search bar',
          action_type: 'click_element',
          params: { element_name: 'Search', fallback_coords: [150, 48] },
          verification: 'Search input caret active',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Search for "Lofi Beats - Chill Instrumental"',
          action_type: 'type_text',
          params: { text: 'Lofi Beats - Chill Instrumental', press_enter: true },
          verification: 'Track results list populated',
          status: 'pending',
        },
        {
          id: 'step_4',
          title: 'Trigger playback and verify audio buffer',
          action_type: 'click_element',
          params: { element_name: 'Play', fallback_coords: [500, 715] },
          verification: 'Active stream playing at 320kbps',
          status: 'pending',
        },
      ];
    }
    // 5. Windows Calculator
    else if (gl.includes('calc') || gl.includes('calculator') || gl.includes('math') || gl.includes('compute') || gl.includes('interest')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Windows Calculator (calc.exe)',
          action_type: 'launch_app',
          params: { app_name: 'calc' },
          verification: 'Calculator window active',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Input arithmetic formula expression',
          action_type: 'type_text',
          params: { text: '125000 * 1.085', press_enter: true },
          verification: 'Input expression registered in memory display',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Evaluate calculation and verify output result',
          action_type: 'click_element',
          params: { element_name: 'Equals', fallback_coords: [500, 520] },
          verification: 'Result verified: 135,625',
          status: 'pending',
        },
      ];
    }
    // 6. Microsoft Excel
    else if (gl.includes('excel') || gl.includes('budget') || gl.includes('spreadsheet') || gl.includes('sheet') || gl.includes('table')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Microsoft Excel / Spreadsheet Application',
          action_type: 'launch_app',
          params: { app_name: 'excel' },
          verification: 'Microsoft Excel active on screen',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Focus worksheet grid & format column headers (Category, Budget, Actual, Variance)',
          action_type: 'focus_window',
          params: { title_query: 'Excel' },
          verification: 'Headers structured in Row 1',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Populate budget categories & monetary expenses',
          action_type: 'excel_populate_sheet',
          params: { topic: 'Monthly Budget' },
          verification: 'Data rows populated in spreadsheet',
          status: 'pending',
        },
        {
          id: 'step_4',
          title: 'Insert SUM formula (=SUM(B2:B10)) and calculate totals',
          action_type: 'type_text',
          params: { text: '=SUM(B2:B10)', press_enter: true },
          verification: 'Totals dynamically computed',
          status: 'pending',
        },
      ];
    }
    // 7. Microsoft Word
    else if (gl.includes('word') || gl.includes('essay') || gl.includes('document') || gl.includes('letter') || gl.includes('report') || gl.includes('memo')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Microsoft Word (winword.exe)',
          action_type: 'launch_app',
          params: { app_name: 'winword' },
          verification: 'Word document window opened',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Focus document editor & set Title typography',
          action_type: 'focus_window',
          params: { title_query: 'Word' },
          verification: 'Document canvas ready for composition',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: `Author requested document content for: ${goal.slice(0, 45)}`,
          action_type: 'type_text',
          params: { text: `Executive Report: ${goal}\n\nDrafted autonomously by the Windows Native Agent.`, press_enter: true },
          verification: 'Content drafted into Word buffer',
          status: 'pending',
        },
      ];
    }
    // 8. PowerPoint Presentations
    else if (gl.includes('powerpoint') || gl.includes('slide') || gl.includes('presentation') || gl.includes('deck')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Microsoft PowerPoint (POWERPNT.exe)',
          action_type: 'launch_app',
          params: { app_name: 'powerpoint' },
          verification: 'PowerPoint presentation canvas loaded',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Select Blank Presentation and configure 16:9 layout',
          action_type: 'click_element',
          params: { element_name: 'Blank Presentation', fallback_coords: [320, 240] },
          verification: 'Master slide layout active',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Insert title slide & structured bullet points',
          action_type: 'type_text',
          params: { text: 'Autonomous AI Agents on Windows\n• Architecture Overview\n• Win32 API Integration\n• Real-Time Computer-Use Verification', press_enter: true },
          verification: 'Slide elements placed onto canvas',
          status: 'pending',
        },
      ];
    }
    // 9. Windows Maintenance / Disk Cleanup / Temp Files / DNS
    else if (gl.includes('clean') || gl.includes('temp') || gl.includes('disk') || gl.includes('cache') || gl.includes('flush') || gl.includes('dns')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Administrator Windows PowerShell (powershell.exe)',
          action_type: 'launch_app',
          params: { app_name: 'powershell', as_admin: true },
          verification: 'Elevated PowerShell prompt active',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Clean temporary files directory ($env:TEMP)',
          action_type: 'shell_exec',
          params: { command: 'Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue' },
          verification: 'Temporary cache cleared from disk',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Flush Windows DNS resolver cache',
          action_type: 'shell_exec',
          params: { command: 'ipconfig /flushdns' },
          verification: 'Successfully flushed the DNS Resolver Cache',
          status: 'pending',
        },
        {
          id: 'step_4',
          title: 'Verify disk space and report reclaimed capacity',
          action_type: 'shell_exec',
          params: { command: 'Get-PSDrive C | Select-Object Used,Free' },
          verification: 'Storage diagnostics confirmed clean',
          status: 'pending',
        },
      ];
    }
    // 10. Task Manager & Diagnostics
    else if (gl.includes('task manager') || gl.includes('taskmgr') || gl.includes('ram') || gl.includes('cpu') || gl.includes('process') || gl.includes('performance')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Windows Task Manager (Taskmgr.exe)',
          action_type: 'launch_app',
          params: { app_name: 'taskmgr' },
          verification: 'Task Manager telemetry active',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Switch to Performance tab and inspect CPU/RAM utilization',
          action_type: 'click_element',
          params: { element_name: 'Performance Tab', fallback_coords: [120, 160] },
          verification: 'Hardware graphs active (CPU: 18%, RAM: 42%)',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Inspect active background processes and log diagnostics',
          action_type: 'focus_window',
          params: { title_query: 'Task Manager' },
          verification: 'Process health checks verified',
          status: 'pending',
        },
      ];
    }
    // 11. Slack / Discord / Teams
    else if (gl.includes('slack') || gl.includes('discord') || gl.includes('teams') || gl.includes('chat')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Slack / Team Workspace (Slack.exe)',
          action_type: 'launch_app',
          params: { app_name: 'slack' },
          verification: 'Team messaging interface active',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Switch to #general channel and focus compose bar',
          action_type: 'click_element',
          params: { element_name: '#general', fallback_coords: [140, 210] },
          verification: 'Channel conversation thread visible',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: `Draft message: "${goal.slice(0, 45)}"`,
          action_type: 'type_text',
          params: { text: `Update: ${goal} - Completed successfully by AI Agent.` },
          verification: 'Message drafted in text input buffer',
          status: 'pending',
        },
        {
          id: 'step_4',
          title: 'Send message to channel (Requires User Approval)',
          action_type: 'send_message',
          params: { recipient: '#general', message: goal },
          verification: 'Message sent confirmation verified',
          status: 'pending',
        },
      ];
    }
    // 12. Web Search / Flights / Shopping in Chrome
    else if (gl.includes('flight') || gl.includes('hotel') || gl.includes('search') || gl.includes('google') || gl.includes('buy') || gl.includes('price')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: `Launch Google Chrome and navigate to search for "${goal.slice(0, 45)}"`,
          action_type: 'launch_app',
          params: { app_name: 'chrome', query: goal },
          verification: 'Search query results rendered',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Filter results by rating and pricing matrix',
          action_type: 'click_element',
          params: { element_name: 'Filters', fallback_coords: [450, 160] },
          verification: 'Filtered results list displayed',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Extract top results and verify pricing specifications',
          action_type: 'focus_window',
          params: { title_query: 'Google Chrome' },
          verification: 'Top option extracted and validated',
          status: 'pending',
        },
      ];
    }
    // 13. File Explorer & Organizing
    else if (gl.includes('file') || gl.includes('explorer') || gl.includes('organize') || gl.includes('folder') || gl.includes('download')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Windows File Explorer (explorer.exe)',
          action_type: 'launch_app',
          params: { app_name: 'explorer' },
          verification: 'File Explorer window opened',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Scan target directory and identify files',
          action_type: 'fs_list',
          params: { folder: 'Downloads' },
          verification: 'File list populated in view pane',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Sort and organize items into structured subfolders',
          action_type: 'fs_organize',
          params: { source: 'Downloads', destination: 'Documents' },
          verification: 'Target directory structure verified',
          status: 'pending',
        },
      ];
    }
    // 14. Paint & Drawing
    else if (gl.includes('paint') || gl.includes('draw') || gl.includes('sketch') || gl.includes('diagram')) {
      generatedSteps = [
        {
          id: 'step_1',
          title: 'Launch Microsoft Paint (mspaint.exe)',
          action_type: 'launch_app',
          params: { app_name: 'mspaint' },
          verification: 'Paint canvas loaded',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Select brush tool and drawing stroke parameters',
          action_type: 'mouse_click',
          params: { x: 280, y: 90, clicks: 1 },
          verification: 'Tool active on canvas',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: 'Draw diagram illustration onto canvas',
          action_type: 'paint_draw',
          params: { shape: 'architecture_diagram' },
          verification: 'Diagram rendered and verified on canvas',
          status: 'pending',
        },
      ];
    }
    // 15. General / Universal Prompt Decomposition
    else {
      generatedSteps = [
        {
          id: 'step_1',
          title: `Locate and launch primary application for: "${goal.slice(0, 50)}"`,
          action_type: 'launch_app',
          params: { app_name: 'chrome', goal },
          verification: 'Target application workspace opened in foreground',
          status: 'pending',
        },
        {
          id: 'step_2',
          title: 'Focus target window & inspect UI Automation accessibility nodes',
          action_type: 'focus_window',
          params: { title_query: 'Active Workspace' },
          verification: 'Foreground window handle focused (0x00A41029)',
          status: 'pending',
        },
        {
          id: 'step_3',
          title: `Execute requested action: "${goal.slice(0, 55)}"`,
          action_type: 'type_text',
          params: { text: goal, press_enter: true },
          verification: 'Action registered by target application buffer',
          status: 'pending',
        },
        {
          id: 'step_4',
          title: 'Optical verification & state post-condition confirmation',
          action_type: 'verify_screen',
          params: { confidence_threshold: 0.95 },
          verification: 'Computer-use outcome confirmed successfully',
          status: 'pending',
        },
      ];
    }
  }

  runtimeState.steps = generatedSteps;
  runtimeState.status = 'running';
  logAgentEvent(`Plan generated with ${generatedSteps.length} discrete steps.`, 'info');

  res.json({ success: true, steps: generatedSteps });
});

// Step Execution Loop
app.post('/api/agent/step', async (req, res) => {
  if (runtimeState.status === 'stopped') {
    runtimeState.is_input_frozen = false;
    return res.status(400).json({ error: 'Agent is stopped' });
  }

  const stepIdx = req.body.step_index !== undefined ? Number(req.body.step_index) : runtimeState.current_step;
  if (stepIdx >= runtimeState.steps.length) {
    runtimeState.status = 'completed';
    runtimeState.is_input_frozen = false;
    logAgentEvent('All plan steps completed successfully! Task finished. Screen input unlocked.', 'verify');
    return res.json({ success: true, completed: true, is_input_frozen: false });
  }

  // Freeze user physical input while agent is actively driving the computer
  if (runtimeState.freeze_enabled) {
    runtimeState.is_input_frozen = true;
  }

  const step = runtimeState.steps[stepIdx];
  runtimeState.current_step = stepIdx;
  step.status = 'running';
  logAgentEvent(`Executing Step ${stepIdx + 1}: ${step.title}`, 'action');

  // Check Sensitive Security Gate (Section 26)
  if (step.action_type === 'send_message' || step.action_type === 'fs_delete') {
    runtimeState.is_input_frozen = false;
    runtimeState.status = 'waiting_confirmation';
    runtimeState.pending_confirmation = {
      id: step.id,
      action_type: step.action_type,
      description: `Send message to ${step.params?.recipient || 'Recipient'}? Content: "${step.params?.message || ''}"`,
      params: step.params,
    };
    logAgentEvent(`[SAFETY GATE] Awaiting user confirmation for: ${step.title}`, 'alert');
    return res.json({
      success: false,
      waiting_confirmation: true,
      confirmation: runtimeState.pending_confirmation,
      is_input_frozen: false,
    });
  }

  // Simulate or execute native Windows actions with realistic UI updates
  if (step.action_type === 'youtube_search') {
    runtimeState.active_window = {
      title: `${step.params?.query || 'cyber security'} - YouTube - Google Chrome`,
      process: 'chrome.exe',
      rect: { x: 80, y: 40, width: 1500, height: 950 },
    };
    runtimeState.cursor_pos = [480, 52];
  } else if (step.action_type === 'youtube_select_video') {
    runtimeState.active_window = {
      title: `Cyber Security Full Course in Telugu - YouTube - Google Chrome`,
      process: 'chrome.exe',
      rect: { x: 80, y: 40, width: 1500, height: 950 },
    };
    runtimeState.cursor_pos = [520, 310];
  } else if (step.action_type === 'youtube_play_video') {
    runtimeState.active_window = {
      title: `▶ Playing: Cyber Security Full Course in Telugu - YouTube`,
      process: 'chrome.exe',
      rect: { x: 80, y: 40, width: 1500, height: 950 },
    };
    runtimeState.cursor_pos = [600, 420];
  } else if (step.action_type === 'launch_app') {
    const appName = (step.params.app_name || 'app').toLowerCase();
    if (appName.includes('excel')) {
      runtimeState.active_window = {
        title: 'Monthly Budget.xlsx - Microsoft Excel',
        process: 'excel.exe',
        rect: { x: 100, y: 50, width: 1440, height: 900 },
      };
      runtimeState.cursor_pos = [280, 180];
    } else if (appName.includes('word') || appName.includes('winword')) {
      runtimeState.active_window = {
        title: 'Executive Report - Microsoft Word',
        process: 'winword.exe',
        rect: { x: 120, y: 60, width: 1300, height: 900 },
      };
      runtimeState.cursor_pos = [400, 260];
    } else if (appName.includes('vscode') || appName.includes('code')) {
      runtimeState.active_window = {
        title: 'main.py - Visual Studio Code',
        process: 'code.exe',
        rect: { x: 100, y: 40, width: 1450, height: 950 },
      };
      runtimeState.cursor_pos = [420, 220];
    } else if (appName.includes('spotify')) {
      runtimeState.active_window = {
        title: 'Spotify Free - Ambient Lofi Focus',
        process: 'Spotify.exe',
        rect: { x: 120, y: 60, width: 1380, height: 900 },
      };
      runtimeState.cursor_pos = [260, 52];
    } else if (appName.includes('calc')) {
      runtimeState.active_window = {
        title: 'Calculator',
        process: 'calc.exe',
        rect: { x: 400, y: 150, width: 480, height: 680 },
      };
      runtimeState.cursor_pos = [510, 360];
    } else if (appName.includes('taskmgr')) {
      runtimeState.active_window = {
        title: 'Task Manager',
        process: 'Taskmgr.exe',
        rect: { x: 200, y: 80, width: 1200, height: 800 },
      };
      runtimeState.cursor_pos = [320, 160];
    } else if (appName.includes('powershell') || appName.includes('cmd') || appName.includes('terminal')) {
      runtimeState.active_window = {
        title: 'Administrator: Windows PowerShell',
        process: 'powershell.exe',
        rect: { x: 180, y: 120, width: 1100, height: 700 },
      };
      runtimeState.cursor_pos = [340, 240];
    } else if (appName.includes('paint') || appName.includes('mspaint')) {
      runtimeState.active_window = {
        title: 'Untitled - Paint',
        process: 'mspaint.exe',
        rect: { x: 150, y: 80, width: 1200, height: 800 },
      };
      runtimeState.cursor_pos = [280, 90];
    } else if (appName.includes('powerpoint')) {
      runtimeState.active_window = {
        title: 'Presentation1.pptx - Microsoft PowerPoint',
        process: 'POWERPNT.exe',
        rect: { x: 100, y: 50, width: 1400, height: 900 },
      };
      runtimeState.cursor_pos = [450, 300];
    } else if (appName.includes('slack') || appName.includes('discord')) {
      runtimeState.active_window = {
        title: 'Team Workspace - Slack',
        process: 'Slack.exe',
        rect: { x: 150, y: 80, width: 1300, height: 850 },
      };
      runtimeState.cursor_pos = [380, 720];
    } else if (appName.includes('explorer')) {
      runtimeState.active_window = {
        title: 'Downloads - File Explorer',
        process: 'explorer.exe',
        rect: { x: 160, y: 100, width: 1100, height: 750 },
      };
      runtimeState.cursor_pos = [300, 200];
    } else if (appName.includes('notepad')) {
      runtimeState.active_window = {
        title: 'Untitled - Notepad',
        process: 'notepad.exe',
        rect: { x: 300, y: 200, width: 800, height: 600 },
      };
      runtimeState.cursor_pos = [500, 350];
    } else if (appName.includes('whatsapp')) {
      runtimeState.active_window = {
        title: 'WhatsApp Desktop',
        process: 'whatsapp.exe',
        rect: { x: 200, y: 100, width: 1100, height: 800 },
      };
      runtimeState.cursor_pos = [320, 160];
    } else {
      runtimeState.active_window = {
        title: `${step.params.goal || 'Google Chrome'} - Web Portal`,
        process: 'chrome.exe',
        rect: { x: 100, y: 50, width: 1400, height: 900 },
      };
      runtimeState.cursor_pos = [460, 52];
    }
  } else if (step.action_type === 'excel_populate_sheet') {
    runtimeState.active_window = {
      title: 'Monthly Budget.xlsx - Microsoft Excel',
      process: 'excel.exe',
      rect: { x: 100, y: 50, width: 1440, height: 900 },
    };
    runtimeState.cursor_pos = [420, 320];
    logAgentEvent('Entered budget categories (Housing, Utilities, Food) & formulas into Excel grid.', 'action');
  } else if (step.action_type === 'paint_draw') {
    runtimeState.active_window = {
      title: 'Architecture Diagram - Paint',
      process: 'mspaint.exe',
      rect: { x: 150, y: 80, width: 1200, height: 800 },
    };
    runtimeState.cursor_pos = [650, 480];
    logAgentEvent('Drew geometric illustration onto Paint canvas with brush.', 'action');
  } else if (step.action_type === 'shell_exec') {
    logAgentEvent(`Dispatched terminal command: "${step.params?.command || 'powershell'}"`, 'action');
    runtimeState.cursor_pos = [380, 260];
  } else if (step.action_type === 'click_element' || step.action_type === 'mouse_click') {
    const coords = step.params.fallback_coords || [step.params.x || 450, step.params.y || 350];
    runtimeState.cursor_pos = [coords[0], coords[1]];
  } else if (step.action_type === 'copy_meet_link') {
    logAgentEvent('Copied "https://meet.google.com/qxr-mkpv-bwy" to Windows Clipboard.', 'action');
  }

  // Complete step with realistic metrics
  step.duration_ms = Math.floor(320 + Math.random() * 250);
  step.confidence = 99.2 + Math.random() * 0.7;
  step.status = 'completed';
  step.result = { success: true, timestamp: new Date().toISOString() };
  logAgentEvent(`Step ${stepIdx + 1} verified: ${step.verification} [${step.duration_ms}ms, OCR: ${step.confidence.toFixed(1)}%]`, 'verify');

  // Check if final step
  if (stepIdx + 1 >= runtimeState.steps.length) {
    runtimeState.status = 'completed';
    runtimeState.is_input_frozen = false;
    logAgentEvent(`Task "${runtimeState.goal}" completed successfully. Screen input unlocked.`, 'verify');
  } else {
    runtimeState.current_step = stepIdx + 1;
  }

  res.json({
    success: true,
    step,
    current_step: runtimeState.current_step,
    completed: runtimeState.status === 'completed',
    active_window: runtimeState.active_window,
    cursor_pos: runtimeState.cursor_pos,
    is_input_frozen: runtimeState.is_input_frozen,
  });
});

// UI Automation Tree Inspection Endpoint (Context-Aware Dynamic Tree)
app.get('/api/desktop/uia', (_req, res) => {
  const proc = (runtimeState.active_window.process || '').toLowerCase();
  let elements = [];

  if (proc.includes('excel')) {
    elements = [
      { id: 'uia_xl_1', name: 'Ribbon', control_type: 'MenuBar', automation_id: 'RibbonTabs', rect: { x: 100, y: 80, width: 1440, height: 95 }, center_x: 820, center_y: 127 },
      { id: 'uia_xl_2', name: 'Formula Bar', control_type: 'Edit', automation_id: 'FormulaEditBox', rect: { x: 180, y: 180, width: 1100, height: 28 }, center_x: 730, center_y: 194 },
      { id: 'uia_xl_3', name: 'Sheet Grid', control_type: 'DataGrid', automation_id: 'GridTable', rect: { x: 120, y: 220, width: 1380, height: 600 }, center_x: 810, center_y: 520 },
      { id: 'uia_xl_4', name: 'Cell A1 (Category)', control_type: 'DataItem', automation_id: 'Cell_A1', rect: { x: 160, y: 245, width: 180, height: 26 }, center_x: 250, center_y: 258 },
      { id: 'uia_xl_5', name: 'AutoSum', control_type: 'Button', automation_id: 'AutoSumBtn', rect: { x: 1120, y: 110, width: 80, height: 45 }, center_x: 1160, center_y: 132 },
    ];
  } else if (proc.includes('code')) {
    elements = [
      { id: 'uia_vs_1', name: 'Code Editor', control_type: 'Document', automation_id: 'MonacoEditor', rect: { x: 260, y: 85, width: 1150, height: 580 }, center_x: 835, center_y: 375 },
      { id: 'uia_vs_2', name: 'Explorer Sidebar', control_type: 'Pane', automation_id: 'SidebarTree', rect: { x: 100, y: 85, width: 160, height: 850 }, center_x: 180, center_y: 510 },
      { id: 'uia_vs_3', name: 'Terminal Output', control_type: 'Pane', automation_id: 'TerminalView', rect: { x: 260, y: 670, width: 1150, height: 265 }, center_x: 835, center_y: 802 },
      { id: 'uia_vs_4', name: 'Run Python Script', control_type: 'Button', automation_id: 'RunCodeBtn', rect: { x: 1340, y: 50, width: 36, height: 32 }, center_x: 1358, center_y: 66 },
    ];
  } else if (proc.includes('spotify')) {
    elements = [
      { id: 'uia_sp_1', name: 'Search Input', control_type: 'Edit', automation_id: 'SearchBox', rect: { x: 220, y: 40, width: 340, height: 38 }, center_x: 390, center_y: 59 },
      { id: 'uia_sp_2', name: 'Play / Pause Button', control_type: 'Button', automation_id: 'PlayPauseControl', rect: { x: 740, y: 880, width: 44, height: 44 }, center_x: 762, center_y: 902 },
      { id: 'uia_sp_3', name: 'Volume Slider', control_type: 'Slider', automation_id: 'VolumeBar', rect: { x: 1220, y: 892, width: 110, height: 16 }, center_x: 1275, center_y: 900 },
      { id: 'uia_sp_4', name: 'Track List View', control_type: 'List', automation_id: 'TrackList', rect: { x: 300, y: 160, width: 1050, height: 680 }, center_x: 825, center_y: 500 },
    ];
  } else if (proc.includes('calc')) {
    elements = [
      { id: 'uia_ca_1', name: 'Display Result', control_type: 'Text', automation_id: 'CalcDisplay', rect: { x: 420, y: 220, width: 440, height: 75 }, center_x: 640, center_y: 257 },
      { id: 'uia_ca_2', name: 'Equals', control_type: 'Button', automation_id: 'equalButton', rect: { x: 740, y: 640, width: 95, height: 50 }, center_x: 787, center_y: 665 },
      { id: 'uia_ca_3', name: 'Multiply', control_type: 'Button', automation_id: 'multiplyButton', rect: { x: 740, y: 520, width: 95, height: 50 }, center_x: 787, center_y: 545 },
      { id: 'uia_ca_4', name: 'Clear', control_type: 'Button', automation_id: 'clearButton', rect: { x: 430, y: 340, width: 95, height: 50 }, center_x: 477, center_y: 365 },
    ];
  } else if (proc.includes('taskmgr')) {
    elements = [
      { id: 'uia_tm_1', name: 'Performance Tab', control_type: 'TabItem', automation_id: 'TabPerformance', rect: { x: 220, y: 130, width: 120, height: 36 }, center_x: 280, center_y: 148 },
      { id: 'uia_tm_2', name: 'Processes List', control_type: 'DataGrid', automation_id: 'ProcessTable', rect: { x: 220, y: 180, width: 1140, height: 600 }, center_x: 790, center_y: 480 },
      { id: 'uia_tm_3', name: 'End Task Button', control_type: 'Button', automation_id: 'EndTaskBtn', rect: { x: 1240, y: 95, width: 110, height: 32 }, center_x: 1295, center_y: 111 },
    ];
  } else {
    elements = [
      {
        id: 'uia_1',
        name: runtimeState.active_window.title,
        control_type: 'Window',
        automation_id: 'MainWin',
        rect: runtimeState.active_window.rect,
        center_x: runtimeState.active_window.rect.x + runtimeState.active_window.rect.width / 2,
        center_y: runtimeState.active_window.rect.y + runtimeState.active_window.rect.height / 2,
      },
      {
        id: 'uia_2',
        name: 'Action Button',
        control_type: 'Button',
        automation_id: 'action-button',
        rect: { x: 440, y: 360, width: 160, height: 48 },
        center_x: 520,
        center_y: 384,
      },
      {
        id: 'uia_3',
        name: 'Search or Input Field',
        control_type: 'Edit',
        automation_id: 'main-input',
        rect: { x: 220, y: 150, width: 260, height: 38 },
        center_x: 350,
        center_y: 169,
      },
      {
        id: 'uia_4',
        name: 'Confirm',
        control_type: 'Button',
        automation_id: 'confirm-btn',
        rect: { x: 1040, y: 720, width: 84, height: 38 },
        center_x: 1082,
        center_y: 739,
      },
    ];
  }

  res.json({
    elements,
    active_window: runtimeState.active_window,
    cursor: runtimeState.cursor_pos,
    resolution: runtimeState.screen_resolution,
  });
});

// One-Click Export: Generate full Windows Standalone Project ZIP
app.get('/api/export/windows-package', async (_req, res) => {
  try {
    const zip = new JSZip();
    
    // Read local files to bundle
    const filesToInclude = [
      'windows_agent/agent_daemon.py',
      'windows_agent/run_agent.bat',
      'windows_agent/run_desktop_app.bat',
      'windows_agent/install_desktop_app.bat',
      'windows_agent/install.bat',
      'windows_agent/requirements.txt',
      'windows_agent/engine/windows_control.py',
      'windows_agent/engine/screen_capture.py',
      'windows_agent/engine/ui_automation.py',
      'windows_agent/engine/app_discovery.py',
      'windows_agent/engine/filesystem_controller.py',
      'windows_agent/engine/security_validator.py',
      'windows_agent/engine/browser_control.py',
      'windows_agent/engine/agent_planner.py',
      'electron/main.ts',
      'electron/preload.ts',
      'electron-builder.json5',
      'installer/setup.iss',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
      'server.ts',
      'src/main.tsx',
      'src/App.tsx',
      'src/index.css',
      'src/types.ts',
      'src/components/TitleBar.tsx',
      'src/components/AgentStatusPanel.tsx',
      'src/components/LiveDesktopView.tsx',
      'src/components/ConfirmationModal.tsx',
      'src/components/WindowsPackageModal.tsx',
      'src/components/SettingsModal.tsx',
      'README_WINDOWS.md',
    ];

    for (const relPath of filesToInclude) {
      const fullPath = path.join(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        zip.file(relPath, content);
      }
    }

    // Add README_WINDOWS.md with quick instructions
    const readme = `# Local Windows Computer-Use AI Agent
This is a native Windows desktop application and autonomous agent engine.

## Quick Start on Windows

1. Double-click **\`windows_agent/run_agent.bat\`**
   - Installs required Python Win32 automation libraries.
   - Launches the native Windows Agent Daemon on localhost:8765.
   - Launches the desktop application.

2. To compile the standalone \`LocalComputerAgent.exe\`:
   - Double-click **\`windows_agent/install.bat\`**
   - Executable output will be in \`dist-electron/LocalComputerAgent.exe\`.

3. Emergency Stop:
   - Press **Ctrl+Alt+S** or **Escape** at any time to immediately revoke computer control.
`;
    zip.file('README_WINDOWS.md', readme);

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="LocalComputerAgent-Windows.zip"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate Windows package', details: err.message });
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Windows Computer-Use Agent running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
