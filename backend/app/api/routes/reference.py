"""
Reference API Routes

Endpoints for reference content:
- GET /reference/phonetic-alphabet - ICAO phonetic alphabet
- GET /reference/number-pronunciation - Aviation number pronunciation  
- GET /reference/cis-tips - Common CIS pronunciation errors and tips
- GET /reference/icao-levels - ICAO level descriptions
"""

from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter()


# =============================================================================
# Schemas
# =============================================================================

class PhoneticLetter(BaseModel):
    """ICAO phonetic alphabet letter."""
    letter: str
    word: str
    phonetic: str
    cis_tip: str


class PhoneticNumber(BaseModel):
    """ICAO number pronunciation."""
    number: str
    word: str
    phonetic: str
    cis_tip: str


class CISPronunciationError(BaseModel):
    """Common CIS pronunciation error."""
    error_type: str
    examples: List[str]
    explanation: str
    practice_words: List[str]


class ICAOLevel(BaseModel):
    """ICAO level description."""
    level: int
    name: str
    description: str
    characteristics: List[str]
    color: str


class PhoneticAlphabetResponse(BaseModel):
    """Complete phonetic alphabet response."""
    letters: List[PhoneticLetter]
    numbers: List[PhoneticNumber]
    special: List[PhoneticNumber]


class CISTipsResponse(BaseModel):
    """CIS pronunciation tips response."""
    pronunciation_errors: List[CISPronunciationError]
    general_tips: List[str]
    practice_sentences: List[str]


class ICAOLevelsResponse(BaseModel):
    """ICAO levels description response."""
    levels: List[ICAOLevel]
    minimum_operational: int
    description: str


# =============================================================================
# Data
# =============================================================================

PHONETIC_LETTERS = [
    {"letter": "A", "word": "Alpha", "phonetic": "/ˈælfə/", "cis_tip": "AL-fah, not 'alfa'"},
    {"letter": "B", "word": "Bravo", "phonetic": "/ˈbrɑːvoʊ/", "cis_tip": "BRAH-voh, not 'bravo'"},
    {"letter": "C", "word": "Charlie", "phonetic": "/ˈtʃɑːrli/", "cis_tip": "CHAR-lee"},
    {"letter": "D", "word": "Delta", "phonetic": "/ˈdeltə/", "cis_tip": "DEL-tah"},
    {"letter": "E", "word": "Echo", "phonetic": "/ˈekoʊ/", "cis_tip": "EK-oh"},
    {"letter": "F", "word": "Foxtrot", "phonetic": "/ˈfɒkstrɒt/", "cis_tip": "FOKS-trot"},
    {"letter": "G", "word": "Golf", "phonetic": "/ɡɒlf/", "cis_tip": "GOLF"},
    {"letter": "H", "word": "Hotel", "phonetic": "/hoʊˈtel/", "cis_tip": "hoh-TEL, stress on second syllable"},
    {"letter": "I", "word": "India", "phonetic": "/ˈɪndiə/", "cis_tip": "IN-dee-ah"},
    {"letter": "J", "word": "Juliet", "phonetic": "/ˈdʒuːliˌet/", "cis_tip": "JOO-lee-et"},
    {"letter": "K", "word": "Kilo", "phonetic": "/ˈkiːloʊ/", "cis_tip": "KEE-loh"},
    {"letter": "L", "word": "Lima", "phonetic": "/ˈliːmə/", "cis_tip": "LEE-mah"},
    {"letter": "M", "word": "Mike", "phonetic": "/maɪk/", "cis_tip": "MIKE"},
    {"letter": "N", "word": "November", "phonetic": "/noʊˈvembər/", "cis_tip": "noh-VEM-ber"},
    {"letter": "O", "word": "Oscar", "phonetic": "/ˈɒskər/", "cis_tip": "OSS-kar"},
    {"letter": "P", "word": "Papa", "phonetic": "/pəˈpɑː/", "cis_tip": "pah-PAH, stress on second"},
    {"letter": "Q", "word": "Quebec", "phonetic": "/kəˈbek/", "cis_tip": "keh-BEK"},
    {"letter": "R", "word": "Romeo", "phonetic": "/ˈroʊmioʊ/", "cis_tip": "ROH-mee-oh"},
    {"letter": "S", "word": "Sierra", "phonetic": "/siˈerə/", "cis_tip": "see-ERR-ah"},
    {"letter": "T", "word": "Tango", "phonetic": "/ˈtæŋɡoʊ/", "cis_tip": "TANG-goh"},
    {"letter": "U", "word": "Uniform", "phonetic": "/ˈjuːnɪfɔːrm/", "cis_tip": "YOO-nee-form"},
    {"letter": "V", "word": "Victor", "phonetic": "/ˈvɪktər/", "cis_tip": "VIK-ter"},
    {"letter": "W", "word": "Whiskey", "phonetic": "/ˈwɪski/", "cis_tip": "WISS-kee, start with W not V"},
    {"letter": "X", "word": "X-ray", "phonetic": "/ˈeksreɪ/", "cis_tip": "EKS-ray"},
    {"letter": "Y", "word": "Yankee", "phonetic": "/ˈjæŋki/", "cis_tip": "YANG-kee"},
    {"letter": "Z", "word": "Zulu", "phonetic": "/ˈzuːluː/", "cis_tip": "ZOO-loo"},
]

