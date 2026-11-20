import { memo, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1020]">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/12 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-display text-lg font-bold text-slate-950 dark:text-white"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
