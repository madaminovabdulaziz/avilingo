'use client';

import { cn } from '@/lib/utils';
import { Flame, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion, fireVariants, fireGlowVariants } from '@/lib/motion';

// =============================================================================
// Streak Display Component
// =============================================================================

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak?: number;
  isAtRisk?: boolean;
  freezeAvailable?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const SIZE_CONFIG = {
  sm: { icon: 20, main: 'text-2xl', label: 'text-xs' },
  md: { icon: 28, main: 'text-4xl', label: 'text-sm' },
  lg: { icon: 40, main: 'text-5xl', label: 'text-base' },
  xl: { icon: 56, main: 'text-6xl', label: 'text-lg' },
};

function getStreakColor(streak: number, isAtRisk: boolean = false): string {
  if (isAtRisk) return 'text-amber-500';
  if (streak === 0) return 'text-muted-foreground';
  if (streak >= 30) return 'text-purple-500';
  if (streak >= 14) return 'text-blue-500';
  if (streak >= 7) return 'text-green-500';
  return 'text-orange-500';
}

function getFlameColor(streak: number, isAtRisk: boolean = false): string {
  if (isAtRisk) return 'text-amber-500 animate-pulse';
  if (streak === 0) return 'text-muted-foreground';
  if (streak >= 30) return 'text-purple-500';
  if (streak >= 14) return 'text-blue-500';
  if (streak >= 7) return 'text-green-500';
  return 'text-orange-500';
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  isAtRisk = false,
  freezeAvailable = 0,
  size = 'md',
  variant = 'default',
  className,
}: StreakDisplayProps) {
  const config = SIZE_CONFIG[size];
  const streakColor = getStreakColor(currentStreak, isAtRisk);
  const flameColor = getFlameColor(currentStreak, isAtRisk);
  const reducedMotion = useReducedMotion();
  
  // Animated flame component
  const AnimatedFlame = ({ iconSize }: { iconSize: number }) => {
    if (reducedMotion || currentStreak === 0) {
      return (
        <Flame
          className={cn(flameColor)}
          style={{ width: iconSize, height: iconSize }}
        />
      );
    }
    
    return (
      <div className="relative" style={{ width: iconSize, height: iconSize }}>
        {/* Glow effect */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full blur-md',
            currentStreak >= 30 ? 'bg-purple-500' :
            currentStreak >= 14 ? 'bg-blue-500' :
            currentStreak >= 7 ? 'bg-green-500' : 'bg-orange-500'
          )}
          variants={fireGlowVariants}
          initial="initial"
          animate="animate"
          style={{ opacity: 0.3 }}
        />
        {/* Animated fire */}
        <motion.div
          variants={fireVariants}
          initial="initial"
          animate="animate"
          className="relative z-10"
        >
          <Flame
            className={cn(flameColor)}
            style={{ width: iconSize, height: iconSize }}
          />
        </motion.div>
      </div>
    );
  };
  
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <AnimatedFlame iconSize={config.icon * 0.6} />
        <span className={cn('font-bold', streakColor, 'text-lg')}>
          {currentStreak}
        </span>
      </div>
    );
  }
  
  if (variant === 'detailed') {
    return (
      <div className={cn('flex flex-col items-center space-y-4', className)}>
        {/* Main streak display */}
        <div className="relative">
          <div className={cn(
            'absolute -inset-4 rounded-full opacity-20',
            currentStreak >= 7 && 'bg-gradient-to-t from-orange-500 to-transparent'
          )} />
          <AnimatedFlame iconSize={config.icon * 1.5} />
        </div>
        
        <div className="text-center">
          <motion.span 
            className={cn('font-bold block', streakColor, config.main)}
            initial={reducedMotion ? {} : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {currentStreak}
          </motion.span>
          <span className={cn('text-muted-foreground', config.label)}>
            day streak
          </span>
        </div>
        
        {/* At risk warning */}
        {isAtRisk && currentStreak > 0 && (
          <motion.div 
            className="flex items-center gap-2 text-amber-500 text-sm"
            initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Practice today to keep your streak!</span>
          </motion.div>
        )}
        
        {/* Additional stats */}
        <div className="flex items-center gap-6 text-sm">
          {longestStreak !== undefined && (
            <div className="text-center">
              <span className="block font-bold text-muted-foreground">
                {longestStreak}
              </span>
              <span className="text-xs text-muted-foreground">Longest</span>
            </div>
          )}
          
          {freezeAvailable > 0 && (
            <div className="flex items-center gap-1 text-blue-500">
              <Shield className="w-4 h-4" />
              <span>{freezeAvailable}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <AnimatedFlame iconSize={config.icon} />
      <motion.span 
        className={cn('font-bold', streakColor, config.main)}
        initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
      >
        {currentStreak}
      </motion.span>
      <span className={cn('text-muted-foreground', config.label)}>
        {currentStreak === 1 ? 'day' : 'days'}
      </span>
      
      {isAtRisk && currentStreak > 0 && (
        <span className="text-xs text-amber-500 mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          At risk
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Streak Calendar (Mini Heatmap)
// =============================================================================

interface StreakCalendarProps {
  dailyData: Array<{
    date: string;
    active: boolean;
    minutes: number;
  }>;
  className?: string;
}

export function StreakCalendar({ dailyData, className }: StreakCalendarProps) {
  // Get last 7 weeks of data
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 48); // ~7 weeks
  
  const getActivityLevel = (minutes: number): string => {
    if (minutes === 0) return 'bg-muted';
    if (minutes < 15) return 'bg-green-900';
    if (minutes < 30) return 'bg-green-700';
    if (minutes < 60) return 'bg-green-500';
    return 'bg-green-400';
  };
  
  // Create date map
  const dateMap = new Map<string, { active: boolean; minutes: number }>();
  dailyData.forEach(d => {
    dateMap.set(d.date, { active: d.active, minutes: d.minutes });
  });
  
  // Generate weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const current = new Date(startDate);
  
  // Align to start of week (Sunday)
  const dayOffset = current.getDay();
  current.setDate(current.getDate() - dayOffset);
  
  while (current <= today) {
    currentWeek.push(new Date(current));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex gap-1 justify-end">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => {
              const dateStr = day.toISOString().split('T')[0];
              const data = dateMap.get(dateStr);
              const isFuture = day > today;
              
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-colors',
                    isFuture ? 'bg-transparent' : getActivityLevel(data?.minutes || 0)
                  )}
                  title={`${dateStr}: ${data?.minutes || 0} minutes`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-muted" />
        <div className="w-3 h-3 rounded-sm bg-green-900" />
        <div className="w-3 h-3 rounded-sm bg-green-700" />
        <div className="w-3 h-3 rounded-sm bg-green-500" />
        <div className="w-3 h-3 rounded-sm bg-green-400" />
        <span>More</span>
      </div>
    </div>
  );
}

export default StreakDisplay;

