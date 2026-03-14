"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Toast, { ToastType } from "../components/Toast";

interface ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toastData, setToastData] = useState<{ 
    message: string; 
    type: ToastType; 
    action?: { label: string; onClick: () => void } 
  } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info", options?: ToastOptions) => {
    setToastData({ message, type, action: options?.action });
    
    // Auto-dismiss after 4 seconds if it has an action (give user time to click)
    // or 2.5 seconds if it's just a message
    const duration = options?.action ? 5000 : 2500;
    
    const timer = setTimeout(() => {
      setToastData(current => (current?.message === message ? null : current));
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastData && (
        <Toast 
          message={toastData.message} 
          type={toastData.type} 
          action={toastData.action}
          onClose={() => setToastData(null)} 
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
