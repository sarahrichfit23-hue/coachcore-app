"use client";

import { QueryProvider } from "./query-provider";
import { ToastProvider } from "./toast-provider";
import { SessionProvider } from "./session-provider";
import NProgressProvider from "./nprogress-provider";
import { type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryProvider>
        <NProgressProvider>
          {children}
          <ToastProvider />
        </NProgressProvider>
      </QueryProvider>
    </SessionProvider>
  );
}

export { QueryProvider } from "./query-provider";
export { ToastProvider } from "./toast-provider";
export { SessionProvider, useSession } from "./session-provider";
export type { User } from "./session-provider";
