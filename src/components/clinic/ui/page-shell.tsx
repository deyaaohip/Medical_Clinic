import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page container for every clinic portal screen.
 * Keeps padding, max width and vertical rhythm identical across pages.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1600px] space-y-8 px-5 py-6 sm:px-6 lg:px-8 lg:py-8 animate-in fade-in-0",
        className
      )}
    >
      {children}
    </div>
  );
}
