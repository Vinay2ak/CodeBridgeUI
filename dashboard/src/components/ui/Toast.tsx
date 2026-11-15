import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // Max 3 visible
      const updated = [ { ...toast, id }, ...prev ];
      return updated.slice(0, 3);
    });

    // 5 s auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container role="status" aria-live="polite", never steals focus */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((toast) => {
          const icon =
            toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-danger flex-shrink-0" />
            ) : (
              <Bell className="w-4 h-4 text-primary flex-shrink-0" />
            );

          return (
            <div
              key={toast.id}
              className="pointer-events-auto bg-surface-raised border border-border shadow-lg rounded-md p-3 flex items-start gap-3 transition-all duration-150 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text">{toast.title}</div>
                {toast.description && (
                  <div className="text-xs text-text-muted mt-0.5 break-words">
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss toast"
                className="text-text-muted hover:text-text p-1 rounded focus-visible:outline-2 focus-visible:outline-primary cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

