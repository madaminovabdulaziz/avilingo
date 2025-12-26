'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useReducedMotion,
  transitions,
  pageVariants,
  fadeInUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
  cardHoverVariants,
  flashcardVariants,
  swipeVariants,
  recordingPulseVariants,
  waveformBarVariants,
  fireVariants,
  fireGlowVariants,
  celebrationVariants,
  starBurstVariants,
  circularProgressVariants,
} from '@/lib/motion';
import { Flame, Star } from 'lucide-react';

// =============================================================================
// Page Transition Wrapper
// =============================================================================

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// Fade In Component
// =============================================================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({ children, delay = 0, className, direction = 'up' }: FadeInProps) {
  const reducedMotion = useReducedMotion();

  const directionOffset = {
    up: { y: 16 },
    down: { y: -16 },
    left: { x: 16 },
    right: { x: -16 },
    none: {},
  };

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// Stagger Container
// =============================================================================

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.05 }: StaggerContainerProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
        },
      }}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// =============================================================================
// Animated Card (Hover Lift + Click Feedback)
// =============================================================================

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  disabled?: boolean;
}

export function AnimatedCard({ children, className, disabled, ...props }: AnimatedCardProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || disabled) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02, y: -4, transition: transitions.gentle }}
      whileTap={{ scale: 0.98, transition: transitions.fast }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// Flashcard with 3D Flip
// =============================================================================

interface FlashcardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped: boolean;
  onFlip?: () => void;
  className?: string;
}

export function Flashcard({ front, back, isFlipped, onFlip, className }: FlashcardProps) {
  const reducedMotion = useReducedMotion();

  const handleClick = () => {
    onFlip?.();
  };

  if (reducedMotion) {
    return (
      <div className={cn('cursor-pointer', className)} onClick={handleClick}>
        {isFlipped ? back : front}
      </div>
    );
  }

  return (
    <div
      className={cn('perspective-1000 cursor-pointer', className)}
      onClick={handleClick}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative w-full h-full transform-style-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden rotate-y-180"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Swipeable Card with Spring Physics
// =============================================================================

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  threshold = 100,
  className,
}: SwipeCardProps) {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  // Swipe indicator colors
  const leftIndicatorOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, threshold], [0, 1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = threshold;
    const velocityThreshold = 500;

    if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      onSwipeLeft?.();
    } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      onSwipeRight?.();
    } else if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) {
      onSwipeUp?.();
    }
  };

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn('touch-none', className)}
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
      transition={transitions.spring}
    >
      {/* Swipe indicators */}
      <motion.div
        className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white pointer-events-none"
        style={{ opacity: leftIndicatorOpacity }}
      >
        ✗
      </motion.div>
      <motion.div
        className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white pointer-events-none"
        style={{ opacity: rightIndicatorOpacity }}
      >
        ✓
      </motion.div>
      {children}
    </motion.div>
  );
}

// =============================================================================
// Audio Waveform Visualization
// =============================================================================

