import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  RefreshCw, 
  Sparkles, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react';

import { TitleBar } from './components/TitleBar';
import { AgentStatusPanel } from './components/AgentStatusPanel';
import { LiveDesktopView } from './components/LiveDesktopView';
import { ConfirmationModal } from './components/ConfirmationModal';
import { WindowsPackageModal } from './components/WindowsPackageModal';
import { SettingsModal } from './components/SettingsModal';
import type { AgentState } from './types';

const PRESET_SCENARIOS = [
  {
    id: 'excel-budget',
    label: '📊 Excel: Monthly Budget with Formulas',
    prompt: 'Open Excel, create a monthly budget sheet with categories, budget vs actual expenses, and compute totals with SUM formulas',
  },
  {
    id: 'word-report',
    label: '📝 Word: Draft Executive Report',
    prompt: 'Open Word and write an executive summary report with headings, bullet points, and conclusions',
  },
  {
    id: 'gmail-send',
    label: '✉️ Gmail: Send Project Update',
    prompt: 'Open Gmail and compose a status update email to team@company.com with scheduled deliverables',
  },
  {
    id: 'powershell-ping',
    label: '⚡ PowerShell: Network Diagnostics',
    prompt: 'Launch Windows PowerShell, run ping 8.8.8.8 and verify network latency',
  },
  {
    id: 'paint-draw',
    label: '🎨 Paint: Draw Architecture Diagram',
    prompt: 'Open Microsoft Paint and draw a system diagram with connected boxes on canvas',
  },
  {
    id: 'youtube-telugu',
    label: '▶ YouTube: Cyber Security Telugu (Top Views)',
    prompt: 'Open Youtube and search for cyber security courses in Telugu Pick a cyber security course video which has more views and then play the video',
  },
  {
    id: 'meet-whatsapp',
    label: 'Chrome Meet + WhatsApp',
    prompt: 'Open Chrome, create a Google Meet link, open WhatsApp, find Rahul, and send him the meeting link.',
  },
  {
    id: 'organize-pdfs',
    label: '📁 Explorer: Organize Files',
    prompt: 'Open File Explorer and organize all PDFs in Downloads into a folder called Documents.',
  },
];

