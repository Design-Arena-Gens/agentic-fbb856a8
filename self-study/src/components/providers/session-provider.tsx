"use client";

import { SessionProvider as NextAuthProvider } from "next-auth/react";
import { PropsWithChildren } from "react";

export const SessionProvider = ({ children }: PropsWithChildren) => (
  <NextAuthProvider>{children}</NextAuthProvider>
);
