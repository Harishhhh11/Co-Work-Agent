import { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  AlertTriangle, 
  Terminal, 
  Activity, 
  Cpu, 
  MousePointer, 
  Layout, 
  ShieldAlert 
} from 'lucide-react';
import type { AgentStep, ActiveWindowInfo, LogEntry } from '../types';

interface AgentStatusPanelProps {
  status: string;
  currentStep: number;
  steps: AgentStep[];
  activeWindow: ActiveWindowInfo;
  resolution: [number, number];
  cursorPos: [number, number];
  logs: LogEntry[];
}

export function AgentStatusPanel({
  status,
  currentStep,
  steps,
  activeWindow,
  resolution,
  cursorPos,
  logs,
}: AgentStatusPanelProps) {
  const [activeTab, setActiveTab] = useState<'plan' | 'logs'>('plan');

  const getStepIcon = (step: AgentStep, idx: number) => {
    if (step.status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    }
    if (step.status === 'running' || (status === 'running' && idx === currentStep)) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0 mt-0.5" />;
    }
    if (step.status === 'failed') {
      return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
    }
    return <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header & Tabs */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-200">
            Agent Status & Perception
          </h2>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-xs">
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              activeTab === 'plan'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Plan ({steps.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1 ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3 h-3" />
            Win32 Logs
          </button>
        </div>
      </div>

      {/* Windows Telemetry / Hardware Bar */}
      <div className="bg-slate-50 dark:bg-slate-850 p-2.5 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Layout className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate" title={activeWindow.title}>
            {activeWindow.process || 'explorer.exe'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <MousePointer className="w-3.5 h-3.5 text-slate-400" />
          <span>x:{cursorPos[0]} y:{cursorPos[1]}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>{resolution[0]}×{resolution[1]}</span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'plan' ? (
          <div>
            {steps.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">No active plan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Type a task above or select a preset to generate autonomous Windows control steps.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {steps.map((step, idx) => {
                  const isCurrent = idx === currentStep && status === 'running';
                  return (
                    <div
                      key={step.id || idx}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-xs'
                          : step.status === 'completed'
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/40 text-slate-700 dark:text-slate-300'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {getStepIcon(step, idx)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                              Step {idx + 1}: {step.title}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase shrink-0">
                              {step.action_type.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Verification Rule */}
                          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Verify:</span>
                            <span className="truncate">{step.verification}</span>
                          </div>

                          {/* Parameter summary */}
                          {step.params && Object.keys(step.params).length > 0 && (
                            <div className="mt-1 text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                              {JSON.stringify(step.params)}
                            </div>
                          )}

                          {step.status === 'failed' && (
                            <div className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Action verification failed • Re-planning autonomously
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Win32 Terminal Logs */
          <div className="space-y-1.5 font-mono text-[11px]">
            {logs.map((log, idx) => {
              let color = 'text-slate-600 dark:text-slate-400';
              if (log.type === 'action') color = 'text-blue-600 dark:text-blue-400 font-medium';
              if (log.type === 'verify') color = 'text-emerald-600 dark:text-emerald-400';
              if (log.type === 'alert') color = 'text-rose-600 dark:text-rose-400 font-semibold';

              return (
                <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 text-[10px] shrink-0">{log.time}</span>
                  <span className={`break-words ${color}`}>{log.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Foreground Application Banner */}
      <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400">Foreground Target:</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]" title={activeWindow.title}>
          {activeWindow.title || 'Windows Desktop'}
        </span>
      </div>
    </div>
  );
}
