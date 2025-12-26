'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, IcaoLevelBadge } from '@/components/ui/badge';
import { CircularProgress, Progress } from '@/components/ui/progress';
import { DashboardSkeleton, ErrorState } from '@/components/ui/query-states';
import {
  getProgressStats,
  getReviewQueue,
  getActivityTimeline,
  getTodayProgress,
  type ProgressStats,
  type ReviewQueue,
  type ActivityTimeline,
  type TodayProgress,
} from '@/lib/api';
import { 
  BookOpen, 
  Headphones, 
  Mic, 
  Clock, 
  Flame, 
  Target,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Zap,
  Trophy,
  RefreshCw,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface DashboardData {
  stats: ProgressStats | null;
  reviewQueue: ReviewQueue | null;
  activity: ActivityTimeline | null;
  todayProgress: TodayProgress | null;
}

// =============================================================================
// Dashboard Page
// =============================================================================

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    stats: null,
    reviewQueue: null,
    activity: null,
    todayProgress: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [stats, reviewQueue, activity, todayProgress] = await Promise.all([
        getProgressStats().catch(() => null),
        getReviewQueue(10).catch(() => null),
        getActivityTimeline(5).catch(() => null),
        getTodayProgress().catch(() => null),
      ]);
      
      setData({ stats, reviewQueue, activity, todayProgress });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  const firstName = user?.full_name?.split(' ')[0] || 'Pilot';
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ErrorState
          error={new Error(error)}
          title="Unable to load dashboard"
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }
  
  const { stats, reviewQueue, activity, todayProgress } = data;
  
  // Calculate values with fallbacks
  const predictedLevel = stats?.predicted_icao_level || 1;
  const levelDescription = stats?.level_description || 'Pre-Elementary';
  const currentStreak = stats?.streak?.current_streak || todayProgress?.streak?.current_streak || 0;
  const wordsLearned = stats?.vocabulary?.learned_terms || 0;
  const listeningScore = stats?.listening?.average_score || 0;
  const dueForReview = reviewQueue?.total_due || stats?.vocabulary?.due_for_review || 0;
  const testDate = stats?.test_date;
  const daysUntilTest = stats?.days_until_test;
  const onTrack = stats?.on_track_for_goal ?? true;
  const todayMinutes = todayProgress?.today?.practice_minutes || 0;
  const goalMinutes = todayProgress?.goal_minutes || 15;
  const goalProgress = todayProgress?.goal_progress_percent || 0;
  const weeklyMinutesChange = stats?.practice_this_week_minutes || 0;
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* ===================================================================== */}
      {/* Greeting Section */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-2xl font-bold">{firstName} 👋</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchDashboardData} title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      
      {/* ===================================================================== */}
      {/* ICAO Level Card */}
      {/* ===================================================================== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <CircularProgress 
              value={predictedLevel} 
              max={6} 
              size="lg" 
              variant="primary"
              label="ICAO"
            />
            <div className="flex-1">
              <p className="font-semibold">Predicted Level {Math.floor(predictedLevel)}</p>
              <p className="text-sm text-muted-foreground">{levelDescription}</p>
              {stats?.level_progress_percent !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>Progress to Level {Math.floor(predictedLevel) + 1}</span>
                    <span className="ml-auto">{Math.round(stats.level_progress_percent)}%</span>
                  </div>
                  <Progress value={stats.level_progress_percent} size="sm" />
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <IcaoLevelBadge level={user?.target_icao_level || 4} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ===================================================================== */}
      {/* Test Countdown (if test date is set) */}
      {/* ===================================================================== */}
      {testDate && daysUntilTest !== null && (
        <Card className={onTrack ? 'border-green-500/30' : 'border-amber-500/30'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`text-center px-4 py-2 rounded-xl ${
                onTrack ? 'bg-green-500/20' : 'bg-amber-500/20'
              }`}>
                <span className={`text-2xl font-bold font-mono ${
                  onTrack ? 'text-green-500' : 'text-amber-500'
                }`}>
                  {daysUntilTest}
                </span>
                <p className="text-[10px] text-muted-foreground">DAYS</p>
              </div>
              <div className="flex-1">
                <p className="font-medium">Until ICAO Test</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(testDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {stats?.level_description && ` • Target: Level ${user?.target_icao_level}`}
                </p>
              </div>
              <Badge variant={onTrack ? 'success' : 'warning'} className="text-xs">
                {onTrack ? 'On track ✓' : 'Needs attention'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* ===================================================================== */}
      {/* Quick Stats Row */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Streak */}
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Flame className={`w-5 h-5 mx-auto mb-1 ${
              currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
            }`} />
            <p className="text-xl font-bold">{currentStreak}d</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </CardContent>
        </Card>
        
        {/* Words Learned */}
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-5 h-5 mx-auto mb-1 text-sky-500" />
            <p className="text-xl font-bold">{wordsLearned}</p>
            <p className="text-[10px] text-muted-foreground">Words Learned</p>
          </CardContent>
        </Card>
        
        {/* Listening Score */}
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Headphones className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
            <p className="text-xl font-bold">{Math.round(listeningScore)}%</p>
            <p className="text-[10px] text-muted-foreground">Listening Avg</p>
          </CardContent>
        </Card>
        
        {/* Predicted Level */}
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xl font-bold">{predictedLevel.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">ICAO Level</p>
          </CardContent>
        </Card>
      </div>
      
      {/* ===================================================================== */}
      {/* Continue Learning Card */}
      {/* ===================================================================== */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">
                {dueForReview > 0 
                  ? `${dueForReview} cards due for review` 
                  : 'Start your daily practice'}
              </p>
              <p className="text-xs text-muted-foreground">
                {todayMinutes > 0 
                  ? `${todayMinutes}/${goalMinutes} min today (${Math.round(goalProgress)}%)`
                  : 'No practice yet today'}
              </p>
            </div>
            <Link href={dueForReview > 0 ? '/app/vocabulary/review' : '/app/vocabulary'}>
              <Button variant="aviation">
                {dueForReview > 0 ? 'Review Now' : 'Start Session'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* ===================================================================== */}
      {/* Module Cards */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">LEARNING MODULES</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vocabulary Module */}
          <Link href="/app/vocabulary">
            <Card variant="interactive" className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Vocabulary</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stats?.vocabulary?.mastered_terms || 0} mastered
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Mastery</span>
                        <span>{Math.round(stats?.vocabulary?.mastery_percent || 0)}%</span>
                      </div>
                      <Progress 
                        value={stats?.vocabulary?.mastery_percent || 0} 
                        variant="icao-5"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
                {dueForReview > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="warning" size="sm">
                      {dueForReview} due
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
          
          {/* Listening Module */}
          <Link href="/app/listening">
            <Card variant="interactive" className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Listening</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stats?.listening?.completed_exercises || 0} completed
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.round(stats?.listening?.completion_percent || 0)}%</span>
                      </div>
                      <Progress 
                        value={stats?.listening?.completion_percent || 0} 
                        variant="success"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
                {(stats?.listening?.average_score || 0) > 0 && (
                  <div className="mt-3">
                    <Badge variant="icao-4" size="sm">
                      Avg: {Math.round(stats?.listening?.average_score || 0)}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
          
          {/* Speaking Module */}
          <Link href="/app/speaking">
            <Card variant="interactive" className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Speaking</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stats?.speaking?.completed_scenarios || 0} scenarios
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.round(stats?.speaking?.completion_percent || 0)}%</span>
                      </div>
                      <Progress 
                        value={stats?.speaking?.completion_percent || 0} 
                        variant="icao-4"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
                {stats?.speaking?.weakest_criterion && (
                  <div className="mt-3">
                    <Badge variant="secondary" size="sm">
                      Focus: {stats.speaking.weakest_criterion}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      
      {/* ===================================================================== */}
      {/* Weekly Progress */}
      {/* ===================================================================== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">This Week</CardTitle>
            <div className="flex items-center gap-1 text-xs">
              {weeklyMinutesChange > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">+{weeklyMinutesChange} min</span>
                </>
              ) : weeklyMinutesChange < 0 ? (
                <>
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span className="text-red-500">{weeklyMinutesChange} min</span>
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Weekly activity indicators */}
          <div className="flex justify-between">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const today = new Date().getDay();
              const dayIndex = (i + 1) % 7; // Convert Mon=0 to Sun=6
              const isPast = dayIndex < today || (dayIndex === today);
              const isActive = isPast && Math.random() > 0.3; // TODO: Use real data
              
              return (
                <div key={i} className="text-center">
                  <div 
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-xs transition-colors ${
                      isActive 
                        ? 'bg-green-500 text-white' 
                        : dayIndex === today
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isActive && '✓'}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
          
          {/* Streak indicator */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">
              {currentStreak > 0 ? `${currentStreak} day streak` : 'Start your streak!'}
            </span>
            {todayProgress?.streak?.is_at_risk && (
              <Badge variant="warning" size="sm">At risk!</Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* ===================================================================== */}
      {/* Recent Activity */}
      {/* ===================================================================== */}
      {activity && activity.items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Link href="/app/progress">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.items.slice(0, 5).map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.type === 'vocabulary' ? 'bg-sky-500/10' :
                  item.type === 'listening' ? 'bg-cyan-500/10' : 'bg-green-500/10'
                }`}>
                  {item.type === 'vocabulary' ? (
                    <BookOpen className="w-4 h-4 text-sky-500" />
                  ) : item.type === 'listening' ? (
                    <Headphones className="w-4 h-4 text-cyan-500" />
                  ) : (
                    <Mic className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.action} • {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>
                {item.score !== null && (
                  <Badge 
                    variant={item.score >= 80 ? 'icao-4' : item.score >= 60 ? 'icao-3' : 'icao-1'} 
                    size="sm"
                  >
                    {Math.round(item.score)}%
                  </Badge>
                )}
                {item.xp_earned > 0 && (
                  <span className="text-xs text-primary font-medium">+{item.xp_earned} XP</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* ===================================================================== */}
      {/* Target Level Reminder */}
      {/* ===================================================================== */}
      <Card className="bg-gradient-to-r from-sky-600/10 via-cyan-600/10 to-purple-600/10 border-sky-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Your target</p>
              <IcaoLevelBadge level={user?.target_icao_level || 4} />
            </div>
            <Link href="/app/progress">
              <Button variant="outline" size="sm">
                View Progress
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
