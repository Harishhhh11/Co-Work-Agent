import { ShieldAlert, Check, X } from 'lucide-react';

interface ConfirmationModalProps {
  confirmation: {
    id: string;
    action_type: string;
    description: string;
    params: Record<string, any>;
  } | null;
  onApprove: (actionId: string) => void;
  onCancel: (actionId: string) => void;
}

export function ConfirmationModal({
  confirmation,
  onApprove,
  onCancel,
}: ConfirmationModalProps) {
  if (!confirmation) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              CONFIRM SENSITIVE ACTION
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              User authorization required before modifying external state
            </p>
          </div>
        </div>

        {/* Action description */}
        <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 p-3.5 rounded-lg text-xs space-y-2">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {confirmation.description}
          </p>

          {confirmation.params?.message && (
            <div className="bg-white dark:bg-slate-950 p-2.5 rounded border border-purple-100 dark:border-purple-900/40 font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all">
              "{confirmation.params.message}"
            </div>
          )}

          {confirmation.params?.recipient && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Recipient: <span className="font-medium text-purple-600 dark:text-purple-400">{confirmation.params.recipient}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onCancel(confirmation.id)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            CANCEL
          </button>
          <button
            onClick={() => onApprove(confirmation.id)}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            APPROVE ACTION
          </button>
        </div>
      </div>
    </div>
  );
}
