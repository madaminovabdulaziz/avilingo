'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/motion';

// =============================================================================
// ICAO Gauge Component
// =============================================================================

interface ICAOGaugeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showLevel?: boolean;
  animated?: boolean;
  className?: string;
}

const ICAO_LEVEL_LABELS: Record<number, string> = {
  1: 'Pre-Elementary',
  2: 'Elementary',
  3: 'Pre-Operational',
  4: 'Operational',
  5: 'Extended',
  6: 'Expert',
};

const ICAO_COLORS: Record<number, { text: string; bg: string; ring: string }> = {
  1: { text: 'text-red-500', bg: 'bg-red-500', ring: 'ring-red-500/30' },
  2: { text: 'text-red-400', bg: 'bg-red-400', ring: 'ring-red-400/30' },
  3: { text: 'text-amber-500', bg: 'bg-amber-500', ring: 'ring-amber-500/30' },
  4: { text: 'text-green-500', bg: 'bg-green-500', ring: 'ring-green-500/30' },
  5: { text: 'text-blue-500', bg: 'bg-blue-500', ring: 'ring-blue-500/30' },
  6: { text: 'text-purple-500', bg: 'bg-purple-500', ring: 'ring-purple-500/30' },
};

const SIZE_CONFIG = {
  sm: { outer: 64, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { outer: 96, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { outer: 128, strokeWidth: 10, fontSize: 'text-3xl', labelSize: 'text-sm' },
  xl: { outer: 160, strokeWidth: 12, fontSize: 'text-4xl', labelSize: 'text-base' },
};

export function ICAOGauge({
  score,
  maxScore = 6,
  size = 'md',
  showLabel = true,
  showLevel = true,
  animated = true,
  className,
}: ICAOGaugeProps) {
  const config = SIZE_CONFIG[size];
  const level = Math.floor(Math.min(score, maxScore));
  const colors = ICAO_COLORS[level] || ICAO_COLORS[1];
  const percentage = (score / maxScore) * 100;
  const reducedMotion = useReducedMotion();
  
  const radius = (config.outer - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const shouldAnimate = animated && !reducedMotion;
  
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: config.outer, height: config.outer }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={config.outer}
          height={config.outer}
        >
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted"
          />
          {/* Progress arc - animated with Framer Motion */}
          <motion.circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className={colors.text}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={shouldAnimate ? { 
              duration: 1, 
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.2
            } : { duration: 0 }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={cn('font-bold', config.fontSize, colors.text)}
            initial={shouldAnimate ? { opacity: 0, scale: 0.5 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {score.toFixed(1)}
          </motion.span>
          {showLevel && (
            <span className={cn('text-muted-foreground', config.labelSize)}>
              Level {level}
            </span>
          )}
        </div>
      </div>
      
      {showLabel && (
        <motion.p 
          className={cn('mt-2 font-medium', colors.text, config.labelSize)}
          initial={shouldAnimate ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          {ICAO_LEVEL_LABELS[level]}
        </motion.p>
      )}
    </div>
  );
}

// =============================================================================
// ICAO Criteria Bar
// =============================================================================

interface ICAOCriteriaBarProps {
  label: string;
  score: number;
  maxScore?: number;
  showValue?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ICAOCriteriaBar({
  label,
  score,
  maxScore = 6,
  showValue = true,
  size = 'md',
  className,
}: ICAOCriteriaBarProps) {
  const percentage = (score / maxScore) * 100;
  const level = Math.floor(Math.min(score, maxScore));
  const colors = ICAO_COLORS[level] || ICAO_COLORS[1];
  const reducedMotion = useReducedMotion();
  
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-muted-foreground capitalize',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {label}
        </span>
        {showValue && (
          <motion.span 
            className={cn(
              'font-bold',
              colors.text,
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}
            initial={reducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {score.toFixed(1)}
          </motion.span>
        )}
      </div>
      <div className={cn(
        'rounded-full overflow-hidden bg-muted',
        size === 'sm' ? 'h-1.5' : 'h-2'
      )}>
        <motion.div
          className={cn('h-full rounded-full origin-left', colors.bg)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={reducedMotion ? { duration: 0 } : { 
            duration: 0.8, 
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.2
          }}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ICAOGauge;

