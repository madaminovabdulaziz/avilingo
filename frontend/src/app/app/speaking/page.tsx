'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExerciseListSkeleton, ErrorState, EmptyState } from '@/components/ui/query-states';
import {
  getSpeakingScenarios,
  type SpeakingScenarioBrief,
} from '@/lib/api';
import {
  Mic,
  MessageSquare,
  Image as ImageIcon,
  Users,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Star,
} from 'lucide-react';

// =============================================================================
// Constants
// =============================================================================

const TYPE_TABS = [
  { value: 'all', label: 'All', icon: Mic },
  { value: 'phraseology', label: 'Phraseology', icon: MessageSquare },
  { value: 'picture_description', label: 'Picture', icon: ImageIcon },
  { value: 'conversation', label: 'Conversation', icon: Users },
] as const;

const TYPE_CONFIG: Record<string, { name: string; icon: React.ElementType; color: string }> = {
  phraseology: { name: 'Phraseology', icon: MessageSquare, color: 'text-blue-500' },
  picture_description: { name: 'Picture Description', icon: ImageIcon, color: 'text-purple-500' },
  conversation: { name: 'Conversation', icon: Users, color: 'text-green-500' },
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
// Scenario Card
// =============================================================================

interface ScenarioCardProps {
  scenario: SpeakingScenarioBrief;
}

function ScenarioCard({ scenario }: ScenarioCardProps) {
  const typeConfig = TYPE_CONFIG[scenario.scenario_type] || TYPE_CONFIG.phraseology;
  const TypeIcon = typeConfig.icon;
  
  return (
    <Link href={`/app/speaking/${scenario.id}`}>
      <Card variant="interactive" className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-sm line-clamp-2">{scenario.title}</h3>
                {scenario.completed && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className={DIFFICULTY_COLORS[scenario.difficulty]}>
                  {DIFFICULTY_LABELS[scenario.difficulty]}
                </span>
                <span>•</span>
                <span>ICAO {scenario.icao_level_target}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm">
                  {typeConfig.name}
                </Badge>
                <Badge variant="outline" size="sm">
                  {scenario.category.replace(/_/g, ' ')}
                </Badge>
                {scenario.best_score !== null && (
                  <Badge variant="success" size="sm" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {scenario.best_score.toFixed(1)}
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
// Speaking Page
// =============================================================================

export default function SpeakingPage() {
  const [scenarios, setScenarios] = useState<SpeakingScenarioBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getSpeakingScenarios({
        scenario_type: selectedType !== 'all' ? selectedType : undefined,
        limit: 50,
      });
      
      setScenarios(data.items);
    } catch (err) {
      console.error('Speaking fetch error:', err);
      setError('Failed to load scenarios');
    } finally {
      setIsLoading(false);
    }
  }, [selectedType]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  if (isLoading && scenarios.length === 0) {
    return <ExerciseListSkeleton count={5} />;
  }
  
  const completedCount = scenarios.filter(s => s.completed).length;
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Speaking</h1>
          <p className="text-sm text-muted-foreground">
            Practice aviation radiotelephony
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TYPE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.value}
              variant={selectedType === tab.value ? 'aviation' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(tab.value)}
              className="flex-shrink-0 gap-1.5"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>
      
      {/* Stats Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{scenarios.length} scenarios</span>
        {completedCount > 0 && (
          <span className="text-green-500">
            {completedCount} completed
          </span>
        )}
      </div>
      
      {/* Scenario List */}
      {error ? (
        <ErrorState
          error={new Error(error)}
          title="Failed to load scenarios"
          onRetry={fetchData}
        />
      ) : scenarios.length === 0 ? (
        <EmptyState
          type="noResults"
          icon={<Mic className="w-8 h-8 text-muted-foreground" />}
          title="No scenarios found"
          description="Try selecting a different type to see more scenarios."
          action={{
            label: 'View All',
            onClick: () => setSelectedType('all'),
            variant: 'outline',
          }}
        />
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  );
}

