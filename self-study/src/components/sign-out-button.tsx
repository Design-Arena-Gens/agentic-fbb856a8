"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

export const SignOutButton = () => (
  <Button
    variant="ghost"
    onClick={() => signOut({ callbackUrl: "/login" })}
    className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-300"
  >
    Log out
  </Button>
);
