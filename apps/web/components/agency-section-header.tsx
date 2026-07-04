'use client';

import { ReactNode } from 'react';

type AgencySectionHeaderProps = {
  step: number;
  title: string;
  icon?: ReactNode;
};

export function AgencySectionHeader({ step, title, icon }: AgencySectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-muted/30">
      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
        {step}
      </div>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}