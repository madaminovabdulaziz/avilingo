"""
Transcription Service

Handles audio-to-text transcription using:
- OpenAI Whisper API (production)
- Local Whisper model (development/offline)
"""

import os
import logging
import tempfile
from typing import Optional, Tuple
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class TranscriptionResult:
    """Result of audio transcription."""
    text: str
    language: str
    duration_seconds: float
    confidence: float
    segments: list  # Word-level or segment-level timestamps


class TranscriptionService:
    """
    Service for audio transcription.
    
    Supports two modes:
    1. OpenAI Whisper API (USE_OPENAI_WHISPER_API=true)
       - Faster, more accurate, no GPU needed
       - Requires OpenAI API key and costs money
       
    2. Local Whisper model (USE_OPENAI_WHISPER_API=false)
       - Free, runs locally
       - Requires GPU for reasonable speed
       - Model downloaded on first use
    """
    
    def __init__(self):
        self._local_model = None
        self._model_name = settings.WHISPER_MODEL
        self._use_api = settings.USE_OPENAI_WHISPER_API
    
    async def transcribe(
        self,
        audio_path: str,
        language: str = "en"
    ) -> TranscriptionResult:
        """
        Transcribe audio file to text.
        
        Args:
            audio_path: Path to audio file
            language: Expected language (default: English)
            
        Returns:
            TranscriptionResult with text and metadata
        """
        if self._use_api:
            return await self._transcribe_with_api(audio_path, language)
        else:
            return await self._transcribe_with_local_model(audio_path, language)
    
    async def transcribe_from_url(
        self,
        audio_url: str,
        language: str = "en"
    ) -> TranscriptionResult:
        """
        Download audio from URL and transcribe.
        
        Args:
            audio_url: URL to audio file
            language: Expected language
            
        Returns:
            TranscriptionResult
        """
        # Download audio to temp file
        async with httpx.AsyncClient() as client:
            response = await client.get(audio_url, timeout=60.0)
            response.raise_for_status()
            
            # Get file extension from URL or content-type
            ext = self._get_extension_from_url(audio_url) or "webm"
            
            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                tmp.write(response.content)
                tmp_path = tmp.name
        
        try:
            result = await self.transcribe(tmp_path, language)
            return result
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    def _get_extension_from_url(self, url: str) -> Optional[str]:
        """Extract file extension from URL."""
        path = url.split("?")[0]  # Remove query params
        if "." in path:
            return path.rsplit(".", 1)[-1].lower()
        return None
    
    # =========================================================================
    # OpenAI Whisper API
    # =========================================================================
    
    async def _transcribe_with_api(
        self,
        audio_path: str,
        language: str
    ) -> TranscriptionResult:
        """Transcribe using OpenAI Whisper API."""
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        
        async with httpx.AsyncClient() as client:
            with open(audio_path, "rb") as audio_file:
                response = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    },
                    files={
                        "file": (os.path.basename(audio_path), audio_file),
                    },
                    data={
                        "model": "whisper-1",
                        "language": language,
                        "response_format": "verbose_json",
                    },
                    timeout=120.0,
                )
                
                response.raise_for_status()
                data = response.json()
        
        # Parse response
        segments = []
        if "segments" in data:
            segments = [
                {
                    "start": s.get("start", 0),
                    "end": s.get("end", 0),
                    "text": s.get("text", ""),
                }
                for s in data["segments"]
            ]
        
        return TranscriptionResult(
            text=data.get("text", "").strip(),
            language=data.get("language", language),
            duration_seconds=data.get("duration", 0),
            confidence=1.0,  # API doesn't provide confidence
            segments=segments,
        )
    
    # =========================================================================
    # Local Whisper Model
    # =========================================================================
    
    async def _transcribe_with_local_model(
        self,
        audio_path: str,
        language: str
    ) -> TranscriptionResult:
        """Transcribe using local Whisper model."""
        import asyncio
        
        # Run in thread pool to not block event loop
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._transcribe_sync,
            audio_path,
            language
        )
    
    def _transcribe_sync(self, audio_path: str, language: str) -> TranscriptionResult:
        """Synchronous transcription with local model."""
        # Lazy load model
        if self._local_model is None:
            self._load_local_model()
        
        # Transcribe
        result = self._local_model.transcribe(
            audio_path,
            language=language,
            task="transcribe",
            verbose=False,
        )
        
        # Parse segments
        segments = [
            {
                "start": s["start"],
                "end": s["end"],
                "text": s["text"].strip(),
            }
            for s in result.get("segments", [])
        ]
        
        # Calculate average confidence
        confidences = [
            s.get("avg_logprob", -1)
            for s in result.get("segments", [])
        ]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        # Convert log probability to 0-1 range (rough approximation)
        confidence = min(1.0, max(0.0, (avg_confidence + 1) / 1))
        
        return TranscriptionResult(
            text=result.get("text", "").strip(),
            language=result.get("language", language),
            duration_seconds=segments[-1]["end"] if segments else 0,
            confidence=confidence,
            segments=segments,
        )
    
    def _load_local_model(self):
        """Load the local Whisper model."""
        try:
            import whisper
            
            logger.info(f"Loading Whisper model: {self._model_name}")
            self._local_model = whisper.load_model(self._model_name)
            logger.info(f"Whisper model loaded successfully")
            
        except ImportError:
            raise ImportError(
                "whisper not installed. Install with: pip install openai-whisper"
            )
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise


# Singleton instance
transcription_service = TranscriptionService()


# Convenience function
async def transcribe_audio(
    audio_path: str = None,
    audio_url: str = None,
    language: str = "en"
) -> TranscriptionResult:
    """
    Transcribe audio from file path or URL.
    
    Args:
        audio_path: Local file path (preferred)
        audio_url: URL to download from
        language: Expected language
        
    Returns:
        TranscriptionResult
    """
    if audio_path:
        return await transcription_service.transcribe(audio_path, language)
    elif audio_url:
        return await transcription_service.transcribe_from_url(audio_url, language)
    else:
        raise ValueError("Either audio_path or audio_url must be provided")

