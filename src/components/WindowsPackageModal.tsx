import { useState } from 'react';
import { 
  Download, 
  X, 
  Check, 
  FileCode, 
  ShieldCheck, 
  Terminal, 
  Package, 
  Copy 
} from 'lucide-react';

interface WindowsPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WindowsPackageModal({ isOpen, onClose }: WindowsPackageModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      window.location.href = '/api/export/windows-package';
      setTimeout(() => setDownloading(false), 2000);
    } catch (err) {
      setDownloading(false);
    }
  };

  const copyRunCommand = () => {
    navigator.clipboard.writeText('windows_agent\\install_desktop_app.bat');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Windows Executable & Setup Package
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Run natively on your local Windows PC to control real applications
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

        {/* Steps */}
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              100% Local Windows Execution Architecture
            </h4>
            <p className="text-[11px] text-blue-700 dark:text-blue-400">
              Directly uses native Win32 <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded">SendInput</code>, Microsoft UI Automation tree, and Win32 Clipboard APIs. No simulated webframes.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Download the Standalone Package:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Contains all Win32 control engine scripts, Python daemon, Electron desktop wrapper, and batch installers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">1-Click Desktop App Installation:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Double-click <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">windows_agent\install_desktop_app.bat</code>. It creates a <strong>"Local Computer Agent"</strong> shortcut on your Windows Desktop and opens in native desktop window mode!
                </p>
                <div className="mt-1.5 flex items-center gap-2 bg-slate-950 text-slate-200 p-2 rounded font-mono text-[11px] border border-slate-800">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="flex-1">windows_agent\install_desktop_app.bat</span>
                  <button
                    onClick={copyRunCommand}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[10px]"
                  >
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedCmd ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Or Build Standalone LocalComputerAgent.exe:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Run <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">windows_agent\install.bat</code> to compile a standalone <strong className="text-slate-700 dark:text-slate-300">LocalComputerAgent.exe</strong> installer with Electron, system tray icon, and global hotkeys.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Preparing Package...' : 'Download LocalComputerAgent.zip'}
          </button>
        </div>
      </div>
    </div>
  );
}
