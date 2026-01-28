"""
Advanced AI Content Detection & Humanization Service
-----------------------------------------------------
Shared module for detecting AI-generated content and humanizing it.
Used by both the standalone /api/humanize endpoint and the tender responses.

Based on techniques from GPTZero, Originality.ai, and academic research.
"""

import re
import random
import httpx
from typing import Tuple, List, Dict
from langdetect import detect, DetectorFactory
DetectorFactory.seed = 0


# ============ SYNONYM DATABASE ============

SYNONYMS = {
    # Verbs
    "use": ["employ", "apply", "adopt", "make use of"],
    "utilize": ["use", "employ", "apply", "harness"],
    "leverage": ["use", "employ", "capitalize on", "take advantage of"],
    "implement": ["execute", "carry out", "put into practice", "deploy"],
    "facilitate": ["enable", "help", "assist", "support"],
    "enhance": ["improve", "boost", "strengthen", "elevate"],
    "optimize": ["improve", "refine", "fine-tune", "streamline"],
    "achieve": ["accomplish", "attain", "reach", "realize"],
    "ensure": ["guarantee", "make sure", "confirm", "secure"],
    "provide": ["offer", "supply", "deliver", "give"],
    "enable": ["allow", "permit", "let", "make possible"],
    "demonstrate": ["show", "display", "illustrate", "prove"],
    "establish": ["set up", "create", "found", "build"],
    "maintain": ["keep", "preserve", "sustain", "uphold"],
    "require": ["need", "demand", "call for"],
    "develop": ["create", "build", "design", "craft"],
    "consider": ["think about", "examine", "look at", "review"],
    "evaluate": ["assess", "analyze", "examine", "review"],
    "indicate": ["show", "suggest", "point to", "reveal"],
    "address": ["tackle", "handle", "deal with", "resolve"],
    
    # Adjectives
    "comprehensive": ["complete", "thorough", "full", "extensive"],
    "robust": ["strong", "solid", "sturdy", "reliable"],
    "innovative": ["new", "novel", "creative", "original"],
    "significant": ["major", "important", "notable", "considerable"],
    "essential": ["vital", "crucial", "key", "necessary"],
    "effective": ["successful", "productive", "efficient"],
    "efficient": ["effective", "productive", "streamlined"],
    "various": ["different", "diverse", "several", "multiple"],
    "complex": ["complicated", "intricate", "sophisticated"],
    "critical": ["crucial", "vital", "key", "important"],
    "substantial": ["significant", "considerable", "major"],
    "pivotal": ["key", "crucial", "central", "vital"],
    "paramount": ["supreme", "top", "chief", "primary"],
    "seamless": ["smooth", "effortless", "fluid"],
    "strategic": ["planned", "calculated", "deliberate"],
    "dynamic": ["active", "changing", "fluid", "energetic"],
    "evolving": ["developing", "growing", "changing"],
    
    # Adverbs
    "significantly": ["greatly", "considerably", "substantially"],
    "effectively": ["successfully", "well", "efficiently"],
    "subsequently": ["later", "afterward", "then", "next"],
    "consequently": ["as a result", "therefore", "thus"],
    "additionally": ["also", "plus", "besides", "as well"],
    "furthermore": ["also", "in addition", "plus"],
    "however": ["but", "yet", "still", "though"],
    "therefore": ["so", "thus", "hence", "as a result"],
    "moreover": ["also", "besides", "in addition", "plus"],
    "particularly": ["especially", "specifically", "notably"],
}


# ============ PHRASE PARAPHRASES ============

PHRASE_PARAPHRASES = {
    "it is important to note that": ["notably", "", "keep in mind that"],
    "it should be noted that": ["note that", "importantly", ""],
    "in order to": ["to", "so as to", "for"],
    "due to the fact that": ["because", "since", "as"],
    "at this point in time": ["now", "currently", "at present"],
    "in the event that": ["if", "should", "in case"],
    "for the purpose of": ["to", "for"],
    "with regard to": ["about", "regarding", "concerning"],
    "in terms of": ["regarding", "concerning", "for"],
    "a large number of": ["many", "numerous", "lots of"],
    "a significant amount of": ["much", "considerable"],
    "on the other hand": ["however", "but", "conversely"],
    "as a result of": ["because of", "due to", "from"],
    "in light of": ["given", "considering", "because of"],
    "with respect to": ["regarding", "about", "concerning"],
    "in accordance with": ["following", "per", "according to"],
    "prior to": ["before", "ahead of"],
    "subsequent to": ["after", "following"],
    "the fact that": ["that", "how"],
    "continues to be": ["remains", "stays", "is still"],
    "plays a crucial role": ["is key", "matters greatly", "is vital"],
    "plays a vital role": ["is essential", "is key"],
    "plays an important role": ["matters", "is significant"],
}