PHONETIC_NUMBERS = [
    {"number": "0", "word": "Zero", "phonetic": "/ˈzɪəroʊ/", "cis_tip": "ZEE-roh"},
    {"number": "1", "word": "One", "phonetic": "/wʌn/", "cis_tip": "WUN, start with W"},
    {"number": "2", "word": "Two", "phonetic": "/tuː/", "cis_tip": "TOO"},
    {"number": "3", "word": "Tree", "phonetic": "/triː/", "cis_tip": "TREE, not 'three' - practice TH→TR"},
    {"number": "4", "word": "Fower", "phonetic": "/ˈfoʊər/", "cis_tip": "FOW-er, two syllables"},
    {"number": "5", "word": "Fife", "phonetic": "/faɪf/", "cis_tip": "FIFE, not 'five'"},
    {"number": "6", "word": "Six", "phonetic": "/sɪks/", "cis_tip": "SIX"},
    {"number": "7", "word": "Seven", "phonetic": "/ˈsevən/", "cis_tip": "SEV-en"},
    {"number": "8", "word": "Eight", "phonetic": "/eɪt/", "cis_tip": "AIT"},
    {"number": "9", "word": "Niner", "phonetic": "/ˈnaɪnər/", "cis_tip": "NINE-er, not just 'nine'"},
]

PHONETIC_SPECIAL = [
    {"number": "100", "word": "Hundred", "phonetic": "/ˈhʌndrəd/", "cis_tip": "HUN-dred"},
    {"number": "1000", "word": "Thousand", "phonetic": "/ˈθaʊzənd/", "cis_tip": "THOU-zand, practice TH"},
    {"number": ".", "word": "Decimal", "phonetic": "/ˈdesɪməl/", "cis_tip": "DES-i-mal"},
]

CIS_PRONUNCIATION_ERRORS = [
    {
        "error_type": "TH sounds",
        "examples": ["three→tree (correct in aviation)", "think→sink", "the→ze", "weather→veather"],
        "explanation": "Russian has no TH sound. In aviation, 'three' is pronounced 'tree' which actually helps!",
        "practice_words": ["thousand", "this", "that", "weather", "thermal", "thrust"]
    },
    {
        "error_type": "W vs V confusion",
        "examples": ["west→vest", "wind→vind", "runway→runvay"],
        "explanation": "Russian W sounds like V. Practice: lips round for W, teeth touch lip for V.",
        "practice_words": ["wind", "west", "whiskey", "waypoint", "wilco", "weather"]
    },
    {
        "error_type": "Long vs short vowels",
        "examples": ["ship/sheep", "bit/beat", "pull/pool"],
        "explanation": "Russian doesn't distinguish vowel length. Can change word meaning.",
        "practice_words": ["feet/fit", "leave/live", "heat/hit"]
    },
    {
        "error_type": "Word stress",
        "examples": ["turbulence (TUR-bu-lence not tur-BU-lence)", "maintain (main-TAIN not MAIN-tain)"],
        "explanation": "English stress patterns differ from Russian. Stress wrong syllable = hard to understand.",
        "practice_words": ["departure", "approach", "emergency", "altitude", "helicopter"]
    },
    {
        "error_type": "Final consonant devoicing",
        "examples": ["bad→bat", "dog→dock", "five→fife (correct in aviation!)"],
        "explanation": "Russian devoices final consonants. In English this changes meaning.",
        "practice_words": ["rub/rup", "dog/dock", "bag/back"]
    },
    {
        "error_type": "H sound",
        "examples": ["hotel→otel", "heading→eading", "hold→old"],
        "explanation": "H is often dropped or made too guttural. Should be soft breath.",
        "practice_words": ["heading", "hold", "helicopter", "hundred", "heavy"]
    },
]

