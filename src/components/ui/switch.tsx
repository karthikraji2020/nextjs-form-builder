"use client";

import * as React from 'react';

import { cn } from '@/lib/utils';

interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          data-slot="switch"
          className={cn("peer sr-only", className)}
          {...props}
        />
        <div className="peer-checked:bg-primary peer-unchecked:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:peer-unchecked:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none peer-focus-visible:ring-[3px] peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
          <div
            data-slot="switch-thumb"
            className="bg-background dark:peer-unchecked:bg-foreground dark:peer-checked:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform peer-checked:translate-x-[calc(100%-2px)] peer-unchecked:translate-x-0"
          />
        </div>
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
