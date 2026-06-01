"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterTooltipProps {
  label: string;
  hint: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterTooltip({ label, hint, children, className }: FilterTooltipProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</label>
        <Tooltip.Provider delayDuration={200}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                className="glow-cyan inline-flex rounded-full text-slate-500 transition-colors hover:text-cyan-accent"
                aria-label={`${label} help`}
              >
                <HelpCircle size={12} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="left"
                sideOffset={6}
                className="z-[2000] max-w-[220px] rounded-lg border border-slate-border bg-surface px-3 py-2 text-[11px] leading-relaxed text-slate-200 shadow-cyan-glow"
              >
                {hint}
                <Tooltip.Arrow className="fill-surface" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      {children}
    </div>
  );
}