CIS_GENERAL_TIPS = [
    "Practice the W sound separately - round your lips like you're going to whistle",
    "In aviation, 'three' becomes 'tree' - this actually helps CIS speakers!",
    "Listen to native ATC recordings at slow speed to internalize rhythm",
    "Record yourself and compare to native speakers",
    "Focus on clarity over speed - controllers prefer slow and clear",
    "Master the numbers first - they appear in almost every transmission",
]

CIS_PRACTICE_SENTENCES = [
    "Whiskey Alpha Zulu, wind 270 at 15, cleared for takeoff runway 27.",
    "Roger, holding at waypoint TIGER, maintain flight level 350.",
    "Mayday, mayday, mayday. Engine fire, returning to the field.",
    "Request weather deviation 30 miles right of track.",
    "Speedbird 178, descend flight level 160, when passing 180 set QNH 1013.",
    "Line up and wait runway 09, traffic on final.",
]

ICAO_LEVELS = [
    {
        "level": 1,
        "name": "Pre-Elementary",
        "description": "Performs at a level below the Elementary level.",
        "characteristics": [
            "Unable to function in English",
            "Cannot produce basic phrases",
            "No comprehension ability"
        ],
        "color": "red"
    },
    {
        "level": 2,
        "name": "Elementary",
        "description": "Able to communicate on common, concrete topics.",
        "characteristics": [
            "Limited to isolated memorized phrases",
            "Frequent communication breakdowns",
            "Requires significant listener effort"
        ],
        "color": "red"
    },
    {
        "level": 3,
        "name": "Pre-Operational",
        "description": "Communicates effectively in routine situations.",
        "characteristics": [
            "Basic grammar errors frequently impede communication",
            "Vocabulary limited to routine topics",
            "Hesitant speech with limited fluency"
        ],
        "color": "amber"
    },
    {
        "level": 4,
        "name": "Operational",
        "description": "The minimum required level for international operations.",
        "characteristics": [
            "Communicates effectively in most situations",
            "Basic structures used correctly",
            "Handles unexpected situations adequately",
            "Can clarify and confirm communications"
        ],
        "color": "green"
    },
    {
        "level": 5,
        "name": "Extended",
        "description": "Wide range of communicative abilities.",
        "characteristics": [
            "Able to paraphrase successfully",
            "Complex grammar used appropriately",
            "Natural and appropriate speech flow",
            "Rarely needs clarification"
        ],
        "color": "blue"
    },
    {
        "level": 6,
        "name": "Expert",
        "description": "Native or very high-level non-native proficiency.",
        "characteristics": [
            "Uses language and dialect effectively",
            "Precise and accurate at all times",
            "Completely natural fluency",
            "Expert-level comprehension"
        ],
        "color": "purple"
    },
]


# =============================================================================
# Endpoints
# =============================================================================

@router.get(
    "/phonetic-alphabet",
    response_model=PhoneticAlphabetResponse,
    summary="ICAO Phonetic Alphabet",
    description="Get the complete ICAO phonetic alphabet with pronunciation tips."
)
async def get_phonetic_alphabet():
    """
    Get the ICAO phonetic alphabet.
    
    Returns:
    - Letters A-Z with word, IPA phonetic, and CIS pronunciation tips
    - Numbers 0-9 with aviation pronunciation
    - Special terms (hundred, thousand, decimal)
    """
    return PhoneticAlphabetResponse(
        letters=[PhoneticLetter(**l) for l in PHONETIC_LETTERS],
        numbers=[PhoneticNumber(**n) for n in PHONETIC_NUMBERS],
        special=[PhoneticNumber(**s) for s in PHONETIC_SPECIAL],
    )


@router.get(
    "/number-pronunciation",
    response_model=List[PhoneticNumber],
    summary="Aviation Number Pronunciation",
    description="Get aviation-specific number pronunciation."
)
async def get_number_pronunciation():
    """
    Get aviation number pronunciation.
    
    Note: Aviation uses modified pronunciation for clarity:
    - 3 → "Tree" (avoids confusion with TH sound)
    - 4 → "Fower" (two syllables for clarity)
    - 5 → "Fife" (distinct from 'nine')
    - 9 → "Niner" (distinct from 'five')
    """
    all_numbers = PHONETIC_NUMBERS + PHONETIC_SPECIAL
    return [PhoneticNumber(**n) for n in all_numbers]


