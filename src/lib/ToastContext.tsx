import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'ok' | 'err' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'ok') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-7 right-7 bg-surface3 border border-gold text-text px-5 py-3.5 rounded-xl text-sm z-[9999] shadow-lg transition-all duration-300 transform translate-y-0 opacity-100">
          {toast.type === 'ok' ? '✅ ' : toast.type === 'err' ? '❌ ' : 'ℹ️ '}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
