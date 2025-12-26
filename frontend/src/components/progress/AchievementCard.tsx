'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { useReducedMotion, transitions } from '@/lib/motion';
import { 
  Lock, 
  Check, 
  Book,
  Headphones,
  Mic,
  Flame,
  Trophy,
  Target,
  Star,
  Zap,
  Award,
  Calendar,
  Clock,
  Compass,
  Shield,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import type { Achievement } from '@/lib/api';

// =============================================================================
// Icon Mapping
// =============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  book: Book,
  headphones: Headphones,
  microphone: Mic,
  mic: Mic,
  flame: Flame,
  fire: Flame,
  trophy: Trophy,
  target: Target,
  star: Star,
  zap: Zap,
  lightning: Zap,
  award: Award,
  medal: Award,
  calendar: Calendar,
  clock: Clock,
  compass: Compass,
  shield: Shield,
  crown: Crown,
};

// Check if string is an emoji
function isEmoji(str: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(str);
}

// Get icon component or emoji
function renderIcon(iconName: string, className?: string) {
  // If it's an emoji, render as text
  if (isEmoji(iconName)) {
    return <span className={className}>{iconName}</span>;
  }
  
  // Look up icon in map
  const IconComponent = ICON_MAP[iconName.toLowerCase()];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  
  // Fallback to text
  return <span className={className}>{iconName}</span>;
}

// =============================================================================
// Achievement Card Component
// =============================================================================

interface AchievementCardProps {
  achievement: Achievement;
  variant?: 'default' | 'compact' | 'large';
  className?: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AchievementCard({
  achievement,
  variant = 'default',
  className,
}: AchievementCardProps) {
  const isUnlocked = achievement.is_unlocked;
  const isInProgress = !isUnlocked && achievement.progress > 0;
  const reducedMotion = useReducedMotion();
  
  if (variant === 'compact') {
    return (
      <motion.div 
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg transition-colors',
          isUnlocked ? 'bg-primary/10' : 'bg-muted/50',
          className
        )}
        whileHover={reducedMotion ? {} : { scale: 1.02, transition: transitions.fast }}
        whileTap={reducedMotion ? {} : { scale: 0.98 }}
      >
        <motion.div 
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isUnlocked ? 'bg-primary/20' : 'bg-muted grayscale'
          )}
          animate={isUnlocked && !reducedMotion ? { 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0] 
          } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {renderIcon(achievement.icon, 'w-5 h-5')}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-sm truncate',
            !isUnlocked && 'text-muted-foreground'
          )}>
            {achievement.title}
          </p>
          {isUnlocked ? (
            <p className="text-xs text-muted-foreground">
              {formatDate(achievement.unlocked_at)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {achievement.progress}/{achievement.requirement_value}
            </p>
          )}
        </div>
        {isUnlocked && (
          <motion.div
            initial={reducedMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.3 }}
          >
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
          </motion.div>
        )}
      </motion.div>
    );
  }
  
  if (variant === 'large') {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-xl p-6 text-center',
        isUnlocked 
          ? 'bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/30' 
          : 'bg-muted/30 border border-border',
        className
      )}>
        {!isUnlocked && (
          <div className="absolute top-3 right-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        
        {isUnlocked && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-primary">
            <Check className="w-4 h-4" />
            <span>Earned</span>
          </div>
        )}
        
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
          isUnlocked ? 'bg-primary/20' : 'bg-muted grayscale opacity-50'
        )}>
          {renderIcon(achievement.icon, 'w-8 h-8')}
        </div>
        
        <h3 className={cn(
          'font-bold text-lg mb-1',
          !isUnlocked && 'text-muted-foreground'
        )}>
          {achievement.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          {achievement.description}
        </p>
        
        {!isUnlocked && (
          <div className="space-y-2">
            <Progress value={achievement.progress_percent} size="sm" />
            <p className="text-xs text-muted-foreground">
              {achievement.progress} / {achievement.requirement_value}
            </p>
          </div>
        )}
        
        {isUnlocked && achievement.unlocked_at && (
          <p className="text-xs text-muted-foreground">
            Unlocked {formatDate(achievement.unlocked_at)}
          </p>
        )}
        
        <div className={cn(
          'mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
          isUnlocked 
            ? 'bg-primary/20 text-primary' 
            : 'bg-muted text-muted-foreground'
        )}>
          +{achievement.xp_reward} XP
        </div>
      </div>
    );
  }
  
  // Default variant
  return (
    <motion.div 
      className={cn(
        'relative rounded-xl p-4',
        isUnlocked 
          ? 'bg-primary/10 border border-primary/20' 
          : isInProgress 
            ? 'bg-muted/50 border border-border'
            : 'bg-muted/30 border border-transparent opacity-60',
        className
      )}
      whileHover={reducedMotion ? {} : { scale: 1.02, y: -2, transition: transitions.gentle }}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <motion.div 
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
            isUnlocked 
              ? 'bg-primary/20' 
              : 'bg-muted grayscale'
          )}
          animate={isUnlocked && !reducedMotion ? { 
            scale: [1, 1.15, 1],
          } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {renderIcon(achievement.icon, 'w-6 h-6')}
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              'font-semibold truncate',
              !isUnlocked && 'text-muted-foreground'
            )}>
              {achievement.title}
            </h4>
            {isUnlocked && (
              <motion.div
                initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.2 }}
              >
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              </motion.div>
            )}
            {!isUnlocked && !isInProgress && (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {achievement.description}
          </p>
          
          {isUnlocked ? (
            <motion.div 
              className="flex items-center gap-3 text-xs"
              initial={reducedMotion ? {} : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-primary font-medium">
                +{achievement.xp_reward} XP
              </span>
              {achievement.unlocked_at && (
                <span className="text-muted-foreground">
                  {formatDate(achievement.unlocked_at)}
                </span>
              )}
            </motion.div>
          ) : (
            <div className="space-y-1">
              <Progress 
                value={achievement.progress_percent} 
                size="sm" 
                className="h-1.5"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{achievement.progress} / {achievement.requirement_value}</span>
                <span>{Math.round(achievement.progress_percent)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Achievements Grid
// =============================================================================

interface AchievementsGridProps {
  achievements: Achievement[];
  variant?: 'default' | 'compact' | 'large';
  columns?: 1 | 2 | 3;
  className?: string;
}

export function AchievementsGrid({
  achievements,
  variant = 'default',
  columns = 2,
  className,
}: AchievementsGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };
  const reducedMotion = useReducedMotion();
  
  return (
    <motion.div 
      className={cn('grid gap-3', gridCols[columns], className)}
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? {} : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 }
        }
      }}
    >
      {achievements.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          variants={reducedMotion ? {} : {
            hidden: { opacity: 0, y: 12 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.25 }
            }
          }}
        >
          <AchievementCard
            achievement={achievement}
            variant={variant}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default AchievementCard;

