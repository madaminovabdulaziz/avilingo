'use client';

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"
import { useReducedMotion, transitions } from "@/lib/motion"

const cardVariants = cva(
  "rounded-xl border text-card-foreground transition-colors",
  {
    variants: {
      variant: {
        default: "bg-card shadow",
        elevated: "bg-card shadow-lg",
        outline: "bg-transparent border-border",
        filled: "bg-surface border-transparent",
        interactive: "bg-card shadow hover:shadow-lg hover:border-primary/50 cursor-pointer",
        glass: "bg-card/50 backdrop-blur-sm border-border/50",
        warning: "bg-card border-amber-500/30",
        aviation: "bg-card border-border hover:border-primary/30 transition-all",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// =============================================================================
// Motion Card (with hover lift and click feedback)
// =============================================================================

export interface MotionCardProps
  extends Omit<HTMLMotionProps<"div">, "ref" | "children">,
    VariantProps<typeof cardVariants> {
  disableAnimation?: boolean;
  children?: React.ReactNode;
}

const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, variant, disableAnimation = false, children, ...props }, ref) => {
    const reducedMotion = useReducedMotion();
    const shouldAnimate = !disableAnimation && !reducedMotion && variant === "interactive";

    if (!shouldAnimate) {
      return (
        <div
          ref={ref}
          className={cn(cardVariants({ variant }), className)}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant }), className)}
        whileHover={{ 
          scale: 1.02, 
          y: -4,
          transition: transitions.gentle 
        }}
        whileTap={{ 
          scale: 0.98,
          transition: transitions.fast 
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = "MotionCard";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants, MotionCard }
