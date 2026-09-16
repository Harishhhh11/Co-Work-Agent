import { useState, useEffect } from 'react';
import { 
  Monitor, 
  Crosshair, 
  Layers, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Maximize2, 
  FolderTree, 
  ShieldCheck, 
  ExternalLink,
  Lock,
  Unlock,
  FileSpreadsheet,
  FileText,
  Mail,
  Terminal,
  Palette,
  Folder,
  CheckCircle2,
  Play,
  Code2,
  Music2,
  Globe,
  Calculator,
  Cpu,
  Zap,
  Sparkles,
  Activity,
  HardDrive,
  Chrome,
  Code,
  Music,
  MessageSquare,
  Send
} from 'lucide-react';
import type { UIAElement, ActiveWindowInfo } from '../types';

interface LiveDesktopViewProps {
  activeWindow: ActiveWindowInfo;
  cursorPos: [number, number];
  resolution: [number, number];
  isControlling: boolean;
  isInputFrozen?: boolean;
  freezeEnabled?: boolean;
  goal?: string;
  currentStepTitle?: string;
  onRefresh: () => void;
  onEmergencyUnfreeze?: () => void;
  onToggleFreeze?: () => void;
}

export function LiveDesktopView({
  activeWindow,
  cursorPos,
  resolution,
  isControlling,
  isInputFrozen = false,
  freezeEnabled = true,
  goal = '',
  currentStepTitle = '',
  onRefresh,
  onEmergencyUnfreeze,
  onToggleFreeze,
}: LiveDesktopViewProps) {
  const [viewMode, setViewMode] = useState<'screen' | 'uia'>('screen');
  const [showGroundingBoxes, setShowGroundingBoxes] = useState<boolean>(true);
  const [uiaElements, setUiaElements] = useState<UIAElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<UIAElement | null>(null);

  // Fetch UI Automation tree
  const fetchUia = async () => {
    try {
      const res = await fetch('/api/desktop/uia');
      const data = await res.json();
      if (data.elements) {
        setUiaElements(data.elements);
      }
    } catch (e) {
      console.warn('Failed to load UIA tree:', e);
    }
  };

  useEffect(() => {
    fetchUia();
  }, [activeWindow.title]);

  // Render simulated high-fidelity Windows desktop canvas matching the active application
  const renderDesktopContent = () => {
    const title = activeWindow.title.toLowerCase();
    const proc = (activeWindow.process || '').toLowerCase();

    if (title.includes('chrome') || title.includes('meet')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
          {/* Chrome Tab Bar */}
          <div className="h-9 bg-slate-800 flex items-center px-3 border-b border-slate-700 text-xs gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded-t text-slate-200 border-t-2 border-blue-500 max-w-xs truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="truncate">Google Meet: Video calls and meetings</span>
            </div>
            <div className="text-slate-400 text-xs px-2">+</div>
          </div>

          {/* Chrome Address Bar */}
          <div className="h-10 bg-slate-850 flex items-center px-4 gap-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-400">
              <span>←</span>
              <span>→</span>
              <span>↻</span>
            </div>
            <div className="flex-1 bg-slate-950/80 px-3 py-1 rounded-full text-xs text-slate-300 flex items-center gap-2 border border-slate-700/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">https://</span>meet.google.com
            </div>
          </div>

          {/* Google Meet Web App Body */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 relative">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              Video calls and meetings for everyone
            </h1>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Connect, collaborate, and celebrate from anywhere with Google Meet.
            </p>

            <div className="flex items-center gap-3">
              <button 
                id="meet-new-btn"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>🎥</span>
                <span>New meeting</span>
              </button>

              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 gap-2">
                <span>⌨️</span>
                <span>Enter a code or link</span>
              </div>
            </div>

            {/* Generated Link Card Simulation */}
            <div className="mt-8 p-3 rounded-lg bg-slate-800/90 border border-slate-700 text-xs flex items-center gap-3 shadow-lg max-w-sm">
              <span className="text-slate-400">Meeting Link:</span>
              <span className="font-mono text-blue-400 select-all">https://meet.google.com/abc-defg-hij</span>
              <span className="text-[10px] bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded">Copied</span>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('youtube') || title.includes('video') || title.includes('playing:')) {
      const isPlaying = title.includes('playing') || title.includes('▶') || title.includes('cyber security full course');
      const queryMatch = activeWindow.title.match(/(?:Playing:\s*)?(.*?)(?:\s*-\s*YouTube|\s*-\s*Google Chrome|$)/i);
      const displayQuery = (queryMatch && queryMatch[1]?.trim() && !queryMatch[1].toLowerCase().includes('google chrome') && !queryMatch[1].toLowerCase().includes('youtube'))
        ? queryMatch[1].trim()
        : 'cyber security courses in Telugu';

      return (
        <div className="w-full h-full bg-[#0f0f0f] text-white flex flex-col font-sans select-none relative overflow-hidden">
          {/* Chrome Tab & Window Bar */}
          <div className="h-8 bg-[#1f1f1f] flex items-center px-3 border-b border-[#2d2d2d] text-xs gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#0f0f0f] rounded-t text-white border-t-2 border-red-600 max-w-xs truncate">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span className="truncate">{activeWindow.title}</span>
            </div>
            <div className="text-zinc-500 text-xs px-2">+</div>
          </div>

          {/* YouTube Navigation Header */}
          <div className="h-14 bg-[#0f0f0f] border-b border-[#272727] flex items-center justify-between px-4 gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-6 h-4 bg-red-600 rounded flex items-center justify-center text-[10px] font-black">▶</div>
              <span className="font-bold tracking-tighter text-base">YouTube</span>
              <span className="text-[10px] text-zinc-400 font-mono">IN</span>
            </div>

            {/* YouTube Search Bar */}
            <div className="flex-1 max-w-xl flex items-center">
              <div className="flex-1 bg-[#121212] border border-[#303030] rounded-l-full px-4 py-1.5 text-xs text-zinc-100 flex items-center gap-2 focus-within:border-blue-500">
                <span>🔍</span>
                <span className="font-medium text-zinc-200">{displayQuery}</span>
              </div>
              <button className="bg-[#222] border border-l-0 border-[#303030] rounded-r-full px-5 py-1.5 text-xs hover:bg-[#272727] text-zinc-300">
                Search
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full font-semibold text-[11px]">
                ● Live Agent Control
              </span>
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                U
              </div>
            </div>
          </div>

          {/* Main YouTube Workspace */}
          <div className="flex-1 overflow-y-auto p-4 flex gap-4">
            {isPlaying ? (
              /* ACTIVE VIDEO PLAYER VIEW */
              <div className="flex-1 flex flex-col gap-3">
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative shadow-2xl flex flex-col justify-between border border-zinc-800">
                  {/* Top Overlay Badge */}
                  <div className="p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded uppercase animate-pulse">
                        Now Playing
                      </span>
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        Cyber Security Full Course in Telugu | Ethical Hacking Complete Tutorial
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/30">
                      1080p 60fps HD
                    </span>
                  </div>

                  {/* Center Graphic Visualizer */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center text-2xl shadow-lg shadow-red-600/50">
                      ▶
                    </div>
                    <div className="flex items-end gap-1.5 h-8">
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-6" />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-8 delay-75" />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-4 delay-150" />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-7 delay-100" />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-5 delay-200" />
                    </div>
                    <span className="text-xs text-zinc-300 font-medium">Audio Active • Telugu Audio Stream</span>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="p-3 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-2 z-10">
                    <div className="w-full bg-zinc-700 h-1 rounded-full overflow-hidden cursor-pointer">
                      <div className="bg-red-600 h-full w-[28%]" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <div className="flex items-center gap-3">
                        <span className="cursor-pointer text-white font-bold">⏸ Pause (k)</span>
                        <span className="text-zinc-400">🔊 100%</span>
                        <span className="font-mono text-[11px] text-zinc-400">1:04:12 / 3:45:20</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px]">CC</span>
                        <span className="text-zinc-300">⚙️</span>
                        <span className="text-zinc-300">⛶</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Info Details */}
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Cyber Security Full Course in Telugu | Ethical Hacking Complete Tutorial
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Telugu Cyber Tech • 1,420,819 views • 1 year ago • #1 Most Viewed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs font-semibold">
                      👍 64K
                    </span>
                    <span className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs font-semibold">
                      Share
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* SEARCH RESULTS LIST WITH HIGHEST VIEW BADGE */
              <div className="flex-1 flex flex-col gap-3">
                {/* Filter chips bar */}
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <span className="text-xs text-zinc-400">Filters:</span>
                  <span className="px-3 py-1 bg-white text-black text-xs font-semibold rounded-lg flex items-center gap-1.5">
                    <span>✓ Sorted by: View Count (Highest)</span>
                  </span>
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-lg">
                    Type: Video
                  </span>
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-lg">
                    Upload date: Any time
                  </span>
                </div>

                {/* Top Video Result #1 (Selected / Most Views) */}
                <div className="p-3 bg-zinc-900/90 border-2 border-blue-500 rounded-xl flex gap-4 relative shadow-lg">
                  <div className="w-56 aspect-video bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-lg overflow-hidden relative shrink-0 flex items-center justify-center border border-zinc-700">
                    <div className="text-center p-2">
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Ethical Hacking</div>
                      <div className="text-[10px] text-zinc-300 mt-0.5">Full Course Telugu</div>
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/90 text-white font-mono text-[10px] rounded">
                      3:45:20
                    </span>
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-red-600 text-white font-bold text-[9px] rounded uppercase">
                      TOP VIEWS
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                          ★ SELECTED BY AGENT (HIGHEST VIEWS)
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1.5 hover:text-blue-400 cursor-pointer">
                        Cyber Security Full Course in Telugu | Ethical Hacking Complete Tutorial 2025
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Telugu Cyber Tech • <strong className="text-emerald-400">1.4M views</strong> • 1 year ago
                      </p>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      Complete cyber security and ethical hacking masterclass explained in Telugu from basics to advanced penetration testing tools.
                    </p>
                  </div>
                </div>

                {/* Video Result #2 */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl flex gap-4 opacity-75">
                  <div className="w-56 aspect-video bg-zinc-800 rounded-lg overflow-hidden relative shrink-0 flex items-center justify-center">
                    <span className="text-xs text-zinc-400 font-semibold">Telugu Cybersecurity Roadmap</span>
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/90 text-white font-mono text-[10px] rounded">
                      42:15
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        How to become a Cyber Security Specialist in Telugu | Complete Guide
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Telugu Tech Guide • 820K views • 2 years ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (title.includes('excel') || title.includes('budget') || title.includes('sheet')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
          {/* Excel Title Bar */}
          <div className="h-8 bg-[#107c41] text-white flex items-center justify-between px-3 text-xs shrink-0 font-medium">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Monthly Budget.xlsx - Microsoft Excel</span>
            </div>
            <div className="flex items-center gap-3 text-slate-200 text-xs">
              <span>AutoSave: On</span>
              <span className="opacity-75">Saved to OneDrive</span>
            </div>
          </div>

          {/* Excel Ribbon Tabs */}
          <div className="h-7 bg-[#185a37] text-slate-200 flex items-center px-4 gap-4 text-xs shrink-0 border-b border-[#107c41]">
            <span className="font-semibold text-white border-b-2 border-white pb-0.5">Home</span>
            <span className="hover:text-white cursor-pointer">Insert</span>
            <span className="hover:text-white cursor-pointer">Page Layout</span>
            <span className="hover:text-white cursor-pointer">Formulas</span>
            <span className="hover:text-white cursor-pointer">Data</span>
            <span className="hover:text-white cursor-pointer">Review</span>
          </div>

          {/* Excel Formula Bar */}
          <div className="h-8 bg-slate-900 border-b border-slate-700 flex items-center px-3 gap-3 text-xs shrink-0">
            <div className="w-14 bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-center font-mono text-emerald-400">
              B6
            </div>
            <div className="text-slate-500 font-serif italic text-sm">fx</div>
            <div className="flex-1 bg-slate-950 px-3 py-0.5 rounded border border-slate-700 font-mono text-emerald-300">
              =SUM(B2:B5)
            </div>
          </div>

          {/* Excel Spreadsheet Grid */}
          <div className="flex-1 overflow-auto bg-slate-950 text-xs font-mono">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-700 text-center select-none">
                  <th className="w-10 p-1 border-r border-slate-700 bg-slate-850"></th>
                  <th className="w-48 p-1 border-r border-slate-700">A (Category)</th>
                  <th className="w-36 p-1 border-r border-slate-700">B (Budget)</th>
                  <th className="w-36 p-1 border-r border-slate-700">C (Actual)</th>
                  <th className="w-36 p-1 border-r border-slate-700">D (Variance)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                <tr className="hover:bg-slate-900/50">
                  <td className="p-1.5 text-center text-slate-500 bg-slate-900 border-r border-slate-800">1</td>
                  <td className="p-1.5 font-bold text-white border-r border-slate-800 bg-slate-900/40">Expense Category</td>
                  <td className="p-1.5 font-bold text-white border-r border-slate-800 text-right bg-slate-900/40">Budgeted ($)</td>
                  <td className="p-1.5 font-bold text-white border-r border-slate-800 text-right bg-slate-900/40">Actual ($)</td>
                  <td className="p-1.5 font-bold text-white border-r border-slate-800 text-right bg-slate-900/40">Variance ($)</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-1.5 text-center text-slate-500 bg-slate-900 border-r border-slate-800">2</td>
                  <td className="p-1.5 border-r border-slate-800">Housing & Rent</td>
                  <td className="p-1.5 border-r border-slate-800 text-right font-semibold">$1,500.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right font-semibold">$1,450.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right text-emerald-400">+$50.00</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-1.5 text-center text-slate-500 bg-slate-900 border-r border-slate-800">3</td>
                  <td className="p-1.5 border-r border-slate-800">Utilities & Internet</td>
                  <td className="p-1.5 border-r border-slate-800 text-right font-semibold">$300.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right font-semibold">$280.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right text-emerald-400">+$20.00</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-1.5 text-center text-slate-500 bg-slate-900 border-r border-slate-800">4</td>
                  <td className="p-1.5 border-r border-slate-800">Food & Groceries</td>
                  <td className="p-1.5 border-r border-slate-800 text-right font-semibold">$600.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right font-semibold">$650.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right text-rose-400">-$50.00</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-1.5 text-center text-slate-500 bg-slate-900 border-r border-slate-800">5</td>
                  <td className="p-1.5 border-r border-slate-800">Transportation</td>
                  <td className="p-1.5 border-r border-slate-800 text-right font-semibold">$400.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right font-semibold">$390.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right text-emerald-400">+$10.00</td>
                </tr>
                <tr className="bg-emerald-950/40 border-t-2 border-emerald-500 font-bold">
                  <td className="p-1.5 text-center text-slate-500 bg-slate-900 border-r border-slate-800">6</td>
                  <td className="p-1.5 border-r border-slate-800 text-emerald-300">TOTAL SUMMARY</td>
                  <td className="p-1.5 border-r border-slate-800 text-right text-emerald-400">$2,800.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right text-emerald-400">$2,770.00</td>
                  <td className="p-1.5 border-r border-slate-800 text-right text-emerald-300">+$30.00 (Under Budget)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Excel Status Footer */}
          <div className="h-6 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-semibold">Sheet1</span>
              <span>Ready</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>AVERAGE: $692.50</span>
              <span>COUNT: 4</span>
              <span>SUM: $2,770.00</span>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('word') || title.includes('winword') || title.includes('report') || title.includes('essay')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
          {/* Word Header */}
          <div className="h-8 bg-[#2b579a] text-white flex items-center justify-between px-3 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-semibold">Executive Report - Microsoft Word</span>
            </div>
            <span className="text-[10px] opacity-80">Saved to OneDrive</span>
          </div>

          {/* Word Ribbon */}
          <div className="h-7 bg-[#193c72] text-slate-200 flex items-center px-4 gap-4 text-xs shrink-0 border-b border-blue-900">
            <span className="font-bold text-white border-b-2 border-white pb-0.5">Home</span>
            <span className="hover:text-white cursor-pointer">Insert</span>
            <span className="hover:text-white cursor-pointer">Layout</span>
            <span className="hover:text-white cursor-pointer">References</span>
            <span className="hover:text-white cursor-pointer">Review</span>
          </div>

          {/* Word Document Canvas Preview */}
          <div className="flex-1 bg-slate-950 p-6 overflow-y-auto flex justify-center">
            <div className="w-full max-w-2xl bg-white text-slate-900 shadow-2xl rounded-sm p-10 font-serif leading-relaxed text-sm">
              <h1 className="text-2xl font-bold text-slate-900 mb-2 border-b-2 border-blue-900 pb-2">
                Executive Status & Autonomous Deliverables
              </h1>
              <p className="text-xs text-slate-500 mb-6 uppercase tracking-wider font-sans">
                Confidential • Prepared by Windows Native AI Agent
              </p>
              
              <h2 className="text-base font-bold text-slate-800 mt-4 mb-2">1. Overview of Activities</h2>
              <p className="text-slate-700 mb-4 text-justify">
                This document has been autonomously composed, formatted, and verified by the local Windows AI agent engine. The agent executed high-level task decomposition, verified interface elements via Win32 UI Automation, and locked user physical input to ensure clean execution.
              </p>

              <h2 className="text-base font-bold text-slate-800 mt-4 mb-2">2. Key Accomplishments</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs font-sans">
                <li>Dynamic multi-step planning with verifiable visual and accessibility states.</li>
                <li>Physical input lockout (Win32 BlockInput) preventing accidental human interruptions.</li>
                <li>Multi-application execution encompassing Office suite, web portals, and system CLI.</li>
              </ul>
            </div>
          </div>

          <div className="h-6 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-400">
            <span>Page 1 of 1 • 248 words</span>
            <span>English (United States) • 100% Zoom</span>
          </div>
        </div>
      );
    }

    if (title.includes('gmail') || title.includes('mail') || title.includes('outlook')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
          {/* Chrome / Gmail Header */}
          <div className="h-8 bg-slate-800 flex items-center px-3 border-b border-slate-700 text-xs gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded-t text-slate-200 border-t-2 border-red-500 max-w-xs truncate">
              <Mail className="w-3 h-3 text-red-400" />
              <span>Gmail - Inbox (1,420)</span>
            </div>
          </div>

          <div className="flex-1 flex bg-slate-950 relative">
            {/* Gmail Left Sidebar */}
            <div className="w-48 bg-slate-900 border-r border-slate-800 p-3 flex flex-col gap-1 text-xs">
              <div className="px-3 py-2 bg-red-600 text-white rounded-full font-bold shadow-md flex items-center gap-2 mb-3">
                <span>✎</span> Compose
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-semibold flex justify-between">
                <span>Inbox</span>
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">1,420</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800">Starred</div>
              <div className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800">Sent</div>
              <div className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800">Drafts</div>
            </div>

            {/* Main Gmail View with Active Compose Popup */}
            <div className="flex-1 p-6 relative">
              <div className="text-slate-500 text-xs">Inbox loaded. Autonomous task drafting mail...</div>

              {/* Compose Window Float */}
              <div className="absolute bottom-4 right-8 w-[460px] bg-slate-900 border-2 border-blue-500/80 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-850 px-4 py-2 flex items-center justify-between border-b border-slate-700 text-xs font-bold text-white">
                  <span>New Message</span>
                  <div className="flex gap-2 text-slate-400">
                    <span>—</span>
                    <span>✕</span>
                  </div>
                </div>
                <div className="p-3 border-b border-slate-800 text-xs flex gap-2 items-center">
                  <span className="text-slate-400 w-12">To:</span>
                  <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40">team@company.com</span>
                </div>
                <div className="p-3 border-b border-slate-800 text-xs flex gap-2 items-center">
                  <span className="text-slate-400 w-12">Subject:</span>
                  <span className="text-white font-medium">Project Status Update & Deliverables</span>
                </div>
                <div className="p-4 flex-1 text-xs text-slate-200 min-h-[140px] leading-relaxed">
                  Hi Team,<br/><br/>
                  All scheduled tasks and workflows have been completed autonomously by the Windows Native Agent. The spreadsheet budget and report documents are saved to the workspace.<br/><br/>
                  Best regards,<br/>
                  AI Agent Daemon
                </div>
                <div className="p-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
                  <button className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5">
                    Send
                  </button>
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span>📎</span>
                    <span>🔗</span>
                    <span>🗑</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('powershell') || title.includes('terminal') || title.includes('cmd')) {
      return (
        <div className="w-full h-full bg-[#0c1021] text-slate-100 flex flex-col font-mono select-none relative overflow-hidden">
          {/* Terminal Title Bar */}
          <div className="h-8 bg-[#161c36] flex items-center justify-between px-3 border-b border-[#252f5a] text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-200">Administrator: Windows PowerShell</span>
            </div>
            <div className="flex gap-2 text-slate-400 text-xs">
              <span>—</span>
              <span>□</span>
              <span>✕</span>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed text-slate-200 space-y-2">
            <div className="text-slate-400">Windows PowerShell</div>
            <div className="text-slate-400">Copyright (C) Microsoft Corporation. All rights reserved.</div>
            <div className="text-cyan-400 mt-3">PS C:\Users\Administrator&gt; ping 8.8.8.8</div>
            <div className="text-slate-300">Pinging 8.8.8.8 with 32 bytes of data:</div>
            <div className="text-emerald-400">Reply from 8.8.8.8: bytes=32 time=14ms TTL=117</div>
            <div className="text-emerald-400">Reply from 8.8.8.8: bytes=32 time=12ms TTL=117</div>
            <div className="text-emerald-400">Reply from 8.8.8.8: bytes=32 time=13ms TTL=117</div>
            <div className="text-emerald-400">Reply from 8.8.8.8: bytes=32 time=13ms TTL=117</div>
            <div className="text-slate-300 mt-2">Ping statistics for 8.8.8.8:</div>
            <div className="text-slate-400">    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),</div>
            <div className="text-slate-400">Approximate round trip times in milli-seconds:</div>
            <div className="text-slate-400">    Minimum = 12ms, Maximum = 14ms, Average = 13ms</div>
            <div className="text-cyan-400 mt-2 flex items-center">
              <span>PS C:\Users\Administrator&gt;&nbsp;</span>
              <span className="w-2 h-4 bg-cyan-400 inline-block animate-pulse" />
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('paint') || title.includes('mspaint')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
          {/* Paint Title Bar */}
          <div className="h-8 bg-slate-800 flex items-center justify-between px-3 border-b border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span>Untitled - Paint</span>
            </div>
          </div>

          {/* Paint Ribbon */}
          <div className="h-10 bg-slate-850 border-b border-slate-700 px-4 flex items-center gap-4 text-xs">
            <span className="px-2.5 py-1 bg-blue-600 text-white rounded font-semibold">Brushes</span>
            <span className="text-slate-300">Shapes</span>
            <span className="text-slate-300">Size: 3px</span>
            <div className="flex items-center gap-1.5 ml-4">
              <span className="w-4 h-4 rounded-full bg-red-500 cursor-pointer" />
              <span className="w-4 h-4 rounded-full bg-blue-500 cursor-pointer ring-2 ring-white" />
              <span className="w-4 h-4 rounded-full bg-emerald-500 cursor-pointer" />
              <span className="w-4 h-4 rounded-full bg-amber-500 cursor-pointer" />
            </div>
          </div>

          {/* Paint Canvas */}
          <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center">
            <div className="w-[580px] h-[360px] bg-white rounded shadow-2xl relative overflow-hidden border border-slate-700">
              {/* Drawn Shapes by Agent */}
              <div className="absolute top-12 left-16 w-48 h-32 border-4 border-blue-600 rounded-lg flex items-center justify-center text-slate-800 font-bold text-xs bg-blue-50">
                System Diagram Box
              </div>
              <div className="absolute top-28 left-64 w-32 h-1 bg-slate-800" />
              <div className="absolute top-16 right-16 w-36 h-28 border-4 border-emerald-600 rounded-full flex items-center justify-center text-slate-800 font-bold text-xs bg-emerald-50">
                Data Node
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('explorer') || title.includes('file')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
          {/* File Explorer Header */}
          <div className="h-8 bg-slate-850 flex items-center justify-between px-3 border-b border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Downloads - File Explorer</span>
            </div>
          </div>

          {/* Address Bar */}
          <div className="h-8 bg-slate-900 border-b border-slate-700/70 px-3 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Path:</span>
            <div className="flex-1 bg-slate-950 px-3 py-0.5 rounded border border-slate-800 text-slate-300 font-mono">
              This PC &gt; Downloads &gt; Organized
            </div>
          </div>

          <div className="flex-1 flex bg-slate-950">
            {/* Explorer Left Tree */}
            <div className="w-44 bg-slate-900 border-r border-slate-800 p-2 text-xs space-y-1 text-slate-400">
              <div className="p-1 rounded text-white font-semibold">Quick access</div>
              <div className="pl-3 py-0.5 hover:text-white">Desktop</div>
              <div className="pl-3 py-0.5 bg-blue-600/30 text-blue-300 rounded font-medium">Downloads</div>
              <div className="pl-3 py-0.5 hover:text-white">Documents</div>
              <div className="pl-3 py-0.5 hover:text-white">Pictures</div>
            </div>

            {/* File Items Table */}
            <div className="flex-1 p-3 overflow-y-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-1 text-[11px]">
                    <th className="font-medium pb-1.5">Name</th>
                    <th className="font-medium pb-1.5">Date Modified</th>
                    <th className="font-medium pb-1.5">Type</th>
                    <th className="font-medium pb-1.5 text-right">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  <tr className="hover:bg-slate-900">
                    <td className="py-2 flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Monthly_Budget_2025.xlsx</td>
                    <td className="text-slate-400">Today, 3:15 PM</td>
                    <td className="text-slate-400">Excel Worksheet</td>
                    <td className="text-right font-mono">42 KB</td>
                  </tr>
                  <tr className="hover:bg-slate-900">
                    <td className="py-2 flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-400" /> Executive_Report.docx</td>
                    <td className="text-slate-400">Today, 3:12 PM</td>
                    <td className="text-slate-400">Word Document</td>
                    <td className="text-right font-mono">18 KB</td>
                  </tr>
                  <tr className="hover:bg-slate-900">
                    <td className="py-2 flex items-center gap-2"><Palette className="w-3.5 h-3.5 text-pink-400" /> diagram_sketch.png</td>
                    <td className="text-slate-400">Today, 3:10 PM</td>
                    <td className="text-slate-400">PNG Image</td>
                    <td className="text-right font-mono">128 KB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('notepad')) {
      const isScratch = activeWindow.scratch_mode !== false;
      const bufferText = activeWindow.buffer_text !== undefined ? activeWindow.buffer_text : 'Hello World!\nAI Windows Agent is operating your PC.';
      const lines = bufferText.split('\n');

      return (
        <div className="w-full h-full bg-slate-950 text-slate-100 flex flex-col font-mono select-none relative">
          {/* Notepad Windows 11 Tab Bar */}
          <div className="h-9 bg-slate-900/90 border-b border-slate-800 px-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 text-slate-200 rounded-t border-t-2 border-blue-500 text-xs font-sans">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>{activeWindow.title || '*Untitled - Notepad'}</span>
              </div>
              <span className="text-slate-500 text-xs px-2 hover:text-white cursor-pointer">+</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-sans">
              {isScratch ? (
                <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/40 text-emerald-400 flex items-center gap-1 font-mono">
                  ✨ Scratch Mode (Pristine Buffer)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-600/40 text-amber-300 flex items-center gap-1 font-mono">
                  📌 Existing Document Buffer
                </span>
              )}
            </div>
          </div>

          {/* Notepad Menu Bar */}
          <div className="h-7 bg-slate-900/60 border-b border-slate-800/80 px-4 flex items-center gap-5 text-xs text-slate-400 font-sans">
            <span className="hover:text-white cursor-pointer">File</span>
            <span className="hover:text-white cursor-pointer">Edit</span>
            <span className="hover:text-white cursor-pointer">View</span>
          </div>

          {/* Notepad Canvas */}
          <div className="flex-1 p-6 text-sm text-slate-200 leading-relaxed font-mono overflow-y-auto whitespace-pre-wrap">
            {bufferText.trim() ? (
              lines.map((ln, i) => (
                <div key={i} className="min-h-[1.5rem] flex items-center">
                  <span>{ln}</span>
                  {i === lines.length - 1 && (
                    <span className="w-2 h-4 bg-blue-500 inline-block animate-pulse ml-0.5" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic flex items-center gap-2">
                <span>[Empty clean document buffer — ready for autonomous input]</span>
                <span className="w-2 h-4 bg-blue-500 inline-block animate-pulse" />
              </div>
            )}
          </div>

          {/* Notepad Status Bar */}
          <div className="h-6 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <div className="flex items-center gap-4">
              <span>Ln {Math.max(1, lines.length)}, Col {lines[lines.length - 1]?.length || 1}</span>
              <span>{bufferText.length} characters</span>
            </div>
            <div className="flex items-center gap-4">
              <span>100%</span>
              <span>Windows (CRLF)</span>
              <span>UTF-8</span>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('whatsapp')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex font-sans select-none">
          {/* WhatsApp Left Sidebar */}
          <div className="w-64 bg-slate-850 border-r border-slate-700/60 flex flex-col">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between text-xs font-semibold">
              <span>Chats</span>
              <span className="text-slate-400">⋮</span>
            </div>
            <div className="p-2">
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-slate-700/50 flex items-center gap-2">
                <span>🔍</span>
                <span>Search Rahul...</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2.5 bg-slate-800 border-l-2 border-emerald-500 flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                  R
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-100">Rahul</div>
                  <div className="text-[11px] text-slate-400 truncate">Here is the Google Meet link...</div>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Chat Conversation */}
          <div className="flex-1 flex flex-col bg-slate-950">
            <div className="h-12 bg-slate-850 border-b border-slate-700 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                  R
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Rahul</div>
                  <div className="text-[10px] text-emerald-400">Online</div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 flex flex-col justify-end space-y-2">
              <div className="self-end bg-emerald-800 text-white text-xs px-3.5 py-2 rounded-lg max-w-sm shadow-md">
                <span>Hi Rahul, here is the Google Meet link: https://meet.google.com/abc-defg-hij</span>
                <span className="block text-[9px] text-emerald-200 text-right mt-1">10:42 AM ✓✓</span>
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-850 border-t border-slate-700 flex items-center gap-2">
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400">
                Type a message
              </div>
              <button 
                id="send-message-btn"
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('code') || title.includes('script') || title.includes('python') || title.includes('vscode')) {
      return (
        <div className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] flex flex-col font-mono select-none relative overflow-hidden">
          {/* VS Code Title Bar */}
          <div className="h-8 bg-[#323233] flex items-center justify-between px-3 text-xs border-b border-[#252526] shrink-0">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-200">main.py - Autonomous Task - Visual Studio Code</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>Python 3.11.4 64-bit</span>
              <span>Git: main*</span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* VS Code Activity Bar */}
            <div className="w-10 bg-[#333333] flex flex-col items-center py-3 gap-4 text-slate-400 shrink-0 border-r border-[#252526]">
              <span className="text-white border-l-2 border-white pl-0.5">📁</span>
              <span>🔍</span>
              <span>🌿</span>
              <span>▶</span>
              <span>🧩</span>
            </div>

            {/* Explorer Sidebar */}
            <div className="w-44 bg-[#252526] p-2 text-xs text-slate-300 shrink-0 border-r border-[#1e1e1e]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Explorer</div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 bg-[#37373d] px-2 py-1 rounded text-white font-medium">
                  <span className="text-yellow-400 font-bold">Py</span> main.py
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-slate-400 hover:text-slate-200">
                  <span className="text-blue-400 font-bold">&#123;&#125;</span> config.json
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-slate-400 hover:text-slate-200">
                  <span className="text-emerald-400 font-bold">📄</span> requirements.txt
                </div>
              </div>
            </div>

            {/* Editor Code Area */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
              {/* File Tabs */}
              <div className="h-8 bg-[#252526] flex items-center px-2 gap-1 text-xs shrink-0">
                <div className="bg-[#1e1e1e] text-white px-3 py-1.5 border-t-2 border-blue-500 flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">Py</span>
                  <span>main.py</span>
                  <span className="text-slate-500 text-[10px]">✕</span>
                </div>
              </div>

              {/* Code text */}
              <div className="flex-1 p-4 font-mono text-xs leading-relaxed overflow-y-auto space-y-1">
                <div className="text-slate-500"># Autonomous task executor generated by AI Windows Agent</div>
                <div><span className="text-purple-400 font-semibold">import</span> <span className="text-cyan-300">os</span>, <span className="text-cyan-300">sys</span>, <span className="text-cyan-300">time</span></div>
                <div><span className="text-purple-400 font-semibold">import</span> <span className="text-cyan-300">requests</span></div>
                <div className="pt-2"><span className="text-purple-400 font-semibold">def</span> <span className="text-yellow-300 font-bold">execute_autonomous_task</span>(goal: <span className="text-emerald-400">str</span>):</div>
                <div className="pl-4 text-slate-400">"""Execute human computer workflow via Win32 UI Automation"""</div>
                <div className="pl-4"><span className="text-blue-300">print</span>(<span className="text-emerald-300">f"[AI Agent] Executing: &#123;goal&#125;"</span>)</div>
                <div className="pl-4"><span className="text-purple-400 font-semibold">return</span> &#123;<span className="text-emerald-300">"status"</span>: <span className="text-emerald-300">"verified"</span>, <span className="text-emerald-300">"code"</span>: <span className="text-amber-400">0</span>&#125;</div>
                <div className="pt-2"><span className="text-purple-400 font-semibold">if</span> __name__ == <span className="text-emerald-300">"__main__"</span>:</div>
                <div className="pl-4">res = execute_autonomous_task(<span className="text-emerald-300">"{goal || 'Execute user task'}"</span>)</div>
                <div className="pl-4"><span className="text-blue-300">print</span>(<span className="text-emerald-300">f"[AI Agent] Completed with result: &#123;res&#125;"</span>)</div>
              </div>

              {/* Integrated Terminal */}
              <div className="h-32 bg-[#181818] border-t border-[#333333] p-3 text-xs font-mono flex flex-col shrink-0">
                <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-[#282828] text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold border-b border-blue-500">TERMINAL</span>
                    <span>OUTPUT</span>
                    <span>DEBUG CONSOLE</span>
                  </div>
                  <span>powershell.exe</span>
                </div>
                <div className="flex-1 pt-2 space-y-1 text-slate-300">
                  <div className="text-cyan-400">PS C:\Workspace\AI_Automation&gt; python main.py</div>
                  <div className="text-emerald-400">[AI Agent] Executing: {goal || 'User task execution'}</div>
                  <div className="text-emerald-400">[AI Agent] Completed with result: &#123;'status': 'verified', 'code': 0&#125;</div>
                  <div className="flex items-center text-cyan-400">
                    <span>PS C:\Workspace\AI_Automation&gt;&nbsp;</span>
                    <span className="w-1.5 h-3 bg-cyan-400 inline-block animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('spotify') || title.includes('music') || title.includes('song') || title.includes('audio')) {
      return (
        <div className="w-full h-full bg-[#121212] text-white flex flex-col font-sans select-none relative overflow-hidden">
          {/* Spotify Top Bar */}
          <div className="h-10 bg-black/80 flex items-center justify-between px-4 border-b border-[#282828] text-xs shrink-0">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Music2 className="w-4 h-4" />
              <span>Spotify Free</span>
            </div>
            <div className="flex items-center gap-2 bg-[#242424] px-4 py-1 rounded-full text-slate-300 max-w-sm flex-1 mx-6">
              <span>🔍</span>
              <span className="text-slate-100 font-medium">{goal || 'What do you want to play?'}</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-black font-bold flex items-center justify-center text-xs">
              A
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 bg-black p-3 space-y-3 text-xs text-slate-400 shrink-0 border-r border-[#222]">
              <div className="text-white font-bold flex items-center gap-2"><span>🏠</span> Home</div>
              <div className="hover:text-white flex items-center gap-2"><span>🔍</span> Search</div>
              <div className="hover:text-white flex items-center gap-2"><span>📚</span> Your Library</div>
              <div className="pt-4 border-t border-[#222] space-y-1.5">
                <div className="text-slate-200 font-semibold">Liked Songs</div>
                <div className="hover:text-slate-200">Daily Mix 1</div>
                <div className="hover:text-slate-200">Focus Beats</div>
                <div className="hover:text-slate-200">Chill Vibes</div>
              </div>
            </div>

            {/* Player View Hero */}
            <div className="flex-1 bg-gradient-to-b from-emerald-900/60 via-[#121212] to-[#121212] p-6 flex flex-col justify-between">
              <div className="flex items-end gap-6">
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-600 to-teal-900 rounded-lg shadow-2xl flex items-center justify-center text-4xl shadow-emerald-950">
                  🎵
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">Playlist</span>
                  <h1 className="text-2xl font-extrabold text-white mt-1">Autonomous Audio Stream</h1>
                  <p className="text-xs text-slate-400 mt-2">Spotify • Selected for: "{goal || 'User Query'}"</p>
                </div>
              </div>

              {/* Equalizer animation */}
              <div className="flex items-center gap-3 bg-[#181818] p-4 rounded-xl border border-[#282828]">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-sm shadow-lg">
                  ▶
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Midnight City Echoes</div>
                  <div className="text-[11px] text-slate-400">Ambient Soundscapes • 320kbps High Quality</div>
                </div>
                <div className="ml-auto flex items-end gap-1 h-6">
                  <span className="w-1 bg-emerald-500 rounded-full animate-bounce h-4" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-bounce h-6 delay-75" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-bounce h-3 delay-150" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-bounce h-5 delay-100" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Audio Scrub Bar */}
          <div className="h-16 bg-[#181818] border-t border-[#282828] px-4 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-800 rounded flex items-center justify-center text-xs font-bold">♫</div>
              <div>
                <div className="font-semibold text-white">Midnight City Echoes</div>
                <div className="text-[10px] text-slate-400">Ambient Soundscapes</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 w-80">
              <div className="flex items-center gap-4 text-slate-300">
                <span>🔀</span>
                <span>⏮</span>
                <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold">⏸</div>
                <span>⏭</span>
                <span>🔁</span>
              </div>
              <div className="w-full flex items-center gap-2 text-[10px] text-slate-400">
                <span>1:24</span>
                <div className="flex-1 bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[42%]" />
                </div>
                <span>3:18</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span>🔊</span>
              <div className="w-20 bg-slate-700 h-1 rounded-full">
                <div className="bg-white h-full w-[70%]" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('calc') || title.includes('calculator')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex items-center justify-center p-6 select-none relative font-sans">
          <div className="w-80 bg-slate-850 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
            {/* Calc Titlebar */}
            <div className="h-8 bg-slate-800 px-3 flex items-center justify-between text-xs text-slate-400 border-b border-slate-700">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                <span>Standard Calculator</span>
              </div>
              <div className="flex gap-2 text-slate-400 text-xs">
                <span>—</span>
                <span>□</span>
                <span>✕</span>
              </div>
            </div>

            {/* Calc Display */}
            <div className="p-4 bg-slate-900 text-right flex flex-col justify-end min-h-[90px] border-b border-slate-800">
              <span className="text-xs text-slate-500 font-mono">Calculation evaluated =</span>
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">3,600</span>
            </div>

            {/* Keypad Grid */}
            <div className="p-3 grid grid-cols-4 gap-1.5 text-xs font-semibold">
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400">C</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">CE</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">⌫</button>
              <button className="p-2.5 rounded bg-blue-600/30 hover:bg-blue-600/40 text-blue-300">÷</button>

              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">7</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">8</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">9</button>
              <button className="p-2.5 rounded bg-blue-600/30 hover:bg-blue-600/40 text-blue-300">×</button>

              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">4</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">5</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">6</button>
              <button className="p-2.5 rounded bg-blue-600/30 hover:bg-blue-600/40 text-blue-300">−</button>

              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">1</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">2</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">3</button>
              <button className="p-2.5 rounded bg-blue-600/30 hover:bg-blue-600/40 text-blue-300">+</button>

              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">±</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">0</button>
              <button className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white">.</button>
              <button className="p-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md">=</button>
            </div>
          </div>
        </div>
      );
    }

    if (title.includes('chrome') || title.includes('search') || title.includes('google') || title.includes('amazon') || title.includes('flight') || title.includes('browser')) {
      return (
        <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
          {/* Chrome Tab Bar */}
          <div className="h-8 bg-slate-800 flex items-center px-3 border-b border-slate-700 text-xs gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded-t text-slate-200 border-t-2 border-blue-500 max-w-sm truncate">
              <Globe className="w-3 h-3 text-blue-400" />
              <span className="truncate">{activeWindow.title}</span>
            </div>
            <div className="text-slate-400 text-xs px-2">+</div>
          </div>

          {/* Chrome Omnibox Address Bar */}
          <div className="h-9 bg-slate-850 flex items-center px-3 gap-2 border-b border-slate-700/60 shrink-0 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span>←</span>
              <span>→</span>
              <span>↻</span>
            </div>
            <div className="flex-1 bg-slate-950 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 text-slate-300 font-mono text-[11px]">
              <span className="text-emerald-400 text-xs">🔒</span>
              <span className="text-slate-400">https://</span>
              <span className="text-white font-semibold">www.google.com/search?q={encodeURIComponent(goal || activeWindow.title)}</span>
            </div>
          </div>

          {/* Web Page Body */}
          <div className="flex-1 bg-slate-950 p-6 overflow-y-auto space-y-4">
            {/* Search Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-3 text-xs text-slate-400">
              <span className="text-blue-400 font-semibold border-b-2 border-blue-500 pb-2">All</span>
              <span className="hover:text-slate-200">Images</span>
              <span className="hover:text-slate-200">News</span>
              <span className="hover:text-slate-200">Videos</span>
              <span className="hover:text-slate-200">Maps</span>
            </div>

            {/* AI Overview / Verified Knowledge Box */}
            <div className="p-4 bg-slate-900 border border-blue-500/40 rounded-xl shadow-lg relative">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Autonomous Web Retrieval & Verification</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                The Windows agent has navigated to the requested online portal for <strong className="text-white">"{goal || activeWindow.title}"</strong>. All interface elements, listings, and form inputs have been parsed via accessibility DOM and screen bounding rects.
              </p>
            </div>

            {/* Result Card 1 */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700">
              <div className="text-[11px] text-slate-400">https://www.verified-portal.com</div>
              <h3 className="text-sm font-bold text-blue-400 hover:underline mt-0.5">
                Verified Results & Top Matches for: {goal || activeWindow.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Official portal, rated 4.9/5 stars. All specifications, availability, and actions verified. Click to confirm reservation and proceed to checkout.
              </p>
            </div>

            {/* Result Card 2 */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700">
              <div className="text-[11px] text-slate-400">https://www.portal.org/guide</div>
              <h3 className="text-sm font-bold text-blue-400 hover:underline mt-0.5">
                Complete Overview & Real-Time Specifications
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Detailed breakdown, pricing matrix, and comprehensive metrics updated in real-time.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 14. Windows 11 Task Manager & Performance Telemetry
    if (title.includes('task manager') || title.includes('taskmgr') || proc.includes('taskmgr')) {
      return (
        <div className="w-full h-full bg-[#1e1e1e] text-slate-100 flex flex-col font-sans select-none">
          <div className="h-10 bg-[#252526] border-b border-[#333] px-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">Task Manager</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Real-Time Telemetry</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2.5 py-1 text-[11px] bg-red-600/80 hover:bg-red-600 rounded text-white font-medium transition-colors">
                End Task
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-44 bg-[#181818] border-r border-[#2d2d2d] p-2 flex flex-col gap-1 text-xs">
              <button className="flex items-center gap-2.5 px-3 py-2 rounded bg-blue-600/20 text-blue-400 font-medium">
                <Activity className="w-4 h-4" />
                <span>Processes</span>
              </button>
              <button className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200">
                <Cpu className="w-4 h-4" />
                <span>Performance</span>
              </button>
              <button className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200">
                <HardDrive className="w-4 h-4" />
                <span>App History</span>
              </button>
              <button className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200">
                <Sparkles className="w-4 h-4" />
                <span>Startup Apps</span>
              </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-[#252526] border border-[#333]">
                  <div className="text-[11px] text-slate-400 font-medium">CPU</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">18%</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">3.82 GHz • 8 Cores</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full w-[18%]" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#252526] border border-[#333]">
                  <div className="text-[11px] text-slate-400 font-medium">Memory</div>
                  <div className="text-xl font-bold text-purple-400 mt-1">13.4 / 32 GB</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">42% • DDR5 5600MHz</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-500 h-full w-[42%]" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#252526] border border-[#333]">
                  <div className="text-[11px] text-slate-400 font-medium">Disk 0 (C:)</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">4%</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">NVMe SSD • 0.8 ms</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[4%]" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#252526] border border-[#333]">
                  <div className="text-[11px] text-slate-400 font-medium">Network</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">24.6 Mbps</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ethernet 2.5Gbps</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-amber-500 h-full w-[35%]" />
                  </div>
                </div>
              </div>

              {/* Active Process Table */}
              <div className="flex-1 bg-[#252526] rounded-lg border border-[#333] overflow-hidden flex flex-col text-xs">
                <div className="grid grid-cols-12 px-3 py-2 bg-[#2d2d2d] border-b border-[#3a3a3a] text-slate-400 font-medium text-[11px]">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2 text-right">Status</div>
                  <div className="col-span-2 text-right">CPU</div>
                  <div className="col-span-3 text-right">Memory</div>
                </div>
                <div className="divide-y divide-[#333] overflow-y-auto">
                  <div className="grid grid-cols-12 px-3 py-2 items-center bg-blue-500/10 text-slate-200">
                    <div className="col-span-5 flex items-center gap-2 font-medium">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      <span>Windows AI Agent Runtime</span>
                    </div>
                    <div className="col-span-2 text-right text-emerald-400 font-mono text-[11px]">Active</div>
                    <div className="col-span-2 text-right font-mono">6.2%</div>
                    <div className="col-span-3 text-right font-mono">184.2 MB</div>
                  </div>
                  <div className="grid grid-cols-12 px-3 py-2 items-center text-slate-300">
                    <div className="col-span-5 flex items-center gap-2">
                      <Chrome className="w-3.5 h-3.5 text-amber-400" />
                      <span>Google Chrome (24 tabs)</span>
                    </div>
                    <div className="col-span-2 text-right text-slate-400 font-mono text-[11px]">Running</div>
                    <div className="col-span-2 text-right font-mono">4.8%</div>
                    <div className="col-span-3 text-right font-mono">1,420 MB</div>
                  </div>
                  <div className="grid grid-cols-12 px-3 py-2 items-center text-slate-300">
                    <div className="col-span-5 flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-blue-400" />
                      <span>Visual Studio Code</span>
                    </div>
                    <div className="col-span-2 text-right text-slate-400 font-mono text-[11px]">Running</div>
                    <div className="col-span-2 text-right font-mono">2.1%</div>
                    <div className="col-span-3 text-right font-mono">680 MB</div>
                  </div>
                  <div className="grid grid-cols-12 px-3 py-2 items-center text-slate-300">
                    <div className="col-span-5 flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Spotify Desktop</span>
                    </div>
                    <div className="col-span-2 text-right text-slate-400 font-mono text-[11px]">Running</div>
                    <div className="col-span-2 text-right font-mono">1.0%</div>
                    <div className="col-span-3 text-right font-mono">210 MB</div>
                  </div>
                  <div className="grid grid-cols-12 px-3 py-2 items-center text-slate-300">
                    <div className="col-span-5 flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                      <span>System Kernel & NTOSKRNL</span>
                    </div>
                    <div className="col-span-2 text-right text-slate-400 font-mono text-[11px]">System</div>
                    <div className="col-span-2 text-right font-mono">0.6%</div>
                    <div className="col-span-3 text-right font-mono">92 MB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 15. Slack / Discord / Team Workspace
    if (title.includes('slack') || title.includes('discord') || title.includes('team') || proc.includes('slack')) {
      return (
        <div className="w-full h-full bg-[#1a1d21] text-slate-200 flex flex-col font-sans select-none">
          <div className="h-10 bg-[#121016] border-b border-white/10 px-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white tracking-wide">Workspace Slack</span>
              <span className="text-[10px] text-slate-400">• #general</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-300">Online</span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Channel List */}
            <div className="w-52 bg-[#19171d] border-r border-white/10 p-3 flex flex-col gap-1 text-xs">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Channels</div>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/10 text-white font-medium text-left">
                <span className="text-slate-400">#</span> general
              </button>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-slate-400 text-left">
                <span className="text-slate-500">#</span> announcements
              </button>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-slate-400 text-left">
                <span className="text-slate-500">#</span> engineering
              </button>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-1">Direct Messages</div>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-slate-300 text-left">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Rahul V.
              </button>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-slate-400 text-left">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Sarah M.
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 flex flex-col bg-[#1a1d21]">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
                    RV
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-white text-xs">Rahul V.</span>
                      <span className="text-[10px] text-slate-400">10:42 AM</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1">
                      Are we ready with the project update and deployment metrics?
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                    AI
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-blue-300 text-xs">Windows Native Agent</span>
                      <span className="text-[10px] text-slate-400">Just now</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 font-mono">AUTONOMOUS</span>
                    </div>
                    <p className="text-xs text-slate-100 mt-1">
                      Automated update: All requested workflows executed and verified on system display.
                    </p>
                  </div>
                </div>
              </div>

              {/* Compose Bar */}
              <div className="p-3 border-t border-white/10 bg-[#222529]">
                <div className="p-2.5 rounded-lg border border-white/15 bg-[#1a1d21] flex items-center justify-between">
                  <span className="text-xs text-slate-400">Message #general...</span>
                  <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5">
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 16. Microsoft PowerPoint Slides
    if (title.includes('powerpoint') || title.includes('presentation') || proc.includes('powerpnt')) {
      return (
        <div className="w-full h-full bg-[#202020] text-slate-100 flex flex-col font-sans select-none">
          <div className="h-10 bg-[#b7472a] px-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2 font-semibold">
              <span>Microsoft PowerPoint</span>
              <span className="text-white/80 font-normal">- Presentation1.pptx</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-0.5 bg-black/20 hover:bg-black/30 rounded text-[11px]">Slide Show (F5)</button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Slide Thumbnails */}
            <div className="w-36 bg-[#2b2b2b] border-r border-[#3a3a3a] p-3 flex flex-col gap-3 overflow-y-auto">
              <div className="p-2 rounded bg-orange-600/30 border-2 border-orange-500 cursor-pointer">
                <div className="text-[10px] text-orange-400 font-mono mb-1">1</div>
                <div className="aspect-video bg-white text-slate-900 p-1.5 flex flex-col justify-center items-center rounded text-[8px] font-bold">
                  Autonomous Agents
                </div>
              </div>
              <div className="p-2 rounded bg-[#333] border border-transparent hover:border-slate-500 cursor-pointer">
                <div className="text-[10px] text-slate-400 font-mono mb-1">2</div>
                <div className="aspect-video bg-white text-slate-900 p-1.5 flex flex-col justify-center items-center rounded text-[8px]">
                  Architecture
                </div>
              </div>
            </div>

            {/* Slide Stage */}
            <div className="flex-1 flex items-center justify-center p-6 bg-[#181818]">
              <div className="w-full max-w-2xl aspect-video bg-white rounded-lg shadow-2xl p-8 text-slate-900 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-orange-600 uppercase tracking-widest">Executive Briefing</div>
                  <h1 className="text-2xl font-black text-slate-900 mt-2">Autonomous AI Agents on Windows</h1>
                  <p className="text-xs text-slate-600 mt-1 font-medium">Native Computer-Use & Multi-Modal Perception Architecture</p>
                </div>
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-800 font-medium">
                    <span className="w-2 h-2 rounded-full bg-orange-600" />
                    <span>Real-time screen perception via Desktop Duplication API</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-800 font-medium">
                    <span className="w-2 h-2 rounded-full bg-orange-600" />
                    <span>Native Win32 input injection via SendInput & BlockInput</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-800 font-medium">
                    <span className="w-2 h-2 rounded-full bg-orange-600" />
                    <span>Self-healing verification and Optical Character Recognition</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Drafted by AI Agent</span>
                  <span>Slide 1 of 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 17. Universal Modern Fluent Windows App Frame
    return (
      <div className="w-full h-full bg-[#1e1e24] text-slate-200 flex flex-col font-sans select-none">
        {/* Fluent Titlebar */}
        <div className="h-9 bg-[#18181c] border-b border-white/10 px-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-100">{activeWindow.title || 'Windows Application Workspace'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
              Win32 Handle: 0x00A41029
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>UI Automation Hook Active</span>
          </div>
        </div>

        {/* Dynamic App Workspace */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto bg-linear-to-b from-[#1e1e24] to-[#16161a]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Execution Environment</span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Resolution: {resolution[0]}x{resolution[1]}
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {activeWindow.title}
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              The agent is actively controlling this application using direct Windows UI Automation nodes, virtual keystrokes, and multi-modal optical verification.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[11px] text-slate-400 font-medium">Input Interception</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>BlockInput(TRUE)</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[11px] text-slate-400 font-medium">Target Process</div>
                <div className="text-sm font-semibold text-blue-400 mt-1 font-mono">
                  {activeWindow.process || 'system.exe'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[11px] text-slate-400 font-medium">Verification State</div>
                <div className="text-sm font-semibold text-purple-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OCR Loop Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-300">
              <Activity className="w-4 h-4 text-blue-400 animate-spin-slow" />
              <span>Agent is driving task step on screen</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              Cursor: ({cursorPos[0]}, {cursorPos[1]})
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 relative">
      {/* Top Controls Bar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-slate-200">LIVE DESKTOP</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {resolution[0]}×{resolution[1]} DPI 100%
          </span>
          {isControlling && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold animate-pulse">
              <Crosshair className="w-3 h-3" />
              INPUT ACTIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Autonomous Screen Freeze Toggle */}
          {onToggleFreeze && (
            <button
              onClick={onToggleFreeze}
              title={freezeEnabled ? "Physical input freeze during task: ENABLED (Click to disable)" : "Physical input freeze during task: DISABLED (Click to enable)"}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                freezeEnabled 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              {freezeEnabled ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-slate-400" />}
              <span>Auto Freeze: {freezeEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* View Toggle */}
          <div className="flex bg-slate-800 p-0.5 rounded text-xs">
            <button
              onClick={() => setViewMode('screen')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                viewMode === 'screen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Screen
            </button>
            <button
              onClick={() => setViewMode('uia')}
              className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'uia' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3 h-3" />
              UIA Tree
            </button>
          </div>

          {/* Visual Grounding Toggle */}
          <button
            onClick={() => setShowGroundingBoxes(!showGroundingBoxes)}
            title="Toggle Visual Grounding & Bounding Boxes"
            className={`p-1.5 rounded transition-colors ${
              showGroundingBoxes ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {showGroundingBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onRefresh}
            title="Capture New Desktop Frame"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className={`flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center transition-all ${
        (isInputFrozen || isControlling) ? 'p-1' : ''
      }`}>
        {/* Screen Input Frozen Overlay Banner */}
        {isInputFrozen && (
          <div className="absolute top-3 left-4 right-4 z-40 bg-amber-500/95 text-slate-950 font-sans px-4 py-2.5 rounded-xl shadow-2xl flex items-center justify-between border-2 border-amber-300 animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                <Lock className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider font-extrabold flex items-center gap-2">
                  <span>SCREEN INPUT FROZEN</span>
                  <span className="text-[10px] bg-slate-950 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Win32 BlockInput(TRUE)
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-900 opacity-90 flex items-center gap-2">
                  <span>Physical mouse & keyboard blocked. Agent executing:</span>
                  <strong className="text-slate-950 underline font-semibold truncate max-w-xs">
                    {currentStepTitle || goal || activeWindow.title}
                  </strong>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEmergencyUnfreeze && (
                <button
                  onClick={onEmergencyUnfreeze}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-400 text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Emergency unlock physical keyboard and mouse (Hotkey: Esc)"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>UNLOCK INPUT (ESC)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {viewMode === 'screen' ? (
          <div className={`w-full h-full relative overflow-hidden rounded-md transition-all ${
            (isInputFrozen || isControlling) ? 'animate-perimeter-glow border-2 border-amber-400/90' : ''
          }`}>
            {/* Autonomous Screen Freeze Perimeter Laser Runners & HUD Animation */}
            {(isInputFrozen || isControlling) && (
              <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
                {/* Top Border Laser Runner */}
                <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden z-30">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-runner-top shadow-[0_0_12px_rgba(251,191,36,1)]" />
                </div>

                {/* Bottom Border Laser Runner */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden z-30">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-runner-bottom shadow-[0_0_12px_rgba(251,191,36,1)]" />
                </div>

                {/* Left Border Laser Runner */}
                <div className="absolute top-0 bottom-0 left-0 w-[3px] overflow-hidden z-30">
                  <div className="w-full h-full bg-gradient-to-b from-transparent via-amber-300 to-transparent animate-runner-left shadow-[0_0_12px_rgba(251,191,36,1)]" />
                </div>

                {/* Right Border Laser Runner */}
                <div className="absolute top-0 bottom-0 right-0 w-[3px] overflow-hidden z-30">
                  <div className="w-full h-full bg-gradient-to-b from-transparent via-amber-300 to-transparent animate-runner-right shadow-[0_0_12px_rgba(251,191,36,1)]" />
                </div>

                {/* Sci-Fi Corner HUD Reticles */}
                {/* Top-Left Reticle */}
                <div className="absolute top-2 left-2 flex flex-col items-start gap-1 animate-corner-hud z-30">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                  <div className="flex items-center gap-1 bg-slate-950/90 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/50 backdrop-blur-sm shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>AI_ACTIVE</span>
                    <span className="opacity-60">[0, 0]</span>
                  </div>
                </div>

                {/* Top-Right Reticle */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1 animate-corner-hud z-30">
                  <div className="w-6 h-6 border-t-2 border-r-2 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                  <div className="flex items-center gap-1 bg-slate-950/90 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/50 backdrop-blur-sm shadow-md">
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                    <span>INPUT_LOCKED</span>
                    <span className="opacity-60">[{resolution[0]}, 0]</span>
                  </div>
                </div>

                {/* Bottom-Left Reticle */}
                <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1 animate-corner-hud z-30">
                  <div className="flex items-center gap-1 bg-slate-950/90 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/50 backdrop-blur-sm shadow-md">
                    <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                    <span>WIN32_PERCEPTION</span>
                  </div>
                  <div className="w-6 h-6 border-b-2 border-l-2 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                </div>

                {/* Bottom-Right Reticle */}
                <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 animate-corner-hud z-30">
                  <div className="flex items-center gap-1 bg-slate-950/90 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/50 backdrop-blur-sm shadow-md">
                    <span className="text-emerald-400 font-bold">100% DPI</span>
                    <span className="opacity-60">[{resolution[0]}, {resolution[1]}]</span>
                  </div>
                  <div className="w-6 h-6 border-b-2 border-r-2 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                </div>

                {/* Visual Perception Laser Scanline */}
                <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline pointer-events-none shadow-[0_0_12px_rgba(6,182,212,0.9)] z-25" />
              </div>
            )}

            {/* Desktop Screen Canvas */}
            {renderDesktopContent()}

            {/* Visual Grounding Bounding Box Overlays */}
            {showGroundingBoxes && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Dynamic Bounding Boxes based on detected UI Automation elements */}
                {uiaElements.map((elem) => {
                  const leftPct = (elem.rect.x / resolution[0]) * 100;
                  const topPct = (elem.rect.y / resolution[1]) * 100;
                  const widthPct = (elem.rect.width / resolution[0]) * 100;
                  const heightPct = (elem.rect.height / resolution[1]) * 100;

                  return (
                    <div
                      key={elem.id}
                      className="absolute border border-indigo-400/80 bg-indigo-500/10 rounded pointer-events-auto cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/20 transition-colors"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${Math.max(widthPct, 4)}%`,
                        height: `${Math.max(heightPct, 3)}%`,
                      }}
                      title={`UIA: [${elem.control_type}] "${elem.name}" (${elem.center_x}, ${elem.center_y})`}
                    >
                      <span className="absolute -top-4 left-0 px-1 py-0.5 text-[8px] font-mono bg-indigo-900/90 text-indigo-200 border border-indigo-500/40 rounded shadow-xs whitespace-nowrap z-10">
                        {elem.control_type}: {elem.name.slice(0, 18)}
                      </span>
                    </div>
                  );
                })}

                {/* Mouse Cursor Crosshair Marker & Concentric Click Ripples */}
                <div
                  className="absolute pointer-events-none transition-all duration-300 ease-out z-50 flex items-center justify-center"
                  style={{
                    left: `${(cursorPos[0] / resolution[0]) * 100}%`,
                    top: `${(cursorPos[1] / resolution[1]) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Concentric click ripples during control */}
                    {(isInputFrozen || isControlling) && (
                      <>
                        <div className="absolute w-12 h-12 rounded-full border-2 border-amber-400/80 animate-click-ripple" />
                        <div className="absolute w-16 h-16 rounded-full border border-cyan-400/60 animate-ping opacity-40" />
                      </>
                    )}
                    <Crosshair className="w-6 h-6 text-rose-500 animate-spin-slow drop-shadow-md" />
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <span className="absolute left-6 top-0 px-1.5 py-0.5 rounded bg-rose-600/90 text-[10px] text-white font-mono whitespace-nowrap shadow-md">
                      Mouse: ({cursorPos[0]}, {cursorPos[1]})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* UI Automation Tree Inspector */
          <div className="w-full h-full overflow-y-auto p-4 bg-slate-950 font-mono text-xs">
            <div className="mb-3 flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>Windows Accessibility / UI Automation Tree</span>
              <span className="text-[11px] text-blue-400">{uiaElements.length} elements inspected</span>
            </div>

            <div className="space-y-2">
              {uiaElements.map((el, i) => (
                <div
                  key={el.id || i}
                  onClick={() => setSelectedElement(el)}
                  className={`p-2.5 rounded border transition-colors cursor-pointer ${
                    selectedElement?.name === el.name
                      ? 'bg-blue-950/40 border-blue-500 text-slate-100'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-400">{el.control_type}</span>
                    <span className="text-[10px] text-slate-500">ID: {el.automation_id}</span>
                  </div>
                  <div className="text-slate-200 mt-1 font-sans text-xs">"{el.name}"</div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    BoundingRect: x={el.rect.x}, y={el.rect.y}, w={el.rect.width}, h={el.rect.height}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-7 bg-slate-900 border-t border-slate-800 px-3 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>Target: <strong className="text-slate-200">{activeWindow.process}</strong></span>
          <span>Hwnd: <strong className="font-mono text-slate-300">0x002403F</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Perception Latency: <strong className="text-emerald-400">18ms</strong></span>
        </div>
      </div>
    </div>
  );
}
