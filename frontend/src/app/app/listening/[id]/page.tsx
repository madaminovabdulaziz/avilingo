'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AudioPlayer } from '@/components/audio-player';
import {
  getListeningExercise,
  submitListeningAnswers,
  type ListeningExercise,
  type ListeningQuestion,
  type ListeningSubmitResponse,
} from '@/lib/api';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  Zap,
  Clock,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  clearance_delivery: 'Clearance Delivery',
  ground: 'Ground Control',
  tower: 'Tower',
  approach: 'Approach',
  departure: 'Departure',
  en_route: 'En Route',
  emergency: 'Emergency',
};

// =============================================================================
// Question Component
// =============================================================================

interface QuestionCardProps {
  question: ListeningQuestion;
  index: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  result?: {
    is_correct: boolean;
    correct_answer: string;
    explanation: string | null;
  };
}

function QuestionCard({
  question,
  index,
  value,
  onChange,
  disabled,
  result,
}: QuestionCardProps) {
  const renderQuestionInput = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, optIdx) => {
              const isSelected = value === option;
              const isCorrect = result?.correct_answer === option;
              const isWrong = result && isSelected && !result.is_correct;
              
              return (
                <button
                  key={optIdx}
                  onClick={() => !disabled && onChange(option)}
                  disabled={disabled}
                  className={cn(
                    'w-full p-3 text-left rounded-lg border transition-all',
                    isSelected && !result && 'border-primary bg-primary/10',
                    !isSelected && !result && 'border-border hover:border-muted-foreground',
                    isCorrect && result && 'border-green-500 bg-green-500/10',
                    isWrong && 'border-red-500 bg-red-500/10',
                    disabled && 'cursor-default'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {isCorrect && result && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {isWrong && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );
        
      case 'true_false':
        return (
          <div className="flex gap-3">
            {['True', 'False'].map((option) => {
              const isSelected = value === option;
              const isCorrect = result?.correct_answer === option;
              const isWrong = result && isSelected && !result.is_correct;
              
              return (
                <button
                  key={option}
                  onClick={() => !disabled && onChange(option)}
                  disabled={disabled}
                  className={cn(
                    'flex-1 p-3 text-center rounded-lg border transition-all font-medium',
                    isSelected && !result && 'border-primary bg-primary/10',
                    !isSelected && !result && 'border-border hover:border-muted-foreground',
                    isCorrect && result && 'border-green-500 bg-green-500/10 text-green-500',
                    isWrong && 'border-red-500 bg-red-500/10 text-red-500',
                    disabled && 'cursor-default'
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );
        
      case 'fill_blank':
        return (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder="Type your answer..."
              className={cn(
                'w-full p-3 rounded-lg border bg-transparent',
                result?.is_correct && 'border-green-500 bg-green-500/10',
                result && !result.is_correct && 'border-red-500 bg-red-500/10',
                !result && 'border-border focus:border-primary'
              )}
            />
            {result && !result.is_correct && (
              <p className="mt-2 text-sm text-green-500">
                Correct answer: {result.correct_answer}
              </p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className={cn(
      result?.is_correct && 'border-green-500/30',
      result && !result.is_correct && 'border-red-500/30'
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex-shrink-0">
            {index + 1}
          </span>
          <p className="flex-1">{question.question_text}</p>
          {result && (
            result.is_correct ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )
          )}
        </div>
        
        {renderQuestionInput()}
        
        {result?.explanation && !result.is_correct && (
          <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{result.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Results Summary
// =============================================================================

interface ResultsSummaryProps {
  result: ListeningSubmitResponse;
  onTryAgain: () => void;
}

function ResultsSummary({ result, onTryAgain }: ResultsSummaryProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className={cn(
        'border-2',
        result.score_percent >= 80 && 'border-green-500/50 bg-green-500/5',
        result.score_percent >= 60 && result.score_percent < 80 && 'border-amber-500/50 bg-amber-500/5',
        result.score_percent < 60 && 'border-red-500/50 bg-red-500/5'
      )}>
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-background border-2">
            {result.score_percent >= 80 ? (
              <Trophy className="w-8 h-8 text-green-500" />
            ) : result.score_percent >= 60 ? (
              <CheckCircle2 className="w-8 h-8 text-amber-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          
          <div>
            <p className="text-4xl font-bold">
              {Math.round(result.score_percent)}%
            </p>
            <p className="text-muted-foreground">
              {result.correct_count} of {result.total_questions} correct
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              +{result.xp_earned} XP
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {Math.floor(result.time_spent_seconds / 60)}m {result.time_spent_seconds % 60}s
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Transcript */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transcript</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              <Eye className="w-4 h-4 mr-1" />
              {showTranscript ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showTranscript && (
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-mono text-sm whitespace-pre-wrap">
                {result.transcript}
              </p>
            </div>
            {result.model_readback && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Model Readback
                </p>
                <p className="font-mono text-sm text-green-500">
                  {result.model_readback}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* Teaching Points */}
      {result.teaching_points && result.teaching_points.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Key Learning Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.teaching_points.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onTryAgain}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Link href="/app/listening" className="flex-1">
          <Button variant="aviation" className="w-full">
            More Exercises
          </Button>
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// Exercise Page
// =============================================================================

export default function ListeningExercisePage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.id as string;
  
  const [exercise, setExercise] = useState<ListeningExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Exercise state
  const [hasListened, setHasListened] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ListeningSubmitResponse | null>(null);
  
  // Tracking
  const [startTime] = useState(Date.now());
  const [audioPlays, setAudioPlays] = useState(0);
  
  const fetchExercise = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getListeningExercise(exerciseId);
      setExercise(data);
    } catch (err) {
      console.error('Failed to fetch exercise:', err);
      setError('Failed to load exercise');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);
  
  useEffect(() => {
    fetchExercise();
  }, [fetchExercise]);
  
  const handleAudioPlay = () => {
    setAudioPlays((prev) => prev + 1);
  };
  
  const handleAudioEnded = () => {
    setHasListened(true);
  };
  
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };
  
  const handleSubmit = async () => {
    if (!exercise) return;
    
    // Check all questions answered
    const unanswered = exercise.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const response = await submitListeningAnswers(
        exerciseId,
        answers,
        timeSpent,
        audioPlays
      );
      setResult(response);
    } catch (err) {
      console.error('Failed to submit:', err);
      alert('Failed to submit answers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTryAgain = () => {
    setAnswers({});
    setResult(null);
    setShowQuestions(false);
    setHasListened(false);
    setAudioPlays(0);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading exercise...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !exercise) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold">Unable to load exercise</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchExercise} variant="outline">
                Try again
              </Button>
              <Link href="/app/listening">
                <Button variant="aviation">Back to list</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exercise.questions.length;
  const progressPercent = (answeredCount / totalQuestions) * 100;
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold line-clamp-1">{exercise.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" size="sm">
              {CATEGORY_LABELS[exercise.category] || exercise.category}
            </Badge>
            <span>{exercise.accent}</span>
            <span>•</span>
            <span>Difficulty {exercise.difficulty}</span>
          </div>
        </div>
      </div>
      
      {/* Audio Player */}
      {exercise.audio_url && !result && (
        <AudioPlayer
          src={exercise.audio_url}
          onPlay={handleAudioPlay}
          onEnded={handleAudioEnded}
          disabled={result !== null}
        />
      )}
      
      {/* Placeholder if no audio */}
      {!exercise.audio_url && !result && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Audio not available for this exercise
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setHasListened(true);
              setShowQuestions(true);
            }}
          >
            Continue to Questions
          </Button>
        </Card>
      )}
      
      {/* Ready to Answer Button */}
      {hasListened && !showQuestions && !result && (
        <Button
          variant="aviation"
          size="lg"
          className="w-full"
          onClick={() => setShowQuestions(true)}
        >
          Ready to Answer Questions
        </Button>
      )}
      
      {/* Not listened hint */}
      {!hasListened && !showQuestions && !result && exercise.audio_url && (
        <p className="text-center text-sm text-muted-foreground">
          Listen to the audio first, then answer the questions
        </p>
      )}
      
      {/* Results */}
      {result && (
        <>
          <ResultsSummary result={result} onTryAgain={handleTryAgain} />
          
          {/* Question Results */}
          <div className="space-y-4">
            <h2 className="font-medium">Your Answers</h2>
            {exercise.questions.map((question, idx) => {
              const questionResult = result.results.find(
                (r) => r.question_id === question.id
              );
              return (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={idx}
                  value={answers[question.id] || ''}
                  onChange={() => {}}
                  disabled
                  result={
                    questionResult
                      ? {
                          is_correct: questionResult.is_correct,
                          correct_answer: questionResult.correct_answer,
                          explanation: questionResult.explanation,
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </>
      )}
      
      {/* Questions */}
      {showQuestions && !result && (
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {answeredCount} of {totalQuestions} answered
              </span>
              <span className="text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>
          
          {/* Question Cards */}
          <div className="space-y-4">
            {exercise.questions.map((question, idx) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={idx}
                value={answers[question.id] || ''}
                onChange={(value) => handleAnswerChange(question.id, value)}
              />
            ))}
          </div>
          
          {/* Submit Button */}
          <Button
            variant="aviation"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount < totalQuestions}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Answers'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

