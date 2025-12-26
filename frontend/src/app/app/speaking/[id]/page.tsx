'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AudioPlayer } from '@/components/audio-player';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import {
  getSpeakingScenario,
  submitSpeakingRecording,
  getSpeakingSubmissionStatus,
  getSpeakingSubmission,
  type SpeakingScenario,
  type SpeakingSubmission,
  type SpeakingSubmissionStatus,
} from '@/lib/api';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Mic,
  Square,
  Play,
  RotateCcw,
  Upload,
  CheckCircle2,
  Trophy,
  Zap,
  Volume2,
  Lightbulb,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

type PageState = 'setup' | 'recording' | 'preview' | 'uploading' | 'analyzing' | 'results';

// =============================================================================
// Waveform Visualization
// =============================================================================

interface WaveformProps {
  level: number;
  isRecording: boolean;
}

function Waveform({ level, isRecording }: WaveformProps) {
  const bars = 20;
  
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const distanceFromCenter = Math.abs(i - bars / 2);
        const heightMultiplier = isRecording 
          ? Math.max(0.2, level * (1 - distanceFromCenter / (bars / 2)) + Math.random() * 0.1)
          : 0.2;
        
        return (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full transition-all duration-75',
              isRecording ? 'bg-red-500' : 'bg-muted-foreground/30'
            )}
            style={{
              height: `${Math.max(8, heightMultiplier * 64)}px`,
            }}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// ICAO Score Gauge
// =============================================================================

interface ICAOGaugeProps {
  label: string;
  score: number;
  maxScore?: number;
}

function ICAOGauge({ label, score, maxScore = 6 }: ICAOGaugeProps) {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (score >= 5) return 'text-blue-500';
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const getProgressVariant = () => {
    if (score >= 5) return 'icao-5' as const;
    if (score >= 4) return 'icao-4' as const;
    if (score >= 3) return 'icao-3' as const;
    return 'icao-1' as const;
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground capitalize">{label}</span>
        <span className={cn('font-bold', getColor())}>{score.toFixed(1)}</span>
      </div>
      <Progress value={percentage} variant={getProgressVariant()} size="sm" />
    </div>
  );
}

// =============================================================================
// Results View
// =============================================================================

interface ResultsViewProps {
  submission: SpeakingSubmission;
  onTryAgain: () => void;
}