@router.get(
    "/cis-tips",
    response_model=CISTipsResponse,
    summary="CIS Pronunciation Tips",
    description="Get pronunciation tips for CIS (Russian-speaking) pilots."
)
async def get_cis_tips():
    """
    Get pronunciation tips specifically for CIS pilots.
    
    Covers common pronunciation errors for Russian speakers:
    - TH sounds
    - W vs V confusion
    - Vowel length
    - Word stress
    - Final consonant devoicing
    - H sound
    
    Plus practice sentences and general tips.
    """
    return CISTipsResponse(
        pronunciation_errors=[CISPronunciationError(**e) for e in CIS_PRONUNCIATION_ERRORS],
        general_tips=CIS_GENERAL_TIPS,
        practice_sentences=CIS_PRACTICE_SENTENCES,
    )


@router.get(
    "/icao-levels",
    response_model=ICAOLevelsResponse,
    summary="ICAO Level Descriptions",
    description="Get descriptions of all ICAO language proficiency levels."
)
async def get_icao_levels():
    """
    Get descriptions of ICAO language proficiency levels 1-6.
    
    Level 4 (Operational) is the minimum required for international operations.
    """
    return ICAOLevelsResponse(
        levels=[ICAOLevel(**l) for l in ICAO_LEVELS],
        minimum_operational=4,
        description=(
            "ICAO Language Proficiency Requirements (LPRs) ensure pilots and air traffic controllers "
            "can communicate effectively in English. Level 4 (Operational) is the minimum required "
            "for international flight operations. Levels are assessed on six criteria: Pronunciation, "
            "Structure, Vocabulary, Fluency, Comprehension, and Interaction."
        ),
    )


@router.get(
    "/emergency-codes",
    summary="Emergency Transponder Codes",
    description="Get emergency squawk codes and their meanings."
)
async def get_emergency_codes():
    """
    Get emergency transponder (squawk) codes.
    
    These are critical codes that pilots must memorize.
    """
    return {
        "codes": [
            {
                "code": "7500",
                "meaning": "Hijack",
                "pronunciation": "Seven Five Hundred",
                "action": "Squawk silently - do NOT announce on radio",
                "mnemonic": "Seven-five, man with knife"
            },
            {
                "code": "7600",
                "meaning": "Radio Failure (NORDO)",
                "pronunciation": "Seven Six Hundred",
                "action": "Follow lost communication procedures",
                "mnemonic": "Seven-six, radio needs a fix"
            },
            {
                "code": "7700",
                "meaning": "General Emergency",
                "pronunciation": "Seven Seven Hundred",
                "action": "Declare emergency on radio: Mayday or Pan-Pan",
                "mnemonic": "Seven-seven, going to heaven"
            },
        ],
        "tip": "Remember: 75-76-77 = Hijack-Radio-Emergency (ascending order of pilot control)"
    }


@router.get(
    "/standard-phrases",
    summary="Essential Standard Phrases",
    description="Get list of essential standard ATC phrases."
)
async def get_standard_phrases():
    """
    Get essential standard ATC phrases that every pilot must know.
    """
    return {
        "acknowledgment": [
            {"phrase": "Affirm", "meaning": "Yes, that is correct", "note": "Use instead of 'yes'"},
            {"phrase": "Negative", "meaning": "No / Permission not granted", "note": "Use instead of 'no'"},
            {"phrase": "Roger", "meaning": "I have received your message", "note": "Does NOT mean 'yes' or 'I will comply'"},
            {"phrase": "Wilco", "meaning": "I will comply", "note": "Includes 'roger' - don't say both"},
        ],
        "clarification": [
            {"phrase": "Say again", "meaning": "Repeat your last transmission", "note": "Never use 'repeat'"},
            {"phrase": "Standby", "meaning": "Wait - I will call you", "note": "No response required"},
            {"phrase": "Confirm", "meaning": "Verify that...", "note": "Used to check information"},
        ],
        "action": [
            {"phrase": "Cleared", "meaning": "Authorized to...", "note": "Must be in every clearance"},
            {"phrase": "Unable", "meaning": "I cannot comply", "note": "Always give reason"},
            {"phrase": "Request", "meaning": "I would like...", "note": "Polite way to ask"},
        ],
        "position": [
            {"phrase": "Hold short", "meaning": "Stop before the specified point", "note": "Critical - always read back"},
            {"phrase": "Line up and wait", "meaning": "Enter runway, wait for takeoff clearance", "note": "Formerly 'position and hold'"},
            {"phrase": "Go around", "meaning": "Abort landing, climb away", "note": "Immediate action required"},
        ],
    }