export function App() {
  const [goal, setGoal] = useState('Open Chrome, create a Google Meet link, open WhatsApp, find Rahul, and send him the meeting link.');
  const [agentState, setAgentState] = useState<AgentState>({
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
    logs: [
      { time: '10:40:00', message: 'Local Windows Computer-Use Engine initialized.', type: 'info' },
    ],
  });

  const [isPlanning, setIsPlanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const executionLoopRef = useRef<boolean>(false);

  // Poll agent status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent/status');
      if (res.ok) {
        const data: AgentState = await res.json();
        setAgentState(data);
      }
    } catch (err) {
      console.warn('Status poll error:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  // Global hotkeys (Ctrl+Alt+S and Escape for emergency stop & unfreeze)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') || e.key === 'Escape') {
        e.preventDefault();
        handleEmergencyStop('Global Emergency Key pressed');
        handleEmergencyUnfreeze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Listen to Electron IPC if running inside native Electron
    if ((window as any).electronAPI?.onEmergencyStop) {
      (window as any).electronAPI.onEmergencyStop((data: any) => {
        handleEmergencyStop(data?.reason || 'Electron Global Shortcut');
        handleEmergencyUnfreeze();
      });
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Start plan and autonomous execution loop
  const handleRunAgent = async () => {
    if (!goal.trim()) return;

    setIsPlanning(true);
    executionLoopRef.current = true;

    try {
      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });

      const data = await res.json();
      setIsPlanning(false);

      if (data.steps && data.steps.length > 0) {
        // Trigger step-by-step execution loop
        runNextStep(0);
      }
    } catch (err) {
      setIsPlanning(false);
      console.error('Plan error:', err);
    }
  };

  const runNextStep = async (stepIdx: number) => {
    if (!executionLoopRef.current) return;

    try {
      const res = await fetch('/api/agent/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_index: stepIdx }),
      });

      const result = await res.json();
      await fetchStatus();

      if (result.waiting_confirmation) {
        // Stop autonomous loop while awaiting confirmation
        executionLoopRef.current = false;
        return;
      }

      if (result.completed) {
        executionLoopRef.current = false;
        return;
      }

      if (result.success && executionLoopRef.current) {
        // Proceed to next step after brief observation delay
        setTimeout(() => {
          runNextStep(stepIdx + 1);
        }, 1200);
      }
    } catch (err) {
      console.error('Execution step error:', err);
      executionLoopRef.current = false;
    }
  };

  const handleEmergencyStop = async (reason: string = 'User pressed Emergency Stop button') => {
    executionLoopRef.current = false;
    try {
      await fetch('/api/agent/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      await fetchStatus();
    } catch (err) {
      console.error('Emergency stop error:', err);
    }
  };

  const handleEmergencyUnfreeze = async () => {
    try {
      await fetch('/api/agent/emergency-unfreeze', { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error('Emergency unfreeze error:', err);
    }
  };

  const handleToggleFreeze = async () => {
    try {
      const res = await fetch('/api/agent/freeze-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !agentState.freeze_enabled }),
      });
      const data = await res.json();
      setAgentState(prev => ({
        ...prev,
        freeze_enabled: data.freeze_enabled,
        is_input_frozen: data.is_input_frozen,
      }));
    } catch (err) {
      console.error('Toggle freeze error:', err);
    }
  };

  const handlePauseResume = async () => {
    if (agentState.status === 'running') {
      executionLoopRef.current = false;
      await fetch('/api/agent/pause', { method: 'POST' });
    } else {
      executionLoopRef.current = true;
      await fetch('/api/agent/resume', { method: 'POST' });
      runNextStep(agentState.current_step);
    }
    fetchStatus();
  };

  const handleApproveConfirmation = async (actionId: string) => {
    try {
      await fetch('/api/agent/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId, approved: true }),
      });
      await fetchStatus();
      // Resume execution loop
      executionLoopRef.current = true;
      setTimeout(() => {
        runNextStep(agentState.current_step + 1);
      }, 1000);
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  const handleCancelConfirmation = async (actionId: string) => {
    try {
      await fetch('/api/agent/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId, approved: false }),
      });
      await fetchStatus();
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const isControlling = agentState.status === 'running';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 select-none">
      {/* Native Windows Styled TitleBar */}
      <TitleBar
        status={agentState.status}
        onOpenSettings={() => setShowSettings(true)}
        onOpenPackage={() => setShowPackageModal(true)}
      />

      {/* Top Section: Goal Prompt Card & Presets */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              What would you like me to do?
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Operates real Windows apps: Chrome, WhatsApp, Notepad, Explorer, VS Code
            </span>
          </div>

          {/* Goal Input & Action Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isPlanning && !isControlling) {
                    handleRunAgent();
                  }
                }}
                placeholder="e.g. Open Chrome, create a Google Meet link, open WhatsApp, find Rahul, and send him the meeting link."
                className="w-full h-11 px-4 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={handleRunAgent}
              disabled={isPlanning || isControlling || !goal.trim()}
              className="h-11 px-6 rounded-lg font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {isPlanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Planning...</span>
                </>
              ) : isControlling ? (
                <>
                  <Play className="w-4 h-4" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>RUN AGENT</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Scenario Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1">
              Quick Scenarios:
            </span>
            {PRESET_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setGoal(scenario.prompt)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Two-Column Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Agent Status & Steps (35% width, max 480px) */}
        <div className="w-[380px] lg:w-[440px] shrink-0 h-full">
          <AgentStatusPanel
            status={agentState.status}
            currentStep={agentState.current_step}
            steps={agentState.steps}
            activeWindow={agentState.active_window}
            resolution={agentState.screen_resolution}
            cursorPos={agentState.cursor_pos}
            logs={agentState.logs}
          />
        </div>

        {/* Right Column: Live Desktop View & Perception Inspector (65% width) */}
        <div className="flex-1 h-full">
          <LiveDesktopView
            activeWindow={agentState.active_window}
            cursorPos={agentState.cursor_pos}
            resolution={agentState.screen_resolution}
            isControlling={isControlling}
            isInputFrozen={agentState.is_input_frozen}
            freezeEnabled={agentState.freeze_enabled}
            goal={goal}
            currentStepTitle={agentState.current_step?.title}
            onEmergencyUnfreeze={handleEmergencyUnfreeze}
            onToggleFreeze={handleToggleFreeze}
            onRefresh={fetchStatus}
          />
        </div>
      </div>

      {/* Bottom Emergency & Control Bar */}
      <div className="h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shadow-lg shrink-0">
        {/* Left: Pause / Resume & Emergency Stop */}
        <div className="flex items-center gap-3">
          {/* Pause / Resume button */}
          <button
            onClick={handlePauseResume}
            disabled={agentState.status === 'idle' || agentState.status === 'completed'}
            className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {agentState.status === 'paused' ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                RESUME
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                PAUSE
              </>
            )}
          </button>

          {/* Emergency Stop Button (Prominent Red) */}
          <button
            onClick={() => handleEmergencyStop('Emergency Stop button pressed')}
            className="h-9 px-5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="Immediately revoke computer control (Hotkey: Ctrl+Alt+S or Esc)"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>STOP AGENT</span>
            <span className="text-[10px] opacity-80 font-mono bg-rose-700 px-1 py-0.5 rounded ml-0.5">
              Esc / Ctrl+Alt+S
            </span>
          </button>

          {/* Screen Freeze Lock Toggle */}
          <button
            onClick={handleToggleFreeze}
            className={`h-9 px-3 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              agentState.freeze_enabled
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/20'
                : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title="Freeze physical mouse and keyboard while the agent performs tasks to avoid user interference"
          >
            {agentState.freeze_enabled ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>Auto-Freeze: {agentState.freeze_enabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Live Frozen State Indicator Badge */}
          {agentState.is_input_frozen && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold animate-pulse shadow-md">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>INPUT LOCKED</span>
              <button
                onClick={handleEmergencyUnfreeze}
                className="ml-1 px-2 py-0.5 bg-slate-950 hover:bg-slate-900 text-amber-300 rounded text-[10px] font-mono cursor-pointer transition-colors"
                title="Instantly unfreeze physical keyboard and mouse (Esc)"
              >
                UNLOCK (ESC)
              </button>
            </div>
          )}
        </div>

        {/* Center: Live Status Ticker */}
        <div className="flex items-center gap-2 text-xs">
          {agentState.status === 'running' ? (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Controlling Windows Desktop • Step {agentState.current_step + 1} of {agentState.steps.length}</span>
            </div>
          ) : agentState.status === 'waiting_confirmation' ? (
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold animate-bounce">
              <ShieldAlert className="w-4 h-4" />
              <span>Paused: Awaiting user confirmation for sensitive action</span>
            </div>
          ) : agentState.status === 'completed' ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Task finished successfully</span>
            </div>
          ) : agentState.status === 'stopped' ? (
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Agent stopped. Computer control released.</span>
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              Ready to operate local computer. Enter instructions above.
            </span>
          )}
        </div>

        {/* Right: Architecture & Mode Badge */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Win32 SendInput & UIA Core</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Sensitive Actions (Section 26) */}
      <ConfirmationModal
        confirmation={agentState.pending_confirmation}
        onApprove={handleApproveConfirmation}
        onCancel={handleCancelConfirmation}
      />

      {/* Windows Package & Installer Hub Modal */}
      <WindowsPackageModal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;
