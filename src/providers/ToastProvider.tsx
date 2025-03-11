"use client";

import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";

export default function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#fff",
            color: "#333",
          },
          success: {
            style: {
              borderLeft: "4px solid #10b981",
            },
          },
          error: {
            style: {
              borderLeft: "4px solid #ef4444",
            },
          },
        }}
      />
    </>
  );
} 