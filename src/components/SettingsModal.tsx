import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Server, Shield, Cpu, KeyRound } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [modelProvider, setModelProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [safetyMode, setSafetyMode] = useState<'normal' | 'strict' | 'autonomous'>('normal');
  const [sysInfo, setSysInfo] = useState<{ has_gemini_key: boolean; ollama_url: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/health')
        .then((r) => r.json())
        .then((data) => setSysInfo(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Agent Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Model provider & Computer-Use Safety Boundaries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider selection */}
        <div className="space-y-3 text-xs">
          <label className="font-semibold text-slate-700 dark:text-slate-300 block">
            Intelligence Engine
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setModelProvider('gemini')}
              className={`p-3 rounded-lg border text-left transition-all ${
                modelProvider === 'gemini'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-semibold text-xs flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                Gemini 3.8 Flash
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Multimodal vision & computer-use grounding.
              </p>
            </button>

            <button
              onClick={() => setModelProvider('ollama')}
              className={`p-3 rounded-lg border text-left transition-all ${
                modelProvider === 'ollama'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-semibold text-xs flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-500" />
                Local Ollama
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Offline execution via localhost:11434.
              </p>
            </button>
          </div>

          {/* System status note */}
          <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Gemini Key Status:</span>
            <span className={`font-semibold ${sysInfo?.has_gemini_key ? 'text-emerald-500' : 'text-amber-500'}`}>
              {sysInfo?.has_gemini_key ? 'Configured in Environment' : 'Using Local Fallback Planner'}
            </span>
          </div>
        </div>

        {/* Safety & Permission policy */}
        <div className="space-y-2 text-xs">
          <label className="font-semibold text-slate-700 dark:text-slate-300 block">
            Permission & Safeguard Policy
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'normal', title: 'Normal (Recommended)', desc: 'Ask confirmation before sending messages, making purchases, or deleting files.' },
              { id: 'strict', title: 'Strict Verification', desc: 'Ask confirmation for all external app interactions.' },
              { id: 'autonomous', title: 'Autonomous', desc: 'Only stop for critical system modifications.' },
            ].map((mode) => (
              <label
                key={mode.id}
                onClick={() => setSafetyMode(mode.id as any)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  safetyMode === mode.id
                    ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="safetyMode"
                  checked={safetyMode === mode.id}
                  onChange={() => setSafetyMode(mode.id as any)}
                  className="mt-0.5 text-purple-600"
                />
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">{mode.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{mode.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Hotkeys */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-xs space-y-1 text-slate-600 dark:text-slate-400">
          <div className="font-semibold text-slate-700 dark:text-slate-300">Global Windows Hotkeys</div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Emergency Abort:</span>
            <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Ctrl+Alt+S</kbd>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Stop Active Action:</span>
            <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Escape</kbd>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
