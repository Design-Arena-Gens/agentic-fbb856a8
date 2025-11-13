"use client";

import { SessionProvider } from "./session-provider";
import { ThemeProvider } from "./theme-provider";
import { PropsWithChildren } from "react";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <SessionProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </SessionProvider>
);
