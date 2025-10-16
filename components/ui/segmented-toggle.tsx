"use client";

import { cn } from "@/lib/utils";

interface SegmentedToggleOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  options: SegmentedToggleOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function SegmentedToggle({ 
  options, 
  value, 
  onValueChange, 
  className 
}: SegmentedToggleProps) {
  return (
    <div className={cn(
      "inline-flex rounded-lg border bg-white p-1",
      className
    )}>
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "relative px-3 py-1.5 text-sm font-medium transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "first:rounded-l-md last:rounded-r-md",
            value === option.value
              ? "bg-blue-100 text-blue-700 shadow-sm"
              : "text-blue-600 hover:bg-blue-50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