function ResultsView({ submission, onTryAgain }: ResultsViewProps) {
  const overallScore = submission.overall_score || 0;
  const scoreLevel = Math.floor(overallScore);
  
  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className={cn(
        'border-2',
        overallScore >= 5 && 'border-blue-500/50 bg-blue-500/5',
        overallScore >= 4 && overallScore < 5 && 'border-green-500/50 bg-green-500/5',
        overallScore >= 3 && overallScore < 4 && 'border-amber-500/50 bg-amber-500/5',
        overallScore < 3 && 'border-red-500/50 bg-red-500/5'
      )}>
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-background border-4">
            <Trophy className={cn(
              'w-10 h-10',
              overallScore >= 5 && 'text-blue-500',
              overallScore >= 4 && overallScore < 5 && 'text-green-500',
              overallScore >= 3 && overallScore < 4 && 'text-amber-500',
              overallScore < 3 && 'text-red-500'
            )} />
          </div>
          
          <div>
            <p className="text-5xl font-bold">{overallScore.toFixed(1)}</p>
            <p className="text-muted-foreground">ICAO Level {scoreLevel}</p>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              +{submission.xp_earned} XP
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* ICAO Criteria Scores */}
      {submission.scores && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ICAO Criteria Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ICAOGauge label="Pronunciation" score={submission.scores.pronunciation} />
            <ICAOGauge label="Structure" score={submission.scores.structure} />
            <ICAOGauge label="Vocabulary" score={submission.scores.vocabulary} />
            <ICAOGauge label="Fluency" score={submission.scores.fluency} />
            <ICAOGauge label="Comprehension" score={submission.scores.comprehension} />
            <ICAOGauge label="Interaction" score={submission.scores.interaction} />
          </CardContent>
        </Card>
      )}
      
      {/* Transcript */}
      {submission.transcript && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-mono text-sm">{submission.transcript}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* AI Feedback */}
      {submission.ai_feedback && (
        <>
          {/* Strengths */}
          {submission.ai_feedback.strengths.length > 0 && (
            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {submission.ai_feedback.strengths.map((strength, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-green-500">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Improvements */}
          {submission.ai_feedback.improvements.length > 0 && (
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-500">
                  <Lightbulb className="w-4 h-4" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {submission.ai_feedback.improvements.map((improvement, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-amber-500">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Specific Corrections */}
          {submission.ai_feedback.specific_corrections && 
           submission.ai_feedback.specific_corrections.length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-500">
                  <XCircle className="w-4 h-4" />
                  Corrections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.ai_feedback.specific_corrections.map((correction, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="text-red-400 line-through">{correction.said}</p>
                    <p className="text-green-400">→ {correction.should_be}</p>
                    <p className="text-muted-foreground text-xs mt-1">{correction.explanation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Model Response */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-primary">
            <Volume2 className="w-4 h-4" />
            Model Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="font-mono text-sm text-primary">{submission.sample_response}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onTryAgain}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Link href="/app/speaking" className="flex-1">
          <Button variant="aviation" className="w-full">
            More Scenarios
          </Button>
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Exercise Page
// =============================================================================

export default function SpeakingExercisePage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.id as string;
  
  const [scenario, setScenario] = useState<SpeakingScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>('setup');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<SpeakingSubmission | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const audioRecorder = useAudioRecorder({ maxDuration: 180 });
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch scenario
  const fetchScenario = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getSpeakingScenario(scenarioId);
      setScenario(data);
    } catch (err) {
      console.error('Failed to fetch scenario:', err);
      setError('Failed to load scenario');
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId]);
  
  useEffect(() => {
    fetchScenario();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchScenario]);
  
  // Handle recording start
  const handleStartRecording = async () => {
    const granted = await audioRecorder.requestPermission();
    if (granted) {
      await audioRecorder.startRecording();
      setPageState('recording');
    }
  };
  
  // Handle recording stop
  const handleStopRecording = () => {
    audioRecorder.stopRecording();
    setPageState('preview');
  };
  
  // Handle re-record
  const handleReRecord = () => {
    audioRecorder.reset();
    setPageState('setup');
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!audioRecorder.audioBlob) return;
    
    setPageState('uploading');
    
    try {
      const result = await submitSpeakingRecording(
        scenarioId,
        audioRecorder.audioBlob,
        Math.floor(audioRecorder.duration)
      );
      
      setSubmissionId(result.submission_id);
      setPageState('analyzing');
      setAnalysisProgress(0);
      
      // Start polling for status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await getSpeakingSubmissionStatus(result.submission_id);
          setAnalysisProgress(status.progress_percent);
          
          if (status.status === 'completed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            
            // Fetch full submission with feedback
            const fullSubmission = await getSpeakingSubmission(result.submission_id);
            setSubmission(fullSubmission);
            setPageState('results');
          } else if (status.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            setError(status.error_message || 'Analysis failed');
            setPageState('preview');
          }
        } catch (err) {
          console.error('Status poll error:', err);
        }
      }, 2000);
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload recording');
      setPageState('preview');
    }
  };
  
  // Handle try again
  const handleTryAgain = () => {
    audioRecorder.reset();
    setSubmission(null);
    setSubmissionId(null);
    setPageState('setup');
  };
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading scenario...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && !scenario) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold">Unable to load scenario</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchScenario} variant="outline">
                Try again
              </Button>
              <Link href="/app/speaking">
                <Button variant="aviation">Back to list</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!scenario) return null;
  
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold line-clamp-1">{scenario.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" size="sm">
              {scenario.scenario_type.replace(/_/g, ' ')}
            </Badge>
            <span>Difficulty {scenario.difficulty}</span>
          </div>
        </div>
      </div>
      
      {/* Results View */}
      {pageState === 'results' && submission && (
        <ResultsView submission={submission} onTryAgain={handleTryAgain} />
      )}
      
      {/* Analyzing State */}
      {pageState === 'analyzing' && (
        <Card className="p-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium">Analyzing your response...</p>
              <p className="text-sm text-muted-foreground mt-1">
                This may take a few seconds
              </p>
            </div>
            <Progress value={analysisProgress} className="max-w-xs mx-auto" />
            <p className="text-xs text-muted-foreground">{analysisProgress}%</p>
          </div>
        </Card>
      )}
      
      {/* Uploading State */}
      {pageState === 'uploading' && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-lg font-medium">Uploading recording...</p>
          </div>
        </Card>
      )}
      
      {/* Setup / Recording / Preview States */}
      {(pageState === 'setup' || pageState === 'recording' || pageState === 'preview') && (
        <>
          {/* Scenario Context */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{scenario.setup}</p>
              
              {scenario.instructions && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">{scenario.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* ATC Prompt */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Volume2 className="w-4 h-4" />
                ATC Says
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-primary mb-4">{scenario.atc_prompt_text}</p>
              
              {scenario.atc_prompt_audio_url && (
                <AudioPlayer
                  src={scenario.atc_prompt_audio_url}
                  showSpeedControl={false}
                  className="bg-background"
                />
              )}
            </CardContent>
          </Card>
          
          {/* Expected Elements */}
          {scenario.expected_elements && scenario.expected_elements.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Include in your response:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scenario.expected_elements.map((element, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>{element}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Recording Section */}
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Waveform */}
              <Waveform 
                level={audioRecorder.audioLevel} 
                isRecording={audioRecorder.isRecording} 
              />
              
              {/* Timer */}
              <div className="text-center">
                <span className={cn(
                  'font-mono text-4xl font-bold',
                  audioRecorder.isRecording && 'text-red-500'
                )}>
                  {formatDuration(audioRecorder.duration)}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 3:00
                </p>
              </div>
              
              {/* Error Message */}
              {(audioRecorder.error || error) && (
                <p className="text-center text-sm text-destructive">
                  {audioRecorder.error || error}
                </p>
              )}
              
              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-4">
                {pageState === 'setup' && (
                  <Button
                    variant="aviation"
                    size="lg"
                    className="w-20 h-20 rounded-full"
                    onClick={handleStartRecording}
                  >
                    <Mic className="w-8 h-8" />
                  </Button>
                )}
                
                {pageState === 'recording' && (
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-20 h-20 rounded-full"
                    onClick={handleStopRecording}
                  >
                    <Square className="w-8 h-8" />
                  </Button>
                )}
                
                {pageState === 'preview' && audioRecorder.audioUrl && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-12 h-12 rounded-full"
                      onClick={handleReRecord}
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                    
                    <Button
                      variant="aviation"
                      size="lg"
                      className="px-8"
                      onClick={handleSubmit}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Submit
                    </Button>
                  </>
                )}
              </div>
              
              {/* Playback */}
              {pageState === 'preview' && audioRecorder.audioUrl && (
                <div className="pt-4">
                  <AudioPlayer
                    src={audioRecorder.audioUrl}
                    showSpeedControl={false}
                    className="bg-muted/50"
                  />
                </div>
              )}
              
              {/* Hint */}
              {pageState === 'setup' && (
                <p className="text-center text-xs text-muted-foreground">
                  Tap the microphone to start recording your response
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

