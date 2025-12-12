"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked: controlledChecked, ...props }, ref) => {
    const isControlled = controlledChecked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(false);
    const checked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
    };

    const handleDivClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!props.disabled) {
        const newChecked = !checked;
        if (!isControlled) {
          setUncontrolledChecked(newChecked);
        }
        onCheckedChange?.(newChecked);
      }
    };

    return (
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white cursor-pointer flex items-center justify-center",
            className
          )}
          data-state={checked ? "checked" : "unchecked"}
          onClick={handleDivClick}
          role="checkbox"
          aria-checked={checked}
          tabIndex={props.disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !props.disabled) {
              e.preventDefault();
              const newChecked = !checked;
              if (!isControlled) {
                setUncontrolledChecked(newChecked);
              }
              onCheckedChange?.(newChecked);
            }
          }}
        >
          {checked && (
            <Check className="h-3 w-3 text-white" />
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
