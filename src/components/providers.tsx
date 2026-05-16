"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        richColors
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "glass border border-white/10",
          },
        }}
      />
    </SessionProvider>
  );
}