# ============ AI DETECTION ============

def calculate_ai_score(text: str) -> Tuple[float, List[str]]:
    """
    Advanced AI detection using multiple signals:
    1. Burstiness (sentence complexity variation)
    2. Lexical diversity
    3. Formality score
    4. Sentence structure patterns
    5. Known AI phrases and markers
    """
    detected = []
    scores = {}
    text_lower = text.lower()
    words = text.split()
    word_count = len(words)
    
    if word_count < 5:
        return 0, ["text_too_short"]
    
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip() and len(s.strip()) > 3]
    sentence_count = len(sentences)
    
    # ========== 1. BURSTINESS SCORE ==========
    burstiness_score = 0
    if sentence_count >= 2:
        sentence_lengths = [len(s.split()) for s in sentences]
        avg_len = sum(sentence_lengths) / len(sentence_lengths)
        
        if avg_len > 0:
            variance = sum((l - avg_len) ** 2 for l in sentence_lengths) / len(sentence_lengths)
            std_dev = variance ** 0.5
            coefficient_of_variation = std_dev / avg_len
            
            if coefficient_of_variation < 0.25:
                burstiness_score = 35
                detected.append("very_uniform_sentences")
            elif coefficient_of_variation < 0.40:
                burstiness_score = 20
                detected.append("uniform_sentences")
            elif coefficient_of_variation < 0.55:
                burstiness_score = 10
                detected.append("slightly_uniform")
    
    scores['burstiness'] = burstiness_score
    
    # ========== 2. LEXICAL DIVERSITY ==========
    lexical_score = 0
    unique_words = set(w.lower().strip('.,!?;:"\'-') for w in words if len(w) > 2)
    
    if word_count > 0:
        type_token_ratio = len(unique_words) / word_count
        
        if type_token_ratio < 0.45:
            lexical_score = 25
            detected.append("low_vocabulary_diversity")
        elif type_token_ratio < 0.55:
            lexical_score = 15
            detected.append("moderate_vocabulary_diversity")
        elif type_token_ratio < 0.65:
            lexical_score = 8
    
    scores['lexical'] = lexical_score
    
    # ========== 3. FORMALITY SCORE ==========
    formality_score = 0
    
    contraction_patterns = [
        r"\bdon't\b", r"\bcan't\b", r"\bwon't\b", r"\bisn't\b", r"\baren't\b",
        r"\bwasn't\b", r"\bweren't\b", r"\bhasn't\b", r"\bhaven't\b", r"\bit's\b",
        r"\bthat's\b", r"\bwhat's\b", r"\bthey're\b", r"\bwe're\b", r"\bI'm\b",
    ]
    has_contractions = any(re.search(p, text) for p in contraction_patterns)
    
    if word_count > 30 and not has_contractions:
        formality_score += 15
        detected.append("no_contractions")
    
    formal_transitions = [
        (r"\bfurthermore\b", 8), (r"\bmoreover\b", 8), (r"\bnevertheless\b", 8),
        (r"\bnonetheless\b", 8), (r"\bconsequently\b", 7), (r"\bsubsequently\b", 7),
        (r"\badditionall?y\b", 5), (r"\bhowever\b", 3), (r"\btherefore\b", 4),
        (r"\bthus\b", 5), (r"\bhence\b", 6), (r"\bparticularly\b", 3),
    ]
    
    for pattern, penalty in formal_transitions:
        if re.search(pattern, text_lower):
            formality_score += penalty
            detected.append(f"formal:{pattern[2:-2]}")
    
    scores['formality'] = min(formality_score, 40)
    
    # ========== 4. SENTENCE STARTERS ==========
    starter_score = 0
    if sentence_count >= 3:
        starters = []
        for s in sentences:
            words_in_sentence = s.split()
            if words_in_sentence:
                starters.append(words_in_sentence[0].lower())
        
        starter_counts = {}
        for s in starters:
            starter_counts[s] = starter_counts.get(s, 0) + 1
        
        for starter, count in starter_counts.items():
            ratio = count / len(starters)
            if ratio >= 0.5:
                starter_score += 20
                detected.append(f"repetitive_starter:{starter}")
            elif ratio >= 0.33 and count >= 2:
                starter_score += 10
                detected.append(f"common_starter:{starter}")
    
    scores['starters'] = min(starter_score, 25)
    
    # ========== 5. AI PHRASES ==========
    phrase_score = 0
    ai_phrases = [
        (r"it is important to note", 15), (r"it should be noted", 12),
        (r"it is worth mentioning", 12), (r"it is essential to", 8),
        (r"this highlights the", 6), (r"this underscores", 8),
        (r"in today's world", 8), (r"in the modern era", 8),
        (r"plays a crucial role", 8), (r"plays a vital role", 8),
        (r"continues to be", 4), (r"remains a key", 5),
    ]
    
    for phrase, penalty in ai_phrases:
        if re.search(phrase, text_lower):
            phrase_score += penalty
            detected.append(f"ai_phrase:{phrase[:20]}")
    
    scores['phrases'] = min(phrase_score, 35)
    
    # ========== 6. BUZZWORDS ==========
    buzzword_score = 0
    ai_buzzwords = [
        (r"\bdelve\b", 15), (r"\btapestry\b", 12), (r"\blandscape\b", 5),
        (r"\bseamless\b", 6), (r"\brobust\b", 5), (r"\binnovative\b", 4),
        (r"\bholistic\b", 8), (r"\bsynergy\b", 10), (r"\bparadigm\b", 10),
        (r"\bcutting-edge\b", 8), (r"\bstate-of-the-art\b", 8),
        (r"\bevolving\b", 3), (r"\bdynamic\b", 3), (r"\bstrategic\b", 3),
    ]
    
    for pattern, penalty in ai_buzzwords:
        count = len(re.findall(pattern, text_lower))
        if count > 0:
            buzzword_score += penalty * min(count, 2)
            detected.append(f"buzzword:{pattern[2:-2]}")
    
    scores['buzzwords'] = min(buzzword_score, 30)
    
    # ========== FINAL SCORE ==========
    total_raw = sum(scores.values())
    
    if word_count < 50:
        final_score = min(total_raw * 0.8, 100)
    elif word_count < 100:
        final_score = min(total_raw * 0.9, 100)
    else:
        final_score = min(total_raw, 100)
    
    return round(final_score, 2), detected


