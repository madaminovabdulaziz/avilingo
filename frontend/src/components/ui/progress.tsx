"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-primary/20",
        secondary: "bg-secondary",
        success: "bg-success/20",
        warning: "bg-warning/20",
        destructive: "bg-destructive/20",
        // ICAO Level variants
        "icao-1": "bg-red-500/20",
        "icao-2": "bg-red-500/20",
        "icao-3": "bg-amber-500/20",
        "icao-4": "bg-green-500/20",
        "icao-5": "bg-blue-500/20",
        "icao-6": "bg-purple-500/20",
      },
      size: {
        default: "h-2",
        sm: "h-1",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-muted-foreground",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
        // ICAO Level variants
        "icao-1": "bg-red-500",
        "icao-2": "bg-red-500",
        "icao-3": "bg-amber-500",
        "icao-4": "bg-green-500",
        "icao-5": "bg-blue-500",
        "icao-6": "bg-purple-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(progressIndicatorVariants({ variant }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Helper function to get ICAO variant from level number
function getIcaoProgressVariant(level: number): ProgressProps["variant"] {
  if (level >= 1 && level <= 6) {
    return `icao-${level}` as ProgressProps["variant"]
  }
  return "default"
}

// Circular Progress Component
interface CircularProgressProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "success" | "warning" | "destructive"
  label?: string
  className?: string
}

const sizeClasses = {
  sm: { container: "w-12 h-12", stroke: 4, text: "text-xs" },
  md: { container: "w-16 h-16", stroke: 5, text: "text-sm" },
  lg: { container: "w-20 h-20", stroke: 6, text: "text-base" },
}

const variantColors = {
  primary: "stroke-primary",
  success: "stroke-green-500",
  warning: "stroke-amber-500",
  destructive: "stroke-red-500",
}

function CircularProgress({
  value,
  max = 100,
  size = "md",
  variant = "primary",
  label,
  className,
}: CircularProgressProps) {
  const sizeConfig = sizeClasses[size]
  const normalizedValue = Math.min(Math.max(value, 0), max)
  const percentage = (normalizedValue / max) * 100
  
  // SVG calculations
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div className={cn("relative", sizeConfig.container, className)}>
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={sizeConfig.stroke}
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className={cn(variantColors[variant], "transition-all duration-300")}
          strokeWidth={sizeConfig.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", sizeConfig.text)}>
          {typeof value === "number" && value % 1 !== 0 
            ? value.toFixed(1) 
            : value}
        </span>
        {label && (
          <span className="text-[10px] text-muted-foreground uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export { Progress, progressVariants, getIcaoProgressVariant, CircularProgress }
