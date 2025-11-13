import { cn } from "@/lib/utils";
import { HTMLAttributes, PropsWithChildren } from "react";

export const Card = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900",
      className,
    )}
  >
    {children}
  </div>
);

export const CardTitle = ({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) => (
  <h2 className={cn("text-lg font-semibold text-slate-900 dark:text-slate-100", className)}>
    {children}
  </h2>
);

export const CardDescription = ({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) => (
  <p className={cn("mt-1 text-sm text-slate-500 dark:text-slate-400", className)}>{children}</p>
);

export const CardContent = ({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn("mt-4 space-y-4", className)}>{children}</div>
);

export const CardFooter = ({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn("mt-6 flex items-center justify-end gap-3", className)}>{children}</div>
);

export const CardHeader = ({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
  <div className={cn("mb-4", className)} {...props}>
    {children}
  </div>
);
