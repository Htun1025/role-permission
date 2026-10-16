"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { Toast } from "primereact/toast";

type ToastMessage = {
  severity: "success" | "info" | "warn" | "error";
  summary: string;
  detail: string;
};

type ToastContextType = {
  show: (message: ToastMessage) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toastRef = useRef<Toast>(null);

  const show = (message: ToastMessage) => {
    toastRef.current?.show(message);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      <Toast ref={toastRef} />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
