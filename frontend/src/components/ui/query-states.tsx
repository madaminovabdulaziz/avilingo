'use client';

import * as React from 'react';
import { AlertCircle, RefreshCw, Inbox, Loader2, WifiOff, SearchX, FileX2, Plane } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api-client';

// =============================================================================
// Spinner Component
// =============================================================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'muted';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerVariants: Record<SpinnerVariant, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
};

export function Spinner({ size = 'md', variant = 'primary', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin',
        spinnerSizes[size],
        spinnerVariants[variant],
        className
      )}
    />
  );
}

// =============================================================================
// Dots Loading Animation
// =============================================================================

interface DotsLoadingProps {
  className?: string;
}

export function DotsLoading({ className }: DotsLoadingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Pulse Ring Animation
// =============================================================================

interface PulseRingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulseRing({ size = 'md', className }: PulseRingProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('relative', sizes[size], className)}>
      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-primary/40 animate-pulse" />
      <div className="absolute inset-4 rounded-full bg-primary" />
    </div>
  );
}

// =============================================================================
// Loading State
// =============================================================================

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
}: LoadingStateProps) {
  const sizes = {
    sm: { spinner: 'sm' as SpinnerSize, text: 'text-xs', padding: 'py-6' },
    md: { spinner: 'lg' as SpinnerSize, text: 'text-sm', padding: 'py-12' },
    lg: { spinner: 'xl' as SpinnerSize, text: 'text-base', padding: 'py-16' },
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-muted-foreground',
        sizes[size].padding,
        className
      )}
    >
      <Spinner size={sizes[size].spinner} />
      <p className={cn('mt-3', sizes[size].text)}>{message}</p>
    </div>
  );
}

// =============================================================================
// Skeleton Component
// =============================================================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse bg-muted rounded', className)} />;
}

// =============================================================================
// Skeleton Card - Generic
// =============================================================================

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  hasIcon?: boolean;
  hasAction?: boolean;
}

export function SkeletonCard({
  className,
  lines = 2,
  hasIcon = false,
  hasAction = false,
}: SkeletonCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-3', className)}>
      <div className="flex items-start gap-3">
        {hasIcon && <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-1/2" />
          ))}
        </div>
        {hasAction && <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />}
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton List
// =============================================================================

interface SkeletonListProps {
  count?: number;
  className?: string;
  variant?: 'card' | 'row';
}

export function SkeletonList({
  count = 3,
  className,
  variant = 'row',
}: SkeletonListProps) {
  if (variant === 'card') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} hasIcon hasAction />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Skeleton Grid
// =============================================================================

interface SkeletonGridProps {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function SkeletonGrid({
  count = 6,
  columns = 3,
  className,
}: SkeletonGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} hasIcon lines={3} />
      ))}
    </div>
  );
}