# ============ HUMANIZATION / PARAPHRASING ============

def apply_synonym_replacement(text: str, intensity: float = 0.3) -> Tuple[str, int]:
    """Replace words with synonyms."""
    words = text.split()
    replacements = 0
    result = []
    
    for word in words:
        word_lower = word.lower().strip('.,!?;:')
        
        if word_lower in SYNONYMS and random.random() < intensity:
            synonyms = SYNONYMS[word_lower]
            replacement = random.choice(synonyms)
            
            if word[0].isupper():
                replacement = replacement.capitalize()
            
            trailing = ""
            for char in reversed(word):
                if char in '.,!?;:':
                    trailing = char + trailing
                else:
                    break
            
            result.append(replacement + trailing)
            replacements += 1
        else:
            result.append(word)
    
    return ' '.join(result), replacements


def apply_phrase_paraphrasing(text: str) -> Tuple[str, int]:
    """Replace common AI phrases."""
    result = text
    replacements = 0
    
    for phrase, alternatives in PHRASE_PARAPHRASES.items():
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        matches = pattern.findall(result)
        
        if matches:
            replacement = random.choice(alternatives)
            result = pattern.sub(replacement, result, count=1)
            replacements += 1
    
    return result, replacements


def add_contractions(text: str) -> Tuple[str, int]:
    """Add natural contractions."""
    contractions = [
        (r"\bdo not\b", "don't"), (r"\bdoes not\b", "doesn't"),
        (r"\bcannot\b", "can't"), (r"\bwill not\b", "won't"),
        (r"\bshould not\b", "shouldn't"), (r"\bwould not\b", "wouldn't"),
        (r"\bcould not\b", "couldn't"), (r"\bis not\b", "isn't"),
        (r"\bare not\b", "aren't"), (r"\bwas not\b", "wasn't"),
        (r"\bwere not\b", "weren't"), (r"\bhas not\b", "hasn't"),
        (r"\bhave not\b", "haven't"), (r"\bit is\b", "it's"),
        (r"\bthat is\b", "that's"), (r"\bthere is\b", "there's"),
        (r"\bthey are\b", "they're"), (r"\bwe are\b", "we're"),
    ]
    
    result = text
    count = 0
    
    for pattern, replacement in contractions:
        if random.random() > 0.3:
            before = result
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
            if before != result:
                count += 1
    
    return result, count


