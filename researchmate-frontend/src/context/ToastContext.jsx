// src/context/ToastContext.jsx
import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, color: 'text-green-500',  bg: 'bg-green-50',  border: 'border-green-200' },
  error:   { Icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200'   },
  warning: { Icon: AlertCircle,  color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  info:    { Icon: Info,         color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
};

let _idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++_idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((toast) => {
          const { Icon, color, bg, border } = ICONS[toast.type] || ICONS.info;
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto max-w-xs w-full ${bg} ${border}`}
              style={{ animation: 'toast-in 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} />
              <span className="text-xs text-gray-800 flex-1 leading-relaxed">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(24px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

/** Hook to add toasts from any component */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
