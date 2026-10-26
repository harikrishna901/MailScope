import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'ok' | 'bad' | 'unknown';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  show: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    showToast(options.message, options.type || 'info');
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, show }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success' || toast.type === 'ok';
            const isError = toast.type === 'error' || toast.type === 'bad';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="pointer-events-auto p-3.5 rounded-xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] shadow-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {isError && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  {!isSuccess && !isError && <Info className="w-4 h-4 text-[var(--accent)] shrink-0" />}
                  <span className="text-[var(--text-primary)] font-medium">{toast.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label="Dismiss toast"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
