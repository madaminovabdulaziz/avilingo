import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80",
        category:
          "border-transparent bg-muted text-muted-foreground",
        // ICAO Level variants
        "icao-1":
          "border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/30",
        "icao-2":
          "border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/30",
        "icao-3":
          "border-amber-500/30 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
        "icao-4":
          "border-green-500/30 bg-green-500/20 text-green-400 hover:bg-green-500/30",
        "icao-5":
          "border-blue-500/30 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
        "icao-6":
          "border-purple-500/30 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

// Helper function to get ICAO variant from level number
function getIcaoVariant(level: number): BadgeProps["variant"] {
  if (level >= 1 && level <= 6) {
    return `icao-${level}` as BadgeProps["variant"]
  }
  return "default"
}

// ICAO Level Badge Component
interface IcaoLevelBadgeProps extends Omit<BadgeProps, "variant"> {
  level: number;
}

function IcaoLevelBadge({ level, className, ...props }: IcaoLevelBadgeProps) {
  const levelNames: Record<number, string> = {
    1: "Pre-Elementary",
    2: "Elementary",
    3: "Pre-Operational",
    4: "Operational",
    5: "Extended",
    6: "Expert",
  }
  
  return (
    <Badge 
      variant={getIcaoVariant(level)} 
      className={className}
      {...props}
    >
      Level {level}: {levelNames[level] || "Unknown"}
    </Badge>
  )
}

export { Badge, badgeVariants, getIcaoVariant, IcaoLevelBadge }