interface WaveformProps {
  audioLevel: number; // 0-1
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export function Waveform({ audioLevel, isActive, barCount = 5, className }: WaveformProps) {
  const reducedMotion = useReducedMotion();

  const bars = Array.from({ length: barCount }, (_, i) => {
    // Create varying heights based on position and audio level
    const baseHeight = 0.3 + Math.sin((i / barCount) * Math.PI) * 0.2;
    const height = isActive ? baseHeight + audioLevel * (0.7 - baseHeight) : 0.2;
    return height;
  });

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full origin-center"
          initial={{ scaleY: 0.2 }}
          animate={{
            scaleY: reducedMotion ? (isActive ? 0.6 : 0.2) : height,
            transition: { duration: 0.1 },
          }}
          style={{ height: 24 }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Recording Pulse Animation
// =============================================================================

interface RecordingPulseProps {
  isRecording: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RecordingPulse({ isRecording, size = 'md', className }: RecordingPulseProps) {
  const reducedMotion = useReducedMotion();

  const sizes = {
    sm: { outer: 'w-8 h-8', inner: 'w-4 h-4' },
    md: { outer: 'w-12 h-12', inner: 'w-6 h-6' },
    lg: { outer: 'w-16 h-16', inner: 'w-8 h-8' },
  };

  if (reducedMotion) {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        <div className={cn(sizes[size].outer, 'rounded-full', isRecording ? 'bg-red-500/20' : 'bg-muted')} />
        <div className={cn(sizes[size].inner, 'absolute rounded-full', isRecording ? 'bg-red-500' : 'bg-muted-foreground')} />
      </div>
    );
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <AnimatePresence>
        {isRecording && (
          <>
            {/* Outer pulse rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(sizes[size].outer, 'absolute rounded-full bg-red-500')}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.4, 0.2, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      
      {/* Static background */}
      <div className={cn(sizes[size].outer, 'rounded-full', isRecording ? 'bg-red-500/20' : 'bg-muted')} />
      
      {/* Inner dot */}
      <motion.div
        className={cn(sizes[size].inner, 'absolute rounded-full', isRecording ? 'bg-red-500' : 'bg-muted-foreground')}
        animate={isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// =============================================================================
// Animated Progress Gauge (Circular)
// =============================================================================

interface AnimatedGaugeProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedGauge({
  value,
  size = 100,
  strokeWidth = 8,
  className,
  children,
}: AnimatedGaugeProps) {
  const reducedMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="text-primary"
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: reducedMotion
              ? circumference - (value / 100) * circumference
              : circumference - (value / 100) * circumference,
          }}
          transition={reducedMotion ? { duration: 0 } : { duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// Animated Streak Fire
// =============================================================================

interface AnimatedStreakFireProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const fireSizes = {
  sm: { icon: 20, container: 32 },
  md: { icon: 28, container: 48 },
  lg: { icon: 40, container: 64 },
  xl: { icon: 56, container: 80 },
};

function getStreakColor(streak: number): string {
  if (streak === 0) return 'text-muted-foreground';
  if (streak >= 30) return 'text-purple-500';
  if (streak >= 14) return 'text-blue-500';
  if (streak >= 7) return 'text-green-500';
  return 'text-orange-500';
}

export function AnimatedStreakFire({ streak, size = 'md', className }: AnimatedStreakFireProps) {
  const reducedMotion = useReducedMotion();
  const config = fireSizes[size];
  const color = getStreakColor(streak);

  if (reducedMotion || streak === 0) {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        <Flame
          className={color}
          style={{ width: config.icon, height: config.icon }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: config.container, height: config.container }}
    >
      {/* Glow effect */}
      <motion.div
        className={cn('absolute inset-0 rounded-full blur-lg', color.replace('text-', 'bg-'))}
        variants={fireGlowVariants}
        initial="initial"
        animate="animate"
        style={{ opacity: 0.3 }}
      />
      
      {/* Fire icon with animation */}
      <motion.div
        variants={fireVariants}
        initial="initial"
        animate="animate"
      >
        <Flame
          className={color}
          style={{ width: config.icon, height: config.icon }}
        />
      </motion.div>
    </div>
  );
}

// =============================================================================
// Achievement Celebration
// =============================================================================

interface AchievementCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  title: string;
  icon?: React.ReactNode;
  className?: string;
}

export function AchievementCelebration({
  isVisible,
  onComplete,
  title,
  icon,
  className,
}: AchievementCelebrationProps) {
  const reducedMotion = useReducedMotion();

  // Generate star positions
  const stars = Array.from({ length: 8 }, (_, i) => ({
    angle: i * 45,
    delay: i * 0.05,
  }));

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-card rounded-2xl p-8 text-center shadow-2xl"
            variants={celebrationVariants}
            initial="hidden"
            animate={['visible', 'celebrate']}
            exit="hidden"
          >
            {/* Star burst effect */}
            {!reducedMotion && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                {stars.map((star, i) => (
                  <motion.div
                    key={i}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    custom={star}
                    variants={starBurstVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Achievement icon */}
            <motion.div
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
              animate={reducedMotion ? {} : { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {icon || <Star className="w-10 h-10 text-primary" />}
            </motion.div>
            
            {/* Title */}
            <motion.h2
              className="text-2xl font-bold mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              🎉 Achievement Unlocked!
            </motion.h2>
            
            <motion.p
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {title}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Animated List Item
// =============================================================================

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

export function AnimatedListItem({ children, index, className }: AnimatedListItemProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// Presence Animation Wrapper
// =============================================================================

interface PresenceProps {
  children: React.ReactNode;
  isVisible: boolean;
  mode?: 'sync' | 'wait' | 'popLayout';
}

export function Presence({ children, isVisible, mode = 'sync' }: PresenceProps) {
  return (
    <AnimatePresence mode={mode}>
      {isVisible && children}
    </AnimatePresence>
  );
}

// =============================================================================
// Re-export AnimatePresence for convenience
// =============================================================================

export { AnimatePresence, motion };

