import { useState } from 'react';
import { 
  Monitor, 
  Minus, 
  Square, 
  X, 
  Download, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Radio
} from 'lucide-react';

interface TitleBarProps {
  status: string;
  onOpenSettings: () => void;
  onOpenPackage: () => void;
}

export function TitleBar({ status, onOpenSettings, onOpenPackage }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);

  const toggleAlwaysOnTop = () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    if ((window as any).electronAPI?.toggleAlwaysOnTop) {
      (window as any).electronAPI.toggleAlwaysOnTop(next);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            CONTROLLING PC
          </span>
        );
      case 'planning':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-spin" />
            PLANNING
          </span>
        );
      case 'waiting_confirmation':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            AWAITING APPROVAL
          </span>
        );
      case 'stopped':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            STOPPED
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
            ✓ TASK COMPLETE
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 border border-slate-500/20">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            ● LOCAL RUNTIME
          </span>
        );
    }
  };

  return (
    <header className="h-11 bg-slate-900 text-slate-200 flex items-center justify-between px-3 select-none border-b border-slate-800 shadow-sm shrink-0">
      {/* App Icon & Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
          <Monitor className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-white">Local Computer Agent</span>
          <span className="text-[11px] text-slate-400 font-mono">v1.0 • Windows x64</span>
        </div>
        <div className="ml-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {/* Floating Mode */}
        <button
          onClick={toggleAlwaysOnTop}
          title="Float always on top while agent controls PC"
          className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
            alwaysOnTop 
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span className="text-[10px]">📌</span> Always on Top
        </button>

        {/* Windows Package / Installer Download */}
        <button
          onClick={onOpenPackage}
          title="Install as Windows Desktop Application"
          className="px-2.5 py-1 text-xs font-medium rounded bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600/50 transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Install Desktop App</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings & LLM Provider"
          aria-label="Settings & LLM Provider"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Windows Window Controls */}
        <div className="flex items-center ml-2 border-l border-slate-800 pl-1">
          <button 
            aria-label="Minimize Window"
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            aria-label="Maximize Window"
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            aria-label="Close Window"
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
