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
  Unlock,
  Maximize2,
  Minimize2,
  Clock,
  Activity,
  Brain,
  FileText,
  Radio
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
    id: 'notepad-scratch',
    label: '📝 Notepad: Start from Scratch (Ctrl+N)',
    prompt: 'Open Notepad, start from scratch with a clean document, and type Hello World!',
  },
  {
    id: 'notepad-append',
    label: '📌 Notepad: Append to Existing File',
    prompt: 'In that Notepad, write something: Autonomous task execution completed successfully.',
  },
  {
    id: 'youtube-telugu',
    label: '▶ YouTube: Cyber Security Telugu (Top Views)',
    prompt: 'Open Youtube and search for cyber security courses in Telugu Pick a cyber security course video which has more views and then play the video',
  },
  {
    id: 'whatsapp-message',
    label: '💬 WhatsApp: Message Rahul',
    prompt: 'Open WhatsApp, find Rahul, and send him: Hi Rahul, meeting link is ready: https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'excel-budget',
    label: '📊 Excel: Monthly Budget with Formulas',
    prompt: 'Open Excel, create a monthly budget sheet with categories, budget vs actual expenses, and compute totals with SUM formulas',
  },
  {
    id: 'word-report',
    label: '📄 Word: Draft Executive Report',
    prompt: 'Open Word and write an executive summary report with headings, bullet points, and conclusions',
  },
  {
    id: 'powershell-ping',
    label: '⚡ PowerShell: Network Diagnostics',
    prompt: 'Launch Windows PowerShell, run ping 8.8.8.8 and verify network latency',
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
  const [minimizedBoxMode, setMinimizedBoxMode] = useState(false);
  const [speed, setSpeed] = useState<'observable' | 'normal' | 'fast'>('observable');
  const executionLoopRef = useRef<boolean>(false);

  // Poll agent status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent/status');
      if (res.ok) {
        const data: AgentState = await res.json();
        setAgentState(data);
        if (data.speed && (data.speed === 'observable' || data.speed === 'normal' || data.speed === 'fast')) {
          setSpeed(data.speed);
        }
      }
    } catch (err) {
      console.warn('Status poll error:', err);
    }
  };

  const updateSpeed = async (newSpeed: 'observable' | 'normal' | 'fast') => {
    setSpeed(newSpeed);
    try {
      await fetch('/api/agent/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed: newSpeed }),
      });
      await fetchStatus();
    } catch (err) {
      console.warn('Speed update error:', err);
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
    // Minimize into box mode to let user see desktop action and animations clearly
    setMinimizedBoxMode(true);

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
        // Human observable delay so user can visually follow every single action
        const stepDelay = speed === 'observable' ? 2500 : speed === 'normal' ? 1400 : 600;
        setTimeout(() => {
          runNextStep(stepIdx + 1);
        }, stepDelay);
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

      {/* Top Section: Goal Prompt Card & Presets (hidden in minimizedBoxMode to maximize local desktop canvas) */}
      {!minimizedBoxMode ? (
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
          <div className="max-w-6xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                What would you like me to do?
              </label>
              <div className="flex items-center gap-3">
                {/* Speed Switcher */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>Execution Speed:</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px] ml-1">
                    <button
                      onClick={() => updateSpeed('observable')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${speed === 'observable' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                      title="Slowest pace (2.5s per step) - optimal for visually observing mouse clicks, window switching, and typing"
                    >
                      Observable (2.5s)
                    </button>
                    <button
                      onClick={() => updateSpeed('normal')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${speed === 'normal' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                    >
                      Normal (1.4s)
                    </button>
                    <button
                      onClick={() => updateSpeed('fast')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${speed === 'fast' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                    >
                      Fast (0.6s)
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400">|</span>

                <button
                  onClick={() => setMinimizedBoxMode(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Minimize agent UI into a floating box in the corner while watching the screen"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Minimized Box View</span>
                </button>
              </div>
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
                  placeholder="e.g. Open Notepad and type hello world, or Open Youtube and play top viewed cyber security course..."
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
      ) : (
        /* Slim Active Bar when in Minimized Box Mode */
        <div className="h-9 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Co-Work Native Agent</span>
            </span>
            <span className="text-[11px] text-slate-400 border-l border-slate-700 pl-3 truncate max-w-md">
              Target: <strong className="text-slate-200">{activeWindow.title || 'Windows Desktop'}</strong>
            </span>
            {agentState.is_input_frozen && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                BLOCKINPUT LOCKED
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>Speed:</span>
              <span className="font-semibold text-blue-300 uppercase">{speed}</span>
            </div>
            <button
              onClick={() => setMinimizedBoxMode(false)}
              className="px-2.5 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white font-medium text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Expand Split Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Agent Status & Steps (hidden in minimizedBoxMode) */}
        {!minimizedBoxMode && (
          <div className="w-[380px] lg:w-[440px] shrink-0 h-full">
            <AgentStatusPanel
              status={agentState.status}
              currentStep={agentState.current_step}
              steps={agentState.steps}
              activeWindow={agentState.active_window}
              resolution={agentState.screen_resolution}
              cursorPos={agentState.cursor_pos}
              logs={agentState.logs}
              reasoning={agentState.reasoning}
            />
          </div>
        )}

        {/* Live Desktop View (Full screen in Minimized Mode with animations around the screen) */}
        <div className="flex-1 h-full relative">
          <LiveDesktopView
            activeWindow={agentState.active_window}
            cursorPos={agentState.cursor_pos}
            resolution={agentState.screen_resolution}
            isControlling={isControlling}
            isInputFrozen={agentState.is_input_frozen}
            freezeEnabled={agentState.freeze_enabled}
            goal={goal}
            currentStepTitle={agentState.steps[agentState.current_step]?.title}
            onEmergencyUnfreeze={handleEmergencyUnfreeze}
            onToggleFreeze={handleToggleFreeze}
            onRefresh={fetchStatus}
          />

          {/* Minimized Floating Box (When user runs agent or clicks Minimized Box View) */}
          {minimizedBoxMode && (
            <div className="absolute bottom-5 right-5 w-96 max-w-[calc(100vw-2.5rem)] bg-slate-900/95 text-slate-100 border-2 border-blue-500 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
              {/* Floating Box Header */}
              <div className="p-3 bg-slate-850 border-b border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span className="font-bold text-xs tracking-wide text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    CO-WORK AGENT (MINIMIZED)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                    {agentState.steps.length > 0 ? `${agentState.current_step + 1}/${agentState.steps.length}` : 'Ready'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMinimizedBoxMode(false)}
                    className="p-1 rounded hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
                    title="Expand to Full Split Dashboard"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Floating Box Body */}
              <div className="p-3 space-y-2.5 text-xs">
                {/* Current Step / Action */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Active Step</span>
                    <span className="text-emerald-400 font-mono">
                      {agentState.steps.length > 0 ? `Step ${agentState.current_step + 1} of ${agentState.steps.length}` : 'Idle'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white leading-snug">
                    {agentState.steps[agentState.current_step]?.title || agentState.goal || goal || 'Awaiting task instructions...'}
                  </div>
                  {agentState.steps[agentState.current_step]?.description && (
                    <div className="text-[11px] text-slate-400 line-clamp-2">
                      {agentState.steps[agentState.current_step]?.description}
                    </div>
                  )}
                </div>

                {/* Badges: Input Locked, Scratch Mode, Speed */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  {agentState.is_input_frozen && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-semibold animate-pulse">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      Mouse & Keyboard Frozen
                    </span>
                  )}
                  {agentState.active_window.scratch_mode !== false && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">
                      ✨ Scratch Buffer (Clean)
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5 text-indigo-400" />
                    {speed === 'observable' ? '2.5s / step' : speed === 'normal' ? '1.4s / step' : '0.6s / step'}
                  </span>
                </div>

                {/* Speed Selector in Floating Box */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" /> Speed:
                  </span>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      onClick={() => updateSpeed('observable')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${speed === 'observable' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                      title="Slowest (2.5s) so you can easily observe what is happening"
                    >
                      Observable (2.5s)
                    </button>
                    <button
                      onClick={() => updateSpeed('normal')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${speed === 'normal' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Normal (1.4s)
                    </button>
                    <button
                      onClick={() => updateSpeed('fast')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${speed === 'fast' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Fast (0.6s)
                    </button>
                  </div>
                </div>

                {/* Floating Action Controls */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handlePauseResume}
                    disabled={agentState.status === 'idle' || agentState.status === 'completed'}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {agentState.status === 'paused' ? (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3" />
                        Pause
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleEmergencyStop('Stopped from Minimized Box')}
                    className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>Stop (Esc)</span>
                  </button>

                  <button
                    onClick={() => setMinimizedBoxMode(false)}
                    className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Expand to Full Split Dashboard"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
