"""
ICAO Level Scoring Service

Calculates predicted ICAO levels based on user performance.
"""

from typing import Dict, Optional
from dataclasses import dataclass


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
        scores = [
            self.pronunciation,
            self.structure,
            self.vocabulary,
            self.fluency,
            self.comprehension,
            self.interaction
        ]
        return sum(scores) / len(scores)
    
    def minimum(self) -> float:
        """Get minimum score (ICAO level is based on lowest criteria)."""
        return min(
            self.pronunciation,
            self.structure,
            self.vocabulary,
            self.fluency,
            self.comprehension,
            self.interaction
        )
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary."""
        return {
            "pronunciation": self.pronunciation,
            "structure": self.structure,
            "vocabulary": self.vocabulary,
            "fluency": self.fluency,
            "comprehension": self.comprehension,
            "interaction": self.interaction
        }


def calculate_predicted_icao_level(
    vocabulary_mastery: float,  # 0-100%
    listening_average_score: float,  # 0-100%
    speaking_scores: Optional[ICAOScores] = None,
    weights: Optional[Dict[str, float]] = None
) -> float:
    """
    Calculate predicted ICAO level from performance data.
    
    Args:
        vocabulary_mastery: Percentage of vocabulary mastered
        listening_average_score: Average listening comprehension score
        speaking_scores: ICAO criteria scores from speaking practice
        weights: Optional custom weights for each factor
    
    Returns:
        Predicted ICAO level (1.0 to 6.0)
    """
    if weights is None:
        weights = {
            "vocabulary": 0.25,
            "listening": 0.25,
            "speaking": 0.50  # Speaking is weighted more heavily
        }
    
    # Convert percentages to 1-6 scale
    vocab_level = 1 + (vocabulary_mastery / 100) * 5
    listening_level = 1 + (listening_average_score / 100) * 5
    
    if speaking_scores:
        # ICAO level is based on lowest criteria score
        speaking_level = speaking_scores.minimum()
    else:
        # If no speaking data, use average of vocab and listening
        speaking_level = (vocab_level + listening_level) / 2
    
    # Weighted average
    predicted = (
        vocab_level * weights["vocabulary"] +
        listening_level * weights["listening"] +
        speaking_level * weights["speaking"]
    )
    
    # Clamp to valid range and round to 1 decimal
    predicted = max(1.0, min(6.0, predicted))
    return round(predicted, 1)


def get_level_description(level: float) -> str:
    """Get description for an ICAO level."""
    if level < 2:
        return "Pre-Elementary"
    elif level < 3:
        return "Elementary"
    elif level < 4:
        return "Pre-Operational"
    elif level < 5:
        return "Operational"
    elif level < 6:
        return "Extended"
    else:
        return "Expert"


def get_level_color(level: float) -> str:
    """Get color code for an ICAO level."""
    if level < 3:
        return "red"
    elif level < 4:
        return "amber"
    elif level < 5:
        return "green"
    elif level < 6:
        return "blue"
    else:
        return "purple"

