import React from 'react';
import { Sparkles, CheckCircle2, Info, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className="pointer-events-auto cursor-pointer animate-slide-up bg-[#0f0e0d]/95 backdrop-blur-md border border-[#d4b581]/40 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-start gap-3 text-[#e6e3df] transition-all duration-300 hover:border-[#d4b581]"
        >
          <div className="p-1 rounded bg-[#d4b581]/10 text-[#d4b581] shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif-display text-sm font-semibold text-[#e6e3df] leading-tight">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="font-serif-body text-xs text-[#e6e3df]/60 mt-1 line-clamp-2">
                {toast.message}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
