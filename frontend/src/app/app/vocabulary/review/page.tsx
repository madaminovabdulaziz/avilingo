'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  getVocabularyReviewQueue,
  submitVocabularyReview,
  type VocabularyReviewQueueItem,
  type VocabularyReviewResponse,
} from '@/lib/api';
import {
  Volume2,
  RotateCcw,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Trophy,
  Zap,
  AlertCircle,
  X,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface SessionStats {
  total: number;
  reviewed: number;
  correct: number;
  xpEarned: number;
}

// =============================================================================
// Flashcard Component
// =============================================================================

interface FlashcardProps {
  item: VocabularyReviewQueueItem;
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (quality: number) => void;
  isSubmitting: boolean;
}

function Flashcard({ item, isFlipped, onFlip, onRate, isSubmitting }: FlashcardProps) {
  const { term } = item;
  
  const playAudio = () => {
    if (term.audio_url) {
      const audio = new Audio(term.audio_url);
      audio.play().catch(console.error);
    }
  };
  
  return (
    <div className="perspective-1000 w-full max-w-lg mx-auto">
      <div
        className={`relative w-full transition-transform duration-500 transform-style-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={!isFlipped ? onFlip : undefined}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Card Front */}
        <Card 
          className={`w-full min-h-[300px] ${isFlipped ? 'invisible' : ''}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Badge variant="secondary" className="mb-4">
              {term.category.replace(/_/g, ' ')}
            </Badge>
            
            <h2 className="text-3xl font-bold text-center mb-4">{term.term}</h2>
            
            {term.phonetic && (
              <p className="font-mono text-lg text-muted-foreground mb-4">
                [{term.phonetic}]
              </p>
            )}
            
            {term.audio_url && (
              <Button
                variant="outline"
                size="icon"
                className="mb-6"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            )}
            
            <p className="text-sm text-muted-foreground">
              Tap to reveal definition
            </p>
            
            {item.is_new && (
              <Badge variant="icao-5" className="mt-4">
                New word
              </Badge>
            )}
          </CardContent>
        </Card>
        
        {/* Card Back */}
        <Card 
          className={`w-full min-h-[300px] absolute top-0 left-0 ${!isFlipped ? 'invisible' : ''}`}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <CardContent className="p-6 space-y-4">
            {/* Term and Phonetic */}
            <div className="text-center border-b border-border pb-4">
              <h3 className="text-xl font-bold">{term.term}</h3>
              {term.phonetic && (
                <p className="font-mono text-muted-foreground">[{term.phonetic}]</p>
              )}
            </div>
            
            {/* Definition */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Definition</p>
              <p className="text-foreground">{term.definition}</p>
            </div>
            
            {/* Aviation Context */}
            {term.aviation_context && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Aviation Context</p>
                <p className="text-sm">{term.aviation_context}</p>
              </div>
            )}
            
            {/* Example */}
            {term.example_atc && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">Example (ATC)</p>
                <p className="font-mono text-sm text-primary">{term.example_atc}</p>
                {term.example_response && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground mt-2 mb-1">Response</p>
                    <p className="font-mono text-sm text-green-500">{term.example_response}</p>
                  </>
                )}
              </div>
            )}
            
            {/* Common Errors */}
            {term.common_errors && term.common_errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-destructive mb-1">⚠️ Common Errors</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {term.common_errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* CIS Pronunciation Tips */}
            {term.cis_pronunciation_tips && (
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <p className="text-sm font-medium text-blue-400 mb-1">💡 Pronunciation Tip</p>
                <p className="text-sm">{term.cis_pronunciation_tips}</p>
              </div>
            )}
            
            {/* Rating Buttons */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-center text-muted-foreground mb-3">
                How well did you know this?
              </p>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  className="flex-col h-auto py-2 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => onRate(0)}
                  disabled={isSubmitting}
                >
                  <span className="text-lg">😵</span>
                  <span className="text-xs">Again</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-2 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
                  onClick={() => onRate(2)}
                  disabled={isSubmitting}
                >
                  <span className="text-lg">😓</span>
                  <span className="text-xs">Hard</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-2 border-green-500/30 hover:bg-green-500/10 hover:text-green-400"
                  onClick={() => onRate(4)}
                  disabled={isSubmitting}
                >
                  <span className="text-lg">😊</span>
                  <span className="text-xs">Good</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-2 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                  onClick={() => onRate(5)}
                  disabled={isSubmitting}
                >
                  <span className="text-lg">🤩</span>
                  <span className="text-xs">Easy</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================================================
// Session Summary
// =============================================================================

interface SessionSummaryProps {
  stats: SessionStats;
  onRestart: () => void;
}

function SessionSummary({ stats, onRestart }: SessionSummaryProps) {
  const accuracy = stats.reviewed > 0 
    ? Math.round((stats.correct / stats.reviewed) * 100)
    : 0;
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-green-500" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
            <p className="text-muted-foreground">
              Great work on your vocabulary practice
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.reviewed}</p>
              <p className="text-xs text-muted-foreground">Cards Reviewed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">+{stats.xpEarned}</p>
              <p className="text-xs text-muted-foreground">XP Earned</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={accuracy} 
              variant={accuracy >= 80 ? 'success' : accuracy >= 60 ? 'warning' : 'destructive'}
            />
            <p className="text-xs text-muted-foreground">
              {accuracy >= 80 
                ? '🎉 Excellent! Keep up the great work!'
                : accuracy >= 60
                  ? '👍 Good progress! Review again soon.'
                  : '💪 Keep practicing! You\'ll get there.'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onRestart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Review More
            </Button>
            <Link href="/app/vocabulary" className="flex-1">
              <Button variant="aviation" className="w-full">
                Done
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Review Page
// =============================================================================

export default function VocabularyReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const [queue, setQueue] = useState<VocabularyReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    reviewed: 0,
    correct: 0,
    xpEarned: 0,
  });
  
  const startTimeRef = useRef<number>(Date.now());
  
  // Keyboard event handler for flipping card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isFlipped && !sessionComplete && queue.length > 0) {
        e.preventDefault();
        setIsFlipped(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, sessionComplete, queue.length]);
  
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getVocabularyReviewQueue(20, category || undefined);
      setQueue(data.items);
      setStats(prev => ({ ...prev, total: data.items.length }));
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionComplete(false);
    } catch (err) {
      console.error('Failed to fetch review queue:', err);
      setError('Failed to load vocabulary cards');
    } finally {
      setIsLoading(false);
    }
  }, [category]);
  
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);
  
  const handleFlip = () => {
    setIsFlipped(true);
  };
  
  const handleRate = async (quality: number) => {
    if (!queue[currentIndex]) return;
    
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    try {
      const result = await submitVocabularyReview(
        queue[currentIndex].term.id,
        quality,
        timeSpent
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
        xpEarned: prev.xpEarned + result.xp_earned,
      }));
      
      // Move to next card or complete session
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        startTimeRef.current = Date.now();
      } else {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      // Still move to next card on error
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        setSessionComplete(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRestart = () => {
    setStats({ total: 0, reviewed: 0, correct: 0, xpEarned: 0 });
    fetchQueue();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading vocabulary cards...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold">Unable to load cards</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchQueue} variant="outline">
              Try again
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Empty state
  if (queue.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold">All caught up!</h2>
              <p className="text-sm text-muted-foreground">
                No cards due for review right now. Check back later or learn new words.
              </p>
            </div>
            <Link href="/app/vocabulary">
              <Button variant="aviation">
                Back to Vocabulary
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }
  
  // Session complete
  if (sessionComplete) {
    return <SessionSummary stats={stats} onRestart={handleRestart} />;
  }
  
  const currentItem = queue[currentIndex];
  const progressPercent = ((currentIndex + 1) / queue.length) * 100;
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 mx-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              Card {currentIndex + 1} of {queue.length}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} size="sm" />
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSessionComplete(true)}
          title="End session"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Session Stats */}
      <div className="flex items-center justify-center gap-4 mb-6 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>{stats.correct} correct</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-primary" />
          <span>+{stats.xpEarned} XP</span>
        </div>
      </div>
      
      {/* Flashcard */}
      <Flashcard
        item={currentItem}
        isFlipped={isFlipped}
        onFlip={handleFlip}
        onRate={handleRate}
        isSubmitting={isSubmitting}
      />
      
      {/* Keyboard hints */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Space</kbd> to flip
      </p>
    </div>
  );
}

