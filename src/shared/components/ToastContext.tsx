import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, description?: string, durationMs?: number) => void;
  success: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  danger: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string, durationMs = 4500) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, title, description, durationMs };
      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => showToast('success', title, description), [showToast]);
  const warning = useCallback((title: string, description?: string) => showToast('warning', title, description), [showToast]);
  const danger = useCallback((title: string, description?: string) => showToast('danger', title, description), [showToast]);
  const info = useCallback((title: string, description?: string) => showToast('info', title, description), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, warning, danger, info }}>
      {children}

      {/* Floating Non-Intrusive Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
              warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
              danger: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
              info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
            };

            const styles = {
              success: 'bg-white dark:bg-neutral-900 border-emerald-300 dark:border-emerald-800 text-neutral-900 dark:text-neutral-100',
              warning: 'bg-white dark:bg-neutral-900 border-amber-300 dark:border-amber-800 text-neutral-900 dark:text-neutral-100',
              danger: 'bg-white dark:bg-neutral-900 border-rose-300 dark:border-rose-800 text-neutral-900 dark:text-neutral-100',
              info: 'bg-white dark:bg-neutral-900 border-blue-300 dark:border-blue-800 text-neutral-900 dark:text-neutral-100',
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto p-4 rounded-2xl border shadow-lg flex items-start justify-between gap-3 ${styles[toast.type]}`}
              >
                <div className="flex items-start gap-3">
                  {icons[toast.type]}
                  <div>
                    <h4 className="text-sm font-bold">{toast.title}</h4>
                    {toast.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                        {toast.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Cerrar notificación"
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};