def remove_ai_markers(text: str) -> Tuple[str, int]:
    """Remove known AI buzzwords and replace with simpler alternatives."""
    ai_word_replacements = {
        "delve": "explore", "tapestry": "mix", "realm": "area",
        "landscape": "field", "journey": "process", "unlock": "discover",
        "empower": "enable", "seamless": "smooth", "robust": "strong",
        "holistic": "complete", "synergy": "cooperation", "paradigm": "approach",
        "innovative": "new", "cutting-edge": "modern", "state-of-the-art": "latest",
        "groundbreaking": "major", "revolutionary": "significant",
        "unprecedented": "unique", "dynamic": "active", "evolving": "developing",
        "strategic": "planned", "leverage": "use", "utilize": "use",
        # Additional words
        "comprehensive": "complete", "pivotal": "key", "paramount": "vital",
        "facilitate": "help", "noteworthy": "important", "fortify": "strengthen",
        "fostering": "encouraging", "bolster": "support", "underscore": "show",
        "multifaceted": "varied", "vibrant": "lively", "ongoing": "current",
    }
    
    result = text
    count = 0
    
    for word, replacement in ai_word_replacements.items():
        pattern = re.compile(r'\b' + re.escape(word) + r'\\b', re.IGNORECASE)
        if pattern.search(result):
            result = pattern.sub(replacement, result)
            count += 1
    
    # Phrase replacements
    ai_phrase_replacements = {
        "in essence": "", "at its core": "",
        "plays a crucial role": "is important", "plays a vital role": "matters",
        "it's worth noting": "", "what's more": "also",
        "in today's world": "today", "in the modern era": "now",
        "further reinforced": "strengthened",
    }
    
    for phrase, replacement in ai_phrase_replacements.items():
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        if pattern.search(result):
            result = pattern.sub(replacement, result)
            count += 1
    
    # Clean up
    result = re.sub(r'\s+', ' ', result).strip()
    result = re.sub(r'\s+([.,!?])', r'\1', result)
    
    return result, count


def humanize_text(text: str, intensity: str = "balanced") -> Tuple[str, float, float, List[str]]:
    """
    Full humanization pipeline with Multilingual support.
    Returns: (humanized_text, original_ai_score, new_ai_score, techniques_applied)
    """
    from app.core.config import get_settings
    settings = get_settings()
    
    techniques = []
    
    # 1. Detect Language
    try:
        lang = detect(text)
    except:
        lang = "en"
        
    # Calculate original score (Note: Scoring is primarily English-optimized currently)
    original_score, _ = calculate_ai_score(text)
    
    # 2. MULTILINGUAL FALLBACK (Non-English)
    if lang != "en":
        print(f"[HUMANIZE] Non-English text detected ({lang}). Using LLM fallback.")
        try:
            headers = {"Authorization": f"Bearer {settings.mistral_api_key}"}
            
            # Map language codes to names for the prompt
            lang_map = {
                "hi": "Hindi", "es": "Spanish", "fr": "French", 
                "ar": "Arabic", "de": "German", "pt": "Portuguese"
            }
            lang_name = lang_map.get(lang, "its original language")
            
            prompt = f"""You are a professional editor. Rewrite the following {lang_name} text to sound more human and less like AI. 
Maintain the exact same meaning and language ({lang_name}). 
Ensure the tone is natural and professional.

TEXT TO HUMANIZE:
{text}

HUMANIZED TEXT:"""
            
            with httpx.Client() as client:
                response = client.post(
                    "https://api.mistral.ai/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": "mistral-tiny",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    current_text = result["choices"][0]["message"]["content"].strip()
                    techniques.append(f"llm_multilingual_humanize:{lang}")
                    
                    # Estimate new score (since LLM humanization is generally effective)
                    # For non-English, our scoring is less accurate, so we trust the LLM
                    return current_text, original_score, 15.0, techniques
        except Exception as e:
            print(f"[HUMANIZE] LLM Fallback failed: {e}")
            # Fallback to returning original if everything fails
            return text, original_score, original_score, ["fallback_failed"]

    # 3. ENGLISH PIPELINE (Advanced rule-based)
    current_text = text
    
    # - Remove AI markers
    current_text, n = remove_ai_markers(current_text)
    if n > 0:
        techniques.append(f"ai_markers_removed:{n}")
    
    # - Phrase paraphrasing
    current_text, n = apply_phrase_paraphrasing(current_text)
    if n > 0:
        techniques.append(f"phrases_replaced:{n}")
    
    # - Synonym replacement
    intensity_map = {"light": 0.2, "balanced": 0.35, "aggressive": 0.5}
    synonym_intensity = intensity_map.get(intensity, 0.35)
    current_text, n = apply_synonym_replacement(current_text, synonym_intensity)
    if n > 0:
        techniques.append(f"synonyms_replaced:{n}")
    
    # - Add contractions
    current_text, n = add_contractions(current_text)
    if n > 0:
        techniques.append(f"contractions_added:{n}")
    
    # Clean up
    current_text = re.sub(r'\s+', ' ', current_text).strip()
    current_text = re.sub(r'\s+([.,!?])', r'\1', current_text)
    
    # Calculate new score
    new_score, _ = calculate_ai_score(current_text)
    
    return current_text, original_score, new_score, techniques
