// AviLingo Design System Components
// Re-export all UI components for easy importing

export { Avatar, AvatarFallback, AvatarImage } from "./avatar"
export { Badge, badgeVariants, getIcaoVariant, IcaoLevelBadge } from "./badge"
export { Button, buttonVariants } from "./button"
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  MotionCard,
} from "./card"
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu"
export { Input, inputVariants } from "./input"
export { Label } from "./label"
export { Progress, progressVariants, getIcaoProgressVariant, CircularProgress } from "./progress"
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
  type ToastProps,
} from "./toast"
export { Toaster } from "./toaster"

// Loading & Error State Components
export {
  // Spinners
  Spinner,
  DotsLoading,
  PulseRing,
  // Loading States
  LoadingState,
  InlineLoading,
  PageLoading,
  FullPageLoading,
  ButtonLoading,
  CardLoading,
  OverlayLoading,
  // Skeletons
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonGrid,
  DashboardSkeleton,
  VocabularySkeleton,
  ExerciseListSkeleton,
  ProgressSkeleton,
  // Error & Empty States
  ErrorState,
  EmptyState,
  // Query Wrapper
  QueryStateWrapper,
} from "./query-states"

// Error Boundaries
export {
  ErrorBoundary,
  ErrorFallback,
  PageErrorBoundary,
  SectionErrorBoundary,
  withErrorBoundary,
} from "./error-boundary"

// Motion Components
export {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedCard,
  Flashcard,
  SwipeCard,
  Waveform,
  RecordingPulse,
  AnimatedGauge,
  AnimatedStreakFire,
  AchievementCelebration,
  AnimatedListItem,
  Presence,
  AnimatePresence,
  motion,
} from "./motion"

// Re-export types
export type { ButtonProps } from "./button"
export type { BadgeProps } from "./badge"
export type { CardProps } from "./card"
export type { MotionCardProps } from "./card"
export type { InputProps } from "./input"
export type { ProgressProps } from "./progress"
export type { SpinnerSize } from "./query-states"
