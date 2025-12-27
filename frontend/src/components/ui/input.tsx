import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border bg-transparent text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default:
          "border-input shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
        filled:
          "border-transparent bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-background focus-visible:border-primary",
        ghost:
          "border-transparent hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        error:
          "border-destructive focus-visible:ring-2 focus-visible:ring-destructive text-destructive",
        aviation:
          "h-11 rounded-xl border-border bg-card focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
      },
      inputSize: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, icon, ...props }, ref) => {
    // For aviation variant with icon
    if (variant === "aviation" && icon) {
      return (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
          <input
            type={type}
            className={cn(inputVariants({ variant, inputSize }), "pl-10", className)}
            ref={ref}
            {...props}
          />
        </div>
      )
    }

    // For aviation variant without icon
    if (variant === "aviation") {
      return (
        <input
          type={type}
          className={cn(
            inputVariants({ variant, inputSize }),
            "px-4",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }

    // Default input
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
