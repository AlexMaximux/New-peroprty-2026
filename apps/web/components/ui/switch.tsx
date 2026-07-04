'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, checked, defaultChecked, disabled, onCheckedChange, required }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      'inline-flex h-[1.5rem] w-[2.5em] shrink-0 items-center rounded-full border-2 border-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary',
      className
    )}
    checked={checked}
    defaultChecked={defaultChecked}
    disabled={disabled}
    onCheckedChange={onCheckedChange}
    required={required}
    ref={ref}
  >
    <span className="sr-only" />
    <SwitchPrimitive.Thumb
      className={cn(
        'block h-[1.25rem] w-[1.25rem] rounded-full bg-background shadow-lg ring-0 transition-transform',
        'data-[state=checked]:translate-x-[1.25em]'
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export default Switch;
