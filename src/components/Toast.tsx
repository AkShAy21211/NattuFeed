"use client";

import React from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, action }) => {
  const styles = {
    success: "bg-emerald-600 border-emerald-500 shadow-emerald-500/20",
    error: "bg-red-600 border-red-500 shadow-red-500/20",
    info: "bg-blue-600 border-blue-500 shadow-blue-500/20",
    warning: "bg-amber-500 border-amber-400 shadow-amber-500/20",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[95%] max-w-sm animate-in fade-in slide-in-from-top-6 duration-500">
      <div className={`flex flex-col gap-3 p-4 rounded-2xl text-white shadow-2xl border backdrop-blur-md ${styles[type]}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {icons[type]}
          </div>
          <p className="flex-1 text-[13px] font-black leading-tight tracking-tight">
            {message}
          </p>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {action && (
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="px-4 py-1.5 bg-white text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
