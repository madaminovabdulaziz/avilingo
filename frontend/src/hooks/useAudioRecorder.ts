'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

export type RecordingState = 'idle' | 'requesting' | 'ready' | 'recording' | 'paused' | 'stopped';

export interface AudioRecorderConfig {
  maxDuration?: number; // Max recording duration in seconds (default: 180)
  mimeType?: string; // Audio MIME type (default: 'audio/webm')
  audioBitsPerSecond?: number; // Audio bitrate (default: 128000)
}

export interface UseAudioRecorderReturn {
  // State
  state: RecordingState;
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // Recording duration in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  hasPermission: boolean;
  
  // Audio levels for visualization
  audioLevel: number; // 0-1 for waveform visualization
  
  // Actions
  requestPermission: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useAudioRecorder(config: AudioRecorderConfig = {}): UseAudioRecorderReturn {
  const {
    maxDuration = 180,
    mimeType = 'audio/webm',
    audioBitsPerSecond = 128000,
  } = config;
  
  // State
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Computed
  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  
  // Clean up audio URL when blob changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Audio level analysis
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || state !== 'recording') {
      setAudioLevel(0);
      return;
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average level
    const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    const normalizedLevel = average / 255;
    
    setAudioLevel(normalizedLevel);
    
    if (state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [state]);
  
  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState('requesting');
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      setState('ready');
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setError(message);
      setState('idle');
      setHasPermission(false);
      return false;
    }
  }, []);
  
  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    
    // Request permission if not already granted
    if (!streamRef.current) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    if (!streamRef.current) {
      setError('No audio stream available');
      return;
    }
    
    // Clear previous recording
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    chunksRef.current = [];
    
    // Determine supported MIME type
    let actualMimeType = mimeType;
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      // Fallback options
      const fallbacks = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      const supported = fallbacks.find(type => MediaRecorder.isTypeSupported(type));
      if (supported) {
        actualMimeType = supported;
      }
    }
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: actualMimeType,
        audioBitsPerSecond,
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState('stopped');
        
        // Stop analysis
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed');
        setState('ready');
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      
      setState('recording');
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      setDuration(0);
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
        setDuration(elapsed);
        
        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
      
      // Start audio level analysis
      analyzeAudio();
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setState('ready');
    }
  }, [mimeType, audioBitsPerSecond, maxDuration, requestPermission, audioUrl, analyzeAudio]);
  
  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      pausedDurationRef.current = Date.now() - startTimeRef.current - (duration * 1000);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
    }
  }, [state, duration]);
  
  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');
      
      const pauseDuration = Date.now() - startTimeRef.current - (duration * 1000);
      pausedDurationRef.current = pauseDuration;
      
      // Restart timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
        setDuration(elapsed);
        
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
      
      // Restart analysis
      analyzeAudio();
    }
  }, [state, duration, maxDuration, analyzeAudio]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
      mediaRecorderRef.current.stop();
      // State will be set to 'stopped' in onstop handler
    }
  }, [state]);
  
  // Reset to initial state
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setAudioLevel(0);
    setState(hasPermission ? 'ready' : 'idle');
  }, [audioUrl, hasPermission]);
  
  return {
    state,
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    hasPermission,
    audioLevel,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
  };
}

export default useAudioRecorder;

