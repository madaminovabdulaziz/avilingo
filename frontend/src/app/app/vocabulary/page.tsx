'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VocabularySkeleton } from '@/components/ui/query-states';
import {
  getVocabularyCategoryStats,
  getVocabularyReviewQueue,
  type VocabularyCategoryStats,
} from '@/lib/api';
import {
  BookOpen,
  MessageSquare,
  Cloud,
  Navigation,
  AlertTriangle,
  Plane,
  Building2,
  ChevronRight,
  RefreshCw,
  Clock,
  Trophy,
  Zap,
} from 'lucide-react';

// =============================================================================
// Category Configuration
// =============================================================================

const CATEGORY_CONFIG: Record<string, {
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  standard_phraseology: {
    name: 'Standard Phraseology',
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  weather: {
    name: 'Weather',
    icon: Cloud,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  navigation: {
    name: 'Navigation',
    icon: Navigation,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  emergencies: {
    name: 'Emergencies',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  aircraft_systems: {
    name: 'Aircraft Systems',
    icon: Plane,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  airport_operations: {
    name: 'Airport Operations',
    icon: Building2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
};

// =============================================================================
// Vocabulary Page
// =============================================================================

export default function VocabularyPage() {
  const [categories, setCategories] = useState<VocabularyCategoryStats[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [categoryStats, reviewQueue] = await Promise.all([
        getVocabularyCategoryStats().catch(() => []),
        getVocabularyReviewQueue(1).catch(() => ({ total_due: 0, total_new: 0, items: [] })),
      ]);

      setCategories(categoryStats);
      setTotalDue(reviewQueue.total_due + reviewQueue.total_new);
    } catch (err) {
      console.error('Vocabulary fetch error:', err);
      setError('Failed to load vocabulary data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <VocabularySkeleton />;
  }

  // Calculate totals
  const totalTerms = categories.reduce((sum, c) => sum + c.total_terms, 0);
  const totalLearned = categories.reduce((sum, c) => sum + c.learned_terms, 0);
  const totalMastered = categories.reduce((sum, c) => sum + c.mastered_terms, 0);
  const overallMastery = totalTerms > 0 
    ? Math.round((totalMastered / totalTerms) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vocabulary</h1>
          <p className="text-sm text-muted-foreground">
            Master aviation terminology
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Review Due Section */}
      {totalDue > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {totalDue} {totalDue === 1 ? 'card' : 'cards'} ready for review
                </p>
                <p className="text-xs text-muted-foreground">
                  Keep your streak going with a quick review session
                </p>
              </div>
              <Link href="/app/vocabulary/review">
                <Button variant="aviation">
                  Review Now
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-5 h-5 mx-auto mb-1 text-sky-500" />
            <p className="text-xl font-bold">{totalLearned}</p>
            <p className="text-[10px] text-muted-foreground">Learned</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold">{totalMastered}</p>
            <p className="text-[10px] text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">{overallMastery}%</p>
            <p className="text-[10px] text-muted-foreground">Mastery</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">CATEGORIES</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CATEGORY_CONFIG).map(([categoryKey, config]) => {
            const stats = categories.find(c => c.category === categoryKey);
            const Icon = config.icon;
            const progress = stats && stats.total_terms > 0
              ? Math.round((stats.mastered_terms / stats.total_terms) * 100)
              : 0;
            
            return (
              <Link key={categoryKey} href={`/app/vocabulary/review?category=${categoryKey}`}>
                <Card variant="interactive" className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{config.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.total_terms || 0} terms
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Mastery</span>
                        <span className={progress >= 80 ? 'text-green-500' : 'text-muted-foreground'}>
                          {progress}%
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        variant={progress >= 80 ? 'success' : 'default'}
                        size="sm"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      {stats?.due_for_review ? (
                        <Badge variant="warning" size="sm">
                          {stats.due_for_review} due
                        </Badge>
                      ) : null}
                      {stats?.learned_terms ? (
                        <Badge variant="secondary" size="sm">
                          {stats.learned_terms} learned
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm">
                          Not started
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/vocabulary/review">
          <Button variant="outline" className="w-full h-auto py-4 flex-col gap-1">
            <BookOpen className="w-5 h-5" />
            <span>Review All</span>
          </Button>
        </Link>
        <Link href="/app/vocabulary/review?include_new=true">
          <Button variant="outline" className="w-full h-auto py-4 flex-col gap-1">
            <Zap className="w-5 h-5" />
            <span>Learn New</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

