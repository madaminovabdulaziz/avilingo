"""
AI Feedback Service

Generates ICAO-based scoring and feedback for speaking submissions using:
- OpenAI GPT-4 for feedback generation
- Rule-based fallback for basic scoring
"""

import json
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ICAOScores:
    """ICAO criteria scores (1-6 scale)."""
    pronunciation: float
    structure: float
    vocabulary: float
    fluency: float
    comprehension: float
    interaction: float
    
    def average(self) -> float:
        """Calculate average score."""
        return round((
            self.pronunciation +
            self.structure +
            self.vocabulary +
            self.fluency +
            self.comprehension +
            self.interaction
        ) / 6, 2)
    
    def to_dict(self) -> Dict[str, float]:
        return asdict(self)


@dataclass
class AIFeedback:
    """AI-generated feedback for a speaking submission."""
    summary: str
    strengths: list
    improvements: list
    specific_corrections: list
    pronunciation_notes: list
    overall_assessment: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AIFeedbackService:
    """
    Service for AI-powered feedback generation.
    
    Uses OpenAI GPT-4 to analyze transcripts and generate:
    - ICAO criteria scores (1-6)
    - Detailed feedback with strengths and improvements
    - Specific corrections for phraseology
    """
    
    SYSTEM_PROMPT = """You are an expert aviation English instructor and ICAO Language Proficiency examiner.

Your task is to evaluate a pilot's response to an ATC scenario based on ICAO Language Proficiency Requirements.

Score each criterion on a scale of 1-6:
- Level 1: Pre-Elementary - Unable to function in English
- Level 2: Elementary - Limited phrases, many errors
- Level 3: Pre-Operational - Frequent errors, limited vocabulary
- Level 4: Operational - Effective communication with some errors
- Level 5: Extended - Wide range, good fluency, minor errors
- Level 6: Expert - Native-like proficiency

The 6 ICAO criteria are:
1. Pronunciation - Clarity, stress, rhythm, intonation
2. Structure - Grammar, sentence complexity
3. Vocabulary - Range, precision, aviation terminology
4. Fluency - Speed, hesitation, natural flow
5. Comprehension - Understanding of the scenario/prompt
6. Interaction - Appropriate responses, clarification

For aviation English, focus on:
- Correct use of standard phraseology
- Proper readback format
- Clear number pronunciation
- Callsign placement
- Appropriate brevity

Respond in JSON format only."""

    def __init__(self):
        self._api_key = settings.OPENAI_API_KEY
    
    async def generate_feedback(
        self,
        transcript: str,
        expected_response: str,
        expected_elements: list,
        scenario_context: str,
        atc_prompt: str,
    ) -> tuple[ICAOScores, AIFeedback]:
        """
        Generate ICAO scores and feedback for a transcript.
        
        Args:
            transcript: The pilot's transcribed response
            expected_response: Model/sample response
            expected_elements: List of expected elements to include
            scenario_context: Background context of the scenario
            atc_prompt: The ATC message to respond to
            
        Returns:
            Tuple of (ICAOScores, AIFeedback)
        """
        if not self._api_key:
            logger.warning("OpenAI API key not configured, using rule-based fallback")
            return self._generate_fallback_feedback(
                transcript, expected_response, expected_elements
            )
        
        try:
            return await self._generate_with_gpt(
                transcript, expected_response, expected_elements,
                scenario_context, atc_prompt
            )
        except Exception as e:
            logger.error(f"GPT feedback generation failed: {e}")
            return self._generate_fallback_feedback(
                transcript, expected_response, expected_elements
            )
    
    async def _generate_with_gpt(
        self,
        transcript: str,
        expected_response: str,
        expected_elements: list,
        scenario_context: str,
        atc_prompt: str,
    ) -> tuple[ICAOScores, AIFeedback]:
        """Generate feedback using GPT-4."""
        
        user_prompt = f"""Evaluate this pilot's response:

**Scenario Context:**
{scenario_context}

**ATC Message:**
"{atc_prompt}"

**Pilot's Response:**
"{transcript}"

**Expected Model Response:**
"{expected_response}"

**Expected Elements:**
{json.dumps(expected_elements)}

Please provide:
1. ICAO scores for each criterion (1-6 scale)
2. Detailed feedback

Respond with this exact JSON structure:
{{
    "scores": {{
        "pronunciation": <float 1-6>,
        "structure": <float 1-6>,
        "vocabulary": <float 1-6>,
        "fluency": <float 1-6>,
        "comprehension": <float 1-6>,
        "interaction": <float 1-6>
    }},
    "feedback": {{
        "summary": "<one sentence overall assessment>",
        "strengths": ["<strength 1>", "<strength 2>"],
        "improvements": ["<improvement 1>", "<improvement 2>"],
        "specific_corrections": [
            {{"said": "<what pilot said>", "should_be": "<correct version>", "reason": "<why>"}}
        ],
        "pronunciation_notes": ["<pronunciation tip 1>"],
        "overall_assessment": "<2-3 sentence detailed assessment>"
    }}
}}"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4-turbo-preview",
                    "messages": [
                        {"role": "system", "content": self.SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1500,
                    "response_format": {"type": "json_object"},
                },
                timeout=60.0,
            )
            
            response.raise_for_status()
            data = response.json()
        
        # Parse response
        content = data["choices"][0]["message"]["content"]
        result = json.loads(content)
        
        scores = ICAOScores(
            pronunciation=float(result["scores"]["pronunciation"]),
            structure=float(result["scores"]["structure"]),
            vocabulary=float(result["scores"]["vocabulary"]),
            fluency=float(result["scores"]["fluency"]),
            comprehension=float(result["scores"]["comprehension"]),
            interaction=float(result["scores"]["interaction"]),
        )
        
        feedback = AIFeedback(
            summary=result["feedback"]["summary"],
            strengths=result["feedback"]["strengths"],
            improvements=result["feedback"]["improvements"],
            specific_corrections=result["feedback"]["specific_corrections"],
            pronunciation_notes=result["feedback"]["pronunciation_notes"],
            overall_assessment=result["feedback"]["overall_assessment"],
        )
        
        return scores, feedback
    
    def _generate_fallback_feedback(
        self,
        transcript: str,
        expected_response: str,
        expected_elements: list,
    ) -> tuple[ICAOScores, AIFeedback]:
        """
        Generate basic feedback using rule-based analysis.
        
        Used when OpenAI API is unavailable.
        """
        # Normalize for comparison
        transcript_lower = transcript.lower().strip()
        expected_lower = expected_response.lower().strip()
        
        # Check for expected elements
        elements_found = 0
        missing_elements = []
        
        for element in expected_elements:
            # Check if element or key words are present
            element_words = element.lower().split()
            found = any(word in transcript_lower for word in element_words)
            if found:
                elements_found += 1
            else:
                missing_elements.append(element)
        
        element_ratio = elements_found / len(expected_elements) if expected_elements else 0.5
        
        # Calculate basic similarity
        transcript_words = set(transcript_lower.split())
        expected_words = set(expected_lower.split())
        
        if expected_words:
            word_overlap = len(transcript_words & expected_words) / len(expected_words)
        else:
            word_overlap = 0.5
        
        # Generate scores based on heuristics
        base_score = 3.0 + (element_ratio * 2) + (word_overlap * 1)
        base_score = max(2.0, min(5.5, base_score))
        
        scores = ICAOScores(
            pronunciation=base_score,  # Can't assess pronunciation from text
            structure=base_score + 0.2 if "." in transcript or "," in transcript else base_score - 0.2,
            vocabulary=base_score + 0.3 if element_ratio > 0.7 else base_score - 0.3,
            fluency=base_score,  # Can't assess fluency from text
            comprehension=base_score + 0.5 if element_ratio > 0.5 else base_score - 0.5,
            interaction=base_score,
        )
        
        # Clamp scores to valid range
        for attr in ['pronunciation', 'structure', 'vocabulary', 'fluency', 'comprehension', 'interaction']:
            value = getattr(scores, attr)
            setattr(scores, attr, round(max(1.0, min(6.0, value)), 1))
        
        # Generate feedback
        strengths = []
        improvements = []
        
        if element_ratio > 0.7:
            strengths.append("Included most required elements in the response")
        if word_overlap > 0.5:
            strengths.append("Good use of standard aviation phraseology")
        if len(transcript) > 20:
            strengths.append("Provided a complete response")
        
        if missing_elements:
            improvements.append(f"Include missing elements: {', '.join(missing_elements[:2])}")
        if word_overlap < 0.5:
            improvements.append("Review standard phraseology for this scenario type")
        if not transcript_lower.endswith(tuple("callsign aircraft id".split())):
            improvements.append("Remember to include callsign at the end of readback")
        
        feedback = AIFeedback(
            summary=f"Response includes {elements_found}/{len(expected_elements)} expected elements.",
            strengths=strengths if strengths else ["Attempted the response"],
            improvements=improvements if improvements else ["Continue practicing this scenario type"],
            specific_corrections=[],
            pronunciation_notes=["Unable to assess pronunciation from transcript"],
            overall_assessment=(
                f"Your response covered {int(element_ratio * 100)}% of the expected elements. "
                f"Continue practicing to improve accuracy and fluency."
            ),
        )
        
        return scores, feedback


# Singleton instance
ai_feedback_service = AIFeedbackService()


# Convenience function
async def generate_speaking_feedback(
    transcript: str,
    expected_response: str,
    expected_elements: list,
    scenario_context: str = "",
    atc_prompt: str = "",
) -> tuple[ICAOScores, AIFeedback]:
    """Generate ICAO scores and feedback for a speaking submission."""
    return await ai_feedback_service.generate_feedback(
        transcript=transcript,
        expected_response=expected_response,
        expected_elements=expected_elements,
        scenario_context=scenario_context,
        atc_prompt=atc_prompt,
    )

