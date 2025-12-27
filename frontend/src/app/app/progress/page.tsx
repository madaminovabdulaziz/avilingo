'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProgressSkeleton, ErrorState } from '@/components/ui/query-states';
import { ICAOGauge, ICAOCriteriaBar } from '@/components/progress/ICAOGauge';
import { StreakDisplay, StreakCalendar } from '@/components/progress/StreakDisplay';
import { AchievementCard, AchievementsGrid } from '@/components/progress/AchievementCard';
import {
  getProgressStats,
  getDailyProgress,
  getAchievements,
  getActivityTimeline,
  type ProgressStats,
  type DailyProgressResponse,
  type AchievementListResponse,
  type ActivityTimeline,
} from '@/lib/api';
import {
  Clock,
  Book,
  Headphones,
  Mic,
  Trophy,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Zap,
  Target,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

type DateRange = '7d' | '30d' | '90d' | 'all';

interface DateRangeOption {
  value: DateRange;
  label: string;
  days: number | null;
}

const DATE_RANGES: DateRangeOption[] = [
  { value: '7d', label: '7 Days', days: 7 },
  { value: '30d', label: '30 Days', days: 30 },
  { value: '90d', label: '90 Days', days: 90 },
  { value: 'all', label: 'All Time', days: null },
];

// =============================================================================
// Stat Card
// =============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sublabel?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

function StatCard({ label, value, icon: Icon, sublabel, trend, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs mt-1',
                trend.positive ? 'text-green-500' : 'text-red-500'
              )}>
                {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Category Progress Card
// =============================================================================

interface CategoryProgressProps {
  category: string;
  displayName: string;
  icon: string;
  completed: number;
  total: number;
  mastery: number;
  dueForReview?: number;
}

function CategoryProgressCard({
  category,
  displayName,
  icon,
  completed,
  total,
  mastery,
  dueForReview,
}: CategoryProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
        <Progress value={percentage} size="sm" className="h-1.5" />
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          <span>{mastery.toFixed(0)}% mastery</span>
          {dueForReview !== undefined && dueForReview > 0 && (
            <span className="text-amber-500">{dueForReview} due</span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Activity Item
// =============================================================================

interface ActivityItemProps {
  type: string;
  action: string;
  title: string;
  score?: number | null;
  xp: number;
  timestamp: string;
}

function ActivityItem({ type, action, title, score, xp, timestamp }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'vocabulary': return Book;
      case 'listening': return Headphones;
      case 'speaking': return Mic;
      default: return Book;
    }
  };
  
  const getColor = () => {
    switch (type) {
      case 'vocabulary': return 'text-green-500 bg-green-500/10';
      case 'listening': return 'text-blue-500 bg-blue-500/10';
      case 'speaking': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-primary bg-primary/10';
    }
  };
  
  const Icon = getIcon();
  const color = getColor();
  
  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground capitalize">{action}</p>
      </div>
      <div className="text-right">
        {score !== null && score !== undefined && (
          <p className="text-sm font-medium">{typeof score === 'number' ? `${score.toFixed(0)}%` : score}</p>
        )}
        <p className="text-xs text-muted-foreground">{formatTime(timestamp)}</p>
      </div>
      {xp > 0 && (
        <Badge variant="secondary" size="sm" className="flex-shrink-0">
          +{xp} XP
        </Badge>
      )}
    </div>
  );
}

// =============================================================================
// Progress Page
// =============================================================================

export default function ProgressPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgressResponse | null>(null);
  const [achievements, setAchievements] = useState<AchievementListResponse | null>(null);
  const [activities, setActivities] = useState<ActivityTimeline | null>(null);
  
  const dateParams = useMemo(() => {
    const range = DATE_RANGES.find(r => r.value === dateRange);
    if (!range || !range.days) return {};
    
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - range.days);
    
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  }, [dateRange]);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [statsData, dailyData, achievementsData, activityData] = await Promise.all([
        getProgressStats().catch(() => null),
        getDailyProgress(dateParams).catch(() => null),
        getAchievements().catch(() => null),
        getActivityTimeline().catch(() => null),
      ]);
      
      setStats(statsData);
      setDailyProgress(dailyData);
      setAchievements(achievementsData);
      setActivities(activityData);
    } catch (err) {
      console.error('Progress fetch error:', err);
      setError('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  }, [dateParams]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  if (isLoading) {
    return <ProgressSkeleton />;
  }
  
  // Generate mock data for streak calendar if we have daily progress
  const calendarData = dailyProgress?.items.map(item => ({
    date: item.date,
    active: item.goal_met,
    minutes: item.practice_minutes,
  })) || [];
  
  // Get ICAO criteria from speaking stats
  const icaoCriteria = stats?.speaking?.icao_criteria || {
    pronunciation: 0,
    structure: 0,
    vocabulary: 0,
    fluency: 0,
    comprehension: 0,
    interaction: 0,
  };
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="text-sm text-muted-foreground">
            Track your learning journey
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Date Range Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DATE_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={dateRange === range.value ? 'aviation' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range.value)}
            className="flex-shrink-0"
          >
            {range.label}
          </Button>
        ))}
      </div>
      
      {error && (
        <ErrorState
          error={new Error(error)}
          title="Failed to load progress"
          onRetry={fetchData}
          compact
        />
      )}
      
      {/* Section 1: Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Overview
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak - Large Display */}
          <Card className="col-span-2 lg:col-span-1 row-span-2">
            <CardContent className="h-full flex items-center justify-center p-6">
              <StreakDisplay
                currentStreak={dailyProgress?.current_streak || stats?.streak?.current_streak || 0}
                longestStreak={dailyProgress?.longest_streak || stats?.streak?.longest_streak || 0}
                isAtRisk={dailyProgress?.is_at_risk || stats?.streak?.is_at_risk || false}
                variant="detailed"
                size="lg"
              />
            </CardContent>
          </Card>
          
          <StatCard
            label="Longest Streak"
            value={dailyProgress?.longest_streak || stats?.streak?.longest_streak || 0}
            icon={Trophy}
            sublabel="days"
          />
          
          <StatCard
            label="Practice Time"
            value={stats?.total_practice_minutes 
              ? `${Math.floor(stats.total_practice_minutes / 60)}h ${stats.total_practice_minutes % 60}m`
              : '0h 0m'
            }
            icon={Clock}
            sublabel="total"
          />
          
          <StatCard
            label="Words Mastered"
            value={stats?.vocabulary?.mastered_terms || 0}
            icon={Book}
            sublabel={`of ${stats?.vocabulary?.total_terms || 0}`}
          />
          
          <StatCard
            label="Total XP"
            value={stats?.total_xp?.toLocaleString() || 0}
            icon={Zap}
            sublabel="earned"
          />
        </div>
      </section>
      
      {/* Section 2: ICAO Readiness */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          ICAO Readiness
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Overall ICAO Gauge */}
          <Card className="lg:row-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Predicted Level</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4">
              <ICAOGauge
                score={stats?.predicted_icao_level || 3}
                size="xl"
                showLabel
                showLevel
              />
              {stats?.level_description && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {stats.level_description}
                </p>
              )}
              {stats?.level_progress_percent !== undefined && (
                <div className="w-full mt-4 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress to next level</span>
                    <span>{stats.level_progress_percent.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.level_progress_percent} size="sm" />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* ICAO Criteria Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ICAO Criteria Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ICAOCriteriaBar label="Pronunciation" score={icaoCriteria.pronunciation || 0} />
              <ICAOCriteriaBar label="Structure" score={icaoCriteria.structure || 0} />
              <ICAOCriteriaBar label="Vocabulary" score={icaoCriteria.vocabulary || 0} />
              <ICAOCriteriaBar label="Fluency" score={icaoCriteria.fluency || 0} />
              <ICAOCriteriaBar label="Comprehension" score={icaoCriteria.comprehension || 0} />
              <ICAOCriteriaBar label="Interaction" score={icaoCriteria.interaction || 0} />
            </CardContent>
          </Card>
          
          {/* Strongest/Weakest Areas */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Strongest</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="font-medium capitalize">
                      {stats?.speaking?.strongest_criterion || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Needs Work</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="font-medium capitalize">
                      {stats?.speaking?.weakest_criterion || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Section 3: Activity Heatmap */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Activity
        </h2>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Practice Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <StreakCalendar dailyData={calendarData} />
            
            <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t pt-4">
              <div>
                <p className="text-2xl font-bold">{dailyProgress?.active_days || 0}</p>
                <p className="text-xs text-muted-foreground">Active Days</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {dailyProgress?.items.reduce((sum, d) => sum + d.practice_minutes, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {dailyProgress?.items.reduce((sum, d) => sum + d.xp_earned, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Section 4: Category Progress */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Book className="w-5 h-5 text-primary" />
          Category Progress
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Vocabulary Categories */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Book className="w-4 h-4 text-green-500" />
                Vocabulary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.vocabulary?.by_category?.length ? (
                stats.vocabulary.by_category.map((cat) => (
                  <CategoryProgressCard
                    key={cat.category}
                    category={cat.category}
                    displayName={cat.display_name}
                    icon={cat.icon}
                    completed={cat.completed_items}
                    total={cat.total_items}
                    mastery={cat.mastery_percent}
                    dueForReview={cat.due_for_review}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No vocabulary data yet
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Listening Categories */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Headphones className="w-4 h-4 text-blue-500" />
                Listening
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.listening?.by_category?.length ? (
                stats.listening.by_category.map((cat) => (
                  <CategoryProgressCard
                    key={cat.category}
                    category={cat.category}
                    displayName={cat.display_name}
                    icon={cat.icon}
                    completed={cat.completed_items}
                    total={cat.total_items}
                    mastery={cat.mastery_percent}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No listening data yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Section 5: Achievements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Achievements
          </h2>
          {achievements && (
            <Badge variant="secondary">
              {achievements.total_earned} earned
            </Badge>
          )}
        </div>
        
        {achievements ? (
          <div className="space-y-4">
            {/* Earned Achievements */}
            {achievements.earned.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Earned</p>
                <AchievementsGrid
                  achievements={achievements.earned.slice(0, 4)}
                  columns={2}
                />
              </div>
            )}
            
            {/* In Progress */}
            {achievements.in_progress.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <AchievementsGrid
                  achievements={achievements.in_progress.slice(0, 4)}
                  columns={2}
                />
              </div>
            )}
            
            {/* Locked (show a few) */}
            {achievements.locked.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Locked</p>
                <AchievementsGrid
                  achievements={achievements.locked.slice(0, 2)}
                  variant="compact"
                  columns={2}
                />
              </div>
            )}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Start practicing to earn achievements!</p>
          </Card>
        )}
      </section>
      
      {/* Section 6: Activity Timeline */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Activity
        </h2>
        
        <Card>
          <CardContent className="p-4">
            {activities?.items?.length ? (
              <div className="divide-y">
                {activities.items.slice(0, 10).map((activity, i) => (
                  <ActivityItem
                    key={i}
                    type={activity.type}
                    action={activity.action}
                    title={activity.title}
                    score={activity.score}
                    xp={activity.xp_earned}
                    timestamp={activity.timestamp}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

