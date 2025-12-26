'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface AudioPlayerProps {
  src: string;
  onPlay?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
  disabled?: boolean;
  showSpeedControl?: boolean;
}

// =============================================================================
// Speed Options
// =============================================================================

const SPEED_OPTIONS = [0.75, 1, 1.25] as const;

// =============================================================================
// AudioPlayer Component
// =============================================================================

export function AudioPlayer({
  src,
  onPlay,
  onEnded,
  onTimeUpdate,
  className,
  disabled = false,
  showSpeedControl = true,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<typeof SPEED_OPTIONS[number]>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || disabled) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      onPlay?.();
    }
  }, [isPlaying, disabled, onPlay]);
  
  // Restart audio
  const restart = useCallback(() => {
    if (!audioRef.current || disabled) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    onPlay?.();
  }, [disabled, onPlay]);
  
  // Change playback speed
  const changeSpeed = useCallback(() => {
    if (!audioRef.current) return;
    
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIndex];
    
    setPlaybackSpeed(newSpeed);
    audioRef.current.playbackRate = newSpeed;
  }, [playbackSpeed]);
  
  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);
  
  // Seek to position
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || disabled) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration, disabled]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case ' ':
          if (e.target === document.body) {
            e.preventDefault();
            togglePlay();
          }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          restart();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          changeSpeed();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          if (audioRef.current) {
            e.preventDefault();
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
          }
          break;
        case 'ArrowRight':
          if (audioRef.current) {
            e.preventDefault();
            audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, togglePlay, restart, changeSpeed, toggleMute, duration]);
  
  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime, audio.duration);
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onEnded, onTimeUpdate]);
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const reducedMotion = useReducedMotion();
  
  // Waveform bars for visualization
  const waveformBars = 24;
  const getWaveformHeight = (index: number) => {
    if (!isPlaying) return 0.15;
    // Create a wave pattern based on progress
    const normalizedProgress = (currentTime / duration) || 0;
    const wave = Math.sin((index / waveformBars) * Math.PI * 2 + normalizedProgress * 10);
    return 0.3 + (wave + 1) * 0.35;
  };
  
  return (
    <div className={cn('bg-card rounded-xl border p-4 space-y-4', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Waveform Visualization */}
      <div className="flex items-center justify-center gap-[2px] h-12 mb-2">
        {Array.from({ length: waveformBars }).map((_, i) => {
          const isPast = duration > 0 && (i / waveformBars) < (currentTime / duration);
          return (
            <motion.div
              key={i}
              className={cn(
                'w-1 rounded-full origin-center',
                isPast ? 'bg-primary' : 'bg-muted'
              )}
              initial={{ scaleY: 0.15 }}
              animate={{ 
                scaleY: reducedMotion 
                  ? (isPlaying ? 0.5 : 0.15) 
                  : getWaveformHeight(i) 
              }}
              transition={{ duration: 0.1 }}
              style={{ height: 48 }}
            />
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className={cn(
          'relative h-2 bg-muted rounded-full cursor-pointer overflow-hidden',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
        {/* Playhead */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md"
          initial={{ left: '-6px' }}
          animate={{ left: `calc(${progress}% - 6px)` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      
      {/* Time Display */}
      <div className="flex items-center justify-between text-sm text-muted-foreground font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Restart Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={restart}
          disabled={disabled}
          title="Restart (R)"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        {/* Play/Pause Button */}
        <motion.div
          whileHover={reducedMotion ? {} : { scale: 1.05 }}
          whileTap={reducedMotion ? {} : { scale: 0.95 }}
        >
          <Button
            variant="aviation"
            size="lg"
            onClick={togglePlay}
            disabled={disabled || isLoading}
            className="w-14 h-14 rounded-full"
          >
            {isLoading ? (
              <motion.div 
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>
        </motion.div>
        
        {/* Mute Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          disabled={disabled}
          title="Mute (M)"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {/* Speed Control */}
      {showSpeedControl && (
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={changeSpeed}
            disabled={disabled}
            className="font-mono text-xs"
            title="Change speed (S)"
          >
            {playbackSpeed}x
          </Button>
        </div>
      )}
      
      {/* Keyboard Hints */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span><kbd className="px-1 bg-muted rounded">Space</kbd> Play/Pause</span>
        <span><kbd className="px-1 bg-muted rounded">R</kbd> Restart</span>
        <span><kbd className="px-1 bg-muted rounded">S</kbd> Speed</span>
        <span><kbd className="px-1 bg-muted rounded">←→</kbd> Seek ±5s</span>
      </div>
    </div>
  );
}

export default AudioPlayer;