// =============================================================================
// Dashboard Skeleton
// =============================================================================

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6 animate-pulse">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* ICAO Card skeleton */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </div>

      {/* Quick stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 text-center">
            <Skeleton className="w-5 h-5 mx-auto mb-2" />
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto mt-1" />
          </div>
        ))}
      </div>

      {/* Module cards skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} hasIcon lines={3} />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Vocabulary Skeleton
// =============================================================================

export function VocabularySkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 text-center">
            <Skeleton className="w-5 h-5 mx-auto mb-2" />
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto mt-1" />
          </div>
        ))}
      </div>
      <SkeletonGrid count={6} columns={3} />
    </div>
  );
}

// =============================================================================
// Exercise List Skeleton
// =============================================================================

export function ExerciseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} hasIcon hasAction lines={3} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

type ErrorType = 'generic' | 'network' | 'notFound' | 'forbidden' | 'server';

interface ErrorStateProps {
  error?: Error | ApiError | null;
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

const errorConfig: Record<ErrorType, { icon: React.ElementType; title: string; message: string; iconColor: string; bgColor: string }> = {
  generic: {
    icon: AlertCircle,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  network: {
    icon: WifiOff,
    title: 'Connection error',
    message: 'Unable to connect to the server. Check your internet connection.',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  notFound: {
    icon: SearchX,
    title: 'Not found',
    message: 'The requested resource could not be found.',
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  forbidden: {
    icon: AlertCircle,
    title: 'Access denied',
    message: 'You do not have permission to access this resource.',
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  server: {
    icon: AlertCircle,
    title: 'Server error',
    message: 'The server encountered an error. Please try again later.',
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
};

function getErrorType(error: Error | ApiError | null | undefined): ErrorType {
  if (!error) return 'generic';

  if (error instanceof ApiError) {
    if (error.isNotFound) return 'notFound';
    if (error.isForbidden) return 'forbidden';
    if (error.isServerError) return 'server';
  }

  if (error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('fetch')) {
    return 'network';
  }

  return 'generic';
}

export function ErrorState({
  error,
  type,
  title,
  message,
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  const errorType = type || getErrorType(error);
  const config = errorConfig[errorType];
  const Icon = config.icon;

  const displayTitle = title || config.title;
  const displayMessage = message || (error?.message) || config.message;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5', className)}>
        <Icon className={cn('w-5 h-5 flex-shrink-0', config.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{displayTitle}</p>
          <p className="text-xs text-muted-foreground truncate">{displayMessage}</p>
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', config.bgColor)}>
        <Icon className={cn('w-7 h-7', config.iconColor)} />
      </div>
      <h3 className="text-lg font-semibold mb-1">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm px-4">{displayMessage}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

type EmptyType = 'default' | 'search' | 'noData' | 'noResults';

interface EmptyStateProps {
  type?: EmptyType;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

const emptyIcons: Record<EmptyType, React.ElementType> = {
  default: Inbox,
  search: SearchX,
  noData: FileX2,
  noResults: SearchX,
};

export function EmptyState({
  type = 'default',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const DefaultIcon = emptyIcons[type];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-4 rounded-lg border bg-muted/30', className)}>
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          {icon || <DefaultIcon className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && (
          <Button variant={action.variant || 'outline'} size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {/* Decorative background circles */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl" />
        <div className="relative w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          {icon || <DefaultIcon className="w-8 h-8 text-muted-foreground" />}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm px-4">{description}</p>
      )}
      <div className="flex items-center gap-3">
        {action && (
          <Button variant={action.variant || 'default'} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Query State Wrapper
// =============================================================================

interface QueryStateWrapperProps<T> {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: T | undefined;
  isEmpty?: (data: T) => boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
}

export function QueryStateWrapper<T>({
  isLoading,
  isError,
  error,
  data,
  isEmpty,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  children,
}: QueryStateWrapperProps<T>) {
  if (isLoading) {
    return <>{loadingComponent || <LoadingState />}</>;
  }

  if (isError) {
    return <>{errorComponent || <ErrorState error={error} onRetry={onRetry} />}</>;
  }

  if (!data || (isEmpty && isEmpty(data))) {
    return (
      <>
        {emptyComponent || (
          <EmptyState title="No data" description="There's nothing here yet." />
        )}
      </>
    );
  }

  return <>{children(data)}</>;
}

// =============================================================================
// Inline Loading
// =============================================================================

interface InlineLoadingProps {
  size?: 'sm' | 'md';
  text?: string;
}

export function InlineLoading({ size = 'sm', text }: InlineLoadingProps) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <Spinner size={size === 'sm' ? 'xs' : 'sm'} variant="muted" />
      {text && <span className="text-xs">{text}</span>}
    </span>
  );
}

// =============================================================================
// Page Loading
// =============================================================================

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingState message={message} size="lg" />
    </div>
  );
}

// =============================================================================
// Full Page Loading (for Auth)
// =============================================================================

interface FullPageLoadingProps {
  message?: string;
  showLogo?: boolean;
}

export function FullPageLoading({ message = 'Loading...', showLogo = true }: FullPageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {showLogo && (
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plane className="w-8 h-8 text-primary" />
            </div>
          </div>
        )}
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-muted-foreground animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Button Loading State
// =============================================================================

interface ButtonLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function ButtonLoading({ isLoading, loadingText = 'Loading...', children }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2">
        <Spinner size="xs" variant="default" />
        {loadingText}
      </span>
    );
  }
  return <>{children}</>;
}

// =============================================================================
// Card Loading
// =============================================================================

interface CardLoadingProps {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function CardLoading({ count = 3, columns = 3, className }: CardLoadingProps) {
  return <SkeletonGrid count={count} columns={columns} className={className} />;
}

// =============================================================================
// Progress Page Skeleton
// =============================================================================

export function ProgressSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <Skeleton className="w-5 h-5 mb-2" />
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

// =============================================================================
// Overlay Loading
// =============================================================================

interface OverlayLoadingProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function OverlayLoading({ isLoading, message, children }: OverlayLoadingProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <LoadingState message={message} size="sm" />
        </div>
      )}
    </div>
  );
}
