'use client';

import { useEffect, useState } from 'react';
import type { Variants, Transition } from 'framer-motion';

// =============================================================================
// Reduced Motion Hook
// =============================================================================

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// =============================================================================
// Default Transitions (fast: 200-400ms)
// =============================================================================

export const transitions = {
  // Fast and snappy
  fast: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } as Transition,
  
  // Standard
  default: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } as Transition,
  
  // Smooth
  smooth: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } as Transition,
  
  // Spring for natural motion
  spring: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  
  // Bouncy spring for playful elements
  bouncy: { type: 'spring', stiffness: 500, damping: 20 } as Transition,
  
  // Gentle spring for cards
  gentle: { type: 'spring', stiffness: 300, damping: 25 } as Transition,
  
  // Stiff for snappy interactions
  stiff: { type: 'spring', stiffness: 600, damping: 35 } as Transition,
} as const;

// =============================================================================
// Page Transition Variants
// =============================================================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
      when: 'beforeChildren',
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// =============================================================================
// Fade In Variants
// =============================================================================

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const fadeInScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// =============================================================================
// Stagger Container Variants
// =============================================================================

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// =============================================================================
// Card Hover/Tap Variants
// =============================================================================

export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transition: transitions.gentle,
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: transitions.fast,
  },
};

export const buttonHoverVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.03, transition: transitions.fast },
  tap: { scale: 0.97, transition: { duration: 0.1 } },
};

// =============================================================================
// Flashcard 3D Flip Variants
// =============================================================================

export const flashcardVariants: Variants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// =============================================================================
// Swipe Variants (for flashcard swiping)
// =============================================================================

export const swipeVariants: Variants = {
  center: {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    scale: 1,
  },
  swipeLeft: {
    x: -300,
    y: 50,
    rotate: -15,
    opacity: 0,
    transition: transitions.spring,
  },
  swipeRight: {
    x: 300,
    y: 50,
    rotate: 15,
    opacity: 0,
    transition: transitions.spring,
  },
  enter: {
    x: 0,
    y: 50,
    opacity: 0,
    scale: 0.95,
  },
};

// =============================================================================
// Pulse Animation Variants
// =============================================================================

export const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const recordingPulseVariants: Variants = {
  initial: { scale: 1, opacity: 0.5 },
  recording: {
    scale: [1, 1.3, 1],
    opacity: [0.5, 0.2, 0.5],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// Waveform Bar Variants
// =============================================================================

export const waveformBarVariants: Variants = {
  idle: {
    scaleY: 0.3,
    transition: { duration: 0.2 },
  },
  active: (custom: number) => ({
    scaleY: custom,
    transition: { duration: 0.1 },
  }),
};

// =============================================================================
// Progress Fill Variants
// =============================================================================

export const progressFillVariants: Variants = {
  initial: { scaleX: 0 },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export const circularProgressVariants: Variants = {
  initial: { pathLength: 0 },
  animate: (progress: number) => ({
    pathLength: progress / 100,
    transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

// =============================================================================
// Streak Fire Variants
// =============================================================================

export const fireVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.1, 1.05, 1.15, 1],
    rotate: [0, -3, 2, -2, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'easeInOut',
    },
  },
};

export const fireGlowVariants: Variants = {
  initial: { opacity: 0.3, scale: 1 },
  animate: {
    opacity: [0.3, 0.6, 0.3],
    scale: [1, 1.2, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// Achievement Celebration Variants
// =============================================================================

export const celebrationVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  celebrate: {
    scale: [1, 1.2, 1],
    rotate: [0, -5, 5, 0],
    transition: {
      duration: 0.5,
      times: [0, 0.3, 0.6, 1],
    },
  },
};

export const confettiVariants: Variants = {
  initial: (custom: { x: number; delay: number }) => ({
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
  }),
  animate: (custom: { x: number; delay: number }) => ({
    opacity: [1, 1, 0],
    x: custom.x,
    y: [0, -100, 200],
    rotate: [0, 180, 360],
    scale: [1, 1.2, 0.5],
    transition: {
      duration: 1.5,
      delay: custom.delay,
      ease: 'easeOut',
    },
  }),
};

export const starBurstVariants: Variants = {
  initial: { opacity: 0, scale: 0 },
  animate: (custom: { angle: number; delay: number }) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0.5],
    x: Math.cos(custom.angle * (Math.PI / 180)) * 60,
    y: Math.sin(custom.angle * (Math.PI / 180)) * 60,
    transition: {
      duration: 0.6,
      delay: custom.delay,
      ease: 'easeOut',
    },
  }),
};

// =============================================================================
// Modal/Dialog Variants
// =============================================================================

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

// =============================================================================
// Slide Variants
// =============================================================================

export const slideInFromRightVariants: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 35 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const slideInFromLeftVariants: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 35 },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const slideInFromBottomVariants: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 35 },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// =============================================================================
// Shake Variant (for errors)
// =============================================================================

export const shakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

// =============================================================================
// Success Check Variants
// =============================================================================

export const checkmarkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.4, ease: 'easeOut' },
      opacity: { duration: 0.1 },
    },
  },
};

// =============================================================================
// List Item Drag Variants
// =============================================================================

export const draggableVariants: Variants = {
  idle: { scale: 1, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  dragging: {
    scale: 1.02,
    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    cursor: 'grabbing',
  },
};

// =============================================================================
// Helper: Get variants with reduced motion support
// =============================================================================

export function getMotionProps(
  variants: Variants,
  reducedMotion: boolean
): { variants: Variants; initial: string; animate: string } | Record<string, never> {
  if (reducedMotion) {
    return {};
  }
  return {
    variants,
    initial: 'hidden',
    animate: 'visible',
  };
}

