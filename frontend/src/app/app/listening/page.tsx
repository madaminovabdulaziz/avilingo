'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExerciseListSkeleton, ErrorState, EmptyState } from '@/components/ui/query-states';
import {
  getListeningExercises,
  getListeningFilters,
  type ListeningExerciseBrief,
  type ListeningFilters,
} from '@/lib/api';
import {
  Headphones,
  Clock,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Filter,
  X,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// =============================================================================
// Constants
// =============================================================================

const SCENARIO_TABS = [
  { value: 'all', label: 'All' },
  { value: 'routine', label: 'Routine' },
  { value: 'non_routine', label: 'Non-Routine' },
  { value: 'emergency', label: 'Emergency' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  clearance_delivery: 'Clearance Delivery',
  ground: 'Ground Control',
  tower: 'Tower',
  approach: 'Approach',
  departure: 'Departure',
  en_route: 'En Route',
  emergency: 'Emergency',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'text-green-500',
  2: 'text-amber-500',
  3: 'text-red-500',
};

// =============================================================================
// Exercise Card
// =============================================================================

interface ExerciseCardProps {
  exercise: ListeningExerciseBrief;
}

function ExerciseCard({ exercise }: ExerciseCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'non_routine':
        return <Radio className="w-4 h-4 text-amber-500" />;
      default:
        return <Headphones className="w-4 h-4 text-blue-500" />;
    }
  };
  
  const getScenarioBadge = (type: string) => {
    switch (type) {
      case 'emergency':
        return <Badge variant="destructive" size="sm">Emergency</Badge>;
      case 'non_routine':
        return <Badge variant="warning" size="sm">Non-Routine</Badge>;
      default:
        return <Badge variant="secondary" size="sm">Routine</Badge>;
    }
  };
  
  return (
    <Link href={`/app/listening/${exercise.id}`}>
      <Card variant="interactive" className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              {getScenarioIcon(exercise.scenario_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{exercise.title}</h3>
                {exercise.completed && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(exercise.duration_seconds)}
                </span>
                <span>•</span>
                <span>{exercise.accent}</span>
                <span>•</span>
                <span className={DIFFICULTY_COLORS[exercise.difficulty]}>
                  {DIFFICULTY_LABELS[exercise.difficulty]}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {getScenarioBadge(exercise.scenario_type)}
                <Badge variant="outline" size="sm">
                  {CATEGORY_LABELS[exercise.category] || exercise.category}
                </Badge>
                {exercise.best_score !== null && (
                  <Badge variant="success" size="sm">
                    Best: {exercise.best_score}%
                  </Badge>
                )}
              </div>
            </div>
            
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// =============================================================================
// Listening Page
// =============================================================================

export default function ListeningPage() {
  const [exercises, setExercises] = useState<ListeningExerciseBrief[]>([]);
  const [filters, setFilters] = useState<ListeningFilters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [scenarioTab, setScenarioTab] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [accent, setAccent] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [exercisesData, filtersData] = await Promise.all([
        getListeningExercises({
          category: category !== 'all' ? category : undefined,
          difficulty: difficulty !== 'all' ? parseInt(difficulty) : undefined,
          accent: accent !== 'all' ? accent : undefined,
          limit: 50,
        }),
        getListeningFilters().catch(() => null),
      ]);
      
      // Filter by scenario type client-side (API doesn't have scenario_type param)
      let filtered = exercisesData.items;
      if (scenarioTab !== 'all') {
        filtered = filtered.filter(e => e.scenario_type === scenarioTab);
      }
      
      setExercises(filtered);
      if (filtersData) setFilters(filtersData);
    } catch (err) {
      console.error('Listening fetch error:', err);
      setError('Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  }, [scenarioTab, difficulty, accent, category]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const clearFilters = () => {
    setDifficulty('all');
    setAccent('all');
    setCategory('all');
  };
  
  const hasActiveFilters = difficulty !== 'all' || accent !== 'all' || category !== 'all';
  
  if (isLoading && exercises.length === 0) {
    return <ExerciseListSkeleton count={5} />;
  }
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listening</h1>
          <p className="text-sm text-muted-foreground">
            Practice ATC communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Scenario Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {SCENARIO_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={scenarioTab === tab.value ? 'aviation' : 'outline'}
            size="sm"
            onClick={() => setScenarioTab(tab.value)}
            className="flex-shrink-0"
          >
            {tab.label}
          </Button>
        ))}
      </div>
      
      {/* Filter Dropdowns */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Difficulty */}
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {filters?.difficulties.map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    {DIFFICULTY_LABELS[d]}
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem value="1">Easy</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Hard</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            
            {/* Accent */}
            <Select value={accent} onValueChange={setAccent}>
              <SelectTrigger>
                <SelectValue placeholder="Accent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accents</SelectItem>
                {filters?.accents.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem value="American">American</SelectItem>
                    <SelectItem value="British">British</SelectItem>
                    <SelectItem value="Indian">Indian</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            
            {/* Category */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filters?.categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c] || c}
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem value="clearance_delivery">Clearance Delivery</SelectItem>
                    <SelectItem value="ground">Ground Control</SelectItem>
                    <SelectItem value="tower">Tower</SelectItem>
                    <SelectItem value="approach">Approach</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}
      
      {/* Stats Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{exercises.length} exercises</span>
        {exercises.filter(e => e.completed).length > 0 && (
          <span className="text-green-500">
            {exercises.filter(e => e.completed).length} completed
          </span>
        )}
      </div>
      
      {/* Exercise List */}
      {error ? (
        <ErrorState
          error={new Error(error)}
          title="Failed to load exercises"
          onRetry={fetchData}
        />
      ) : exercises.length === 0 ? (
        <EmptyState
          type="noResults"
          icon={<Headphones className="w-8 h-8 text-muted-foreground" />}
          title="No exercises found"
          description="Try adjusting your filters to see more exercises."
          action={{
            label: 'Clear Filters',
            onClick: clearFilters,
            variant: 'outline',
          }}
        />
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  );
}

