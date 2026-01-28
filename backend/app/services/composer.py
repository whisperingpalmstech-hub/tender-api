"""
Response Composer Service
Generates draft responses using KB content and minimal LLM assistance
Enforces AI content percentage limits using advanced detection
"""
import re
import httpx
from langdetect import detect, DetectorFactory
DetectorFactory.seed = 0 # Consistent detection
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

from app.core.config import get_settings
from app.services.matcher import get_matcher, MatchResult
from app.services.ai_detector import (
    calculate_ai_score,
    humanize_text,
    apply_phrase_paraphrasing,
    add_contractions,
    remove_ai_markers
)

settings = get_settings()


@dataclass
class ProvenanceItem:
    start: int
    end: int
    source: str  # "KNOWLEDGE_BASE" or "AI_GENERATED"
    kb_item_id: Optional[str] = None


@dataclass
class ComposedResponse:
    text: str
    provenance: List[ProvenanceItem]
    kb_percentage: float
    ai_percentage: float


class ResponseComposer:
    """Compose responses from KB content with minimal AI assistance."""
    
    def __init__(self):
        self.matcher = get_matcher()
        self.mistral_url = settings.mistral_api_url
        self.max_ai_percentage = settings.max_ai_percentage
        self.max_attempts = settings.max_regeneration_attempts
        
        # AI phrases to avoid
        self.ai_patterns = [
            r"it is important to note that",
            r"furthermore",
            r"in conclusion",
            r"as mentioned earlier",
            r"it should be noted",
            r"in order to",
            r"utilize",
            r"leverage",
            r"facilitate",
            r"implement",
            r"comprehensive",
            r"robust",
            r"seamless",
            r"cutting-edge",
            r"state-of-the-art",
        ]
        
        # Replacement mappings
        self.replacements = {
            "utilize": "use",
            "leverage": "use",
            "facilitate": "help",
            "implement": "set up",
            "furthermore": "also",
            "in order to": "to",
            "it is important to note that": "",
            "it should be noted that": "",
        }
    
    async def compose(
        self,
        requirement: str,
        matches: List[MatchResult],
        style: str = "professional",
        mode: str = "balanced",
        tone: str = "professional"
    ) -> ComposedResponse:
        """Compose professional tender response from matched KB content."""
        
        print(f"[COMPOSER] Composing for: {requirement[:50]}...")
        print(f"[COMPOSER] Matches received: {len(matches)}")
        
        if not matches:
            print("[COMPOSER] No matches, using minimal response")
            return await self._generate_minimal_response(requirement)
        
        # Select best KB content
        kb_content = self._select_kb_content(matches)
        print(f"[COMPOSER] KB content selected: {len(kb_content)} items")
        
        if not kb_content:
            print("[COMPOSER] No KB content after selection, using minimal")
            return await self._generate_minimal_response(requirement)
        
        # Extract only the most relevant sentences from KB content
        relevant_text = self._extract_relevant_content(requirement, kb_content)
        print(f"[COMPOSER] Extracted relevant text: {len(relevant_text)} chars")
        
        # If we have good KB content, try LLM refinement first
        if len(relevant_text) >= 30:
            # Try to refine with LLM if available (keeping under 30% AI)
            refined = await self._refine_for_tender(requirement, relevant_text, mode=mode, tone=tone)
            if refined:
                print("[COMPOSER] Using LLM-refined response")
                return refined # _refine_for_tender already calls _humanize
        
        # Fallback: Use extracted relevant text directly (no connectors needed for single source)
        print("[COMPOSER] Using extracted text directly (no LLM)")
        
        # Just return the relevant extracted sentences
        if relevant_text and len(relevant_text) >= 20:
            composed = ComposedResponse(
                text=relevant_text,
                provenance=[ProvenanceItem(0, len(relevant_text), "KNOWLEDGE_BASE", kb_content[0]['id'])],
                kb_percentage=100,
                ai_percentage=0
            )
            return self._humanize(composed, mode=mode)
        
        # Final fallback: KB-only response (first 2 sentences)
        kb_only = self._compose_kb_only(kb_content, matches)
        return self._humanize(kb_only, mode=mode)
    
    def _select_kb_content(self, matches: List[MatchResult]) -> List[Dict]:
        """Select best KB content for response - focused and minimal."""
        selected = []
        
        # Only use the BEST match (top 1) for focused responses
        for match in matches[:1]:  # Changed from 3 to 1
            if match.score > 0.2:  # Lowered threshold for better coverage
                selected.append({
                    'id': match.kb_item_id,
                    'content': match.content,
                    'score': match.score
                })
        
        return selected
    
    async def _compose_with_connectors(
        self,
        requirement: str,
        kb_content: List[Dict],
        max_tokens: int,
        style: str
    ) -> ComposedResponse:
        """Compose response with AI-generated connectors."""
        
        if len(kb_content) == 1:
            # Single KB item, minimal connector needed
            return await self._compose_single(kb_content[0], requirement, max_tokens)
        
        # Multiple KB items, need connectors
        provenance = []
        response_text = ""
        
        for i, content in enumerate(kb_content):
            # Add KB content
            start = len(response_text)
            response_text += content['content']
            provenance.append(ProvenanceItem(
                start=start,
                end=len(response_text),
                source="KNOWLEDGE_BASE",
                kb_item_id=content['id']
            ))
            
            # Add connector between sections
            if i < len(kb_content) - 1:
                connector = await self._generate_connector(
                    content['content'],
                    kb_content[i + 1]['content'],
                    max_tokens // len(kb_content)
                )
                
                if connector:
                    start = len(response_text)
                    response_text += f" {connector} "
                    provenance.append(ProvenanceItem(
                        start=start,
                        end=len(response_text),
                        source="AI_GENERATED"
                    ))
        
        # Calculate percentages
        kb_pct, ai_pct = self._calculate_percentages(response_text, provenance)
        
        return ComposedResponse(
            text=response_text,
            provenance=provenance,
            kb_percentage=kb_pct,
            ai_percentage=ai_pct
        )
    
    async def _compose_single(
        self,
        kb_item: Dict,
        requirement: str,
        max_tokens: int
    ) -> ComposedResponse:
        """Compose response from single KB item."""
        
        # Start with KB content
        provenance = [
            ProvenanceItem(
                start=0,
                end=len(kb_item['content']),
                source="KNOWLEDGE_BASE",
                kb_item_id=kb_item['id']
            )
        ]
        
        response_text = kb_item['content']
        
        # Calculate percentages
        kb_pct, ai_pct = self._calculate_percentages(response_text, provenance)
        
        return ComposedResponse(
            text=response_text,
            provenance=provenance,
            kb_percentage=kb_pct,
            ai_percentage=ai_pct
        )
    
    async def _generate_connector(
        self,
        before: str,
        after: str,
        max_tokens: int
    ) -> str:
        """Generate minimal connective text between sections."""
        
        # Skip LLM if not configured (placeholder check)
        if "api.mistral.ai" in self.mistral_url and not settings.mistral_api_key:
             return "Additionally,"

        prompt = f"""Connect these two paragraphs with a brief transition (max 20 words).
Do not add new information. Only add a transitional phrase.

Paragraph 1: {before[-200:]}

Paragraph 2: {after[:200]}

Transition:"""

        headers = {}
        if settings.mistral_api_key:
            headers["Authorization"] = f"Bearer {settings.mistral_api_key}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Fix: Mistral API uses /v1/chat/completions usually, but let's stick to user config
                # If using official API, we need chat/completions structure or compatible endpoint
                
                endpoint = f"{self.mistral_url}/v1/chat/completions" if "api.mistral.ai" in self.mistral_url else f"{self.mistral_url}/v1/completions"
                
                payload = {
                    "model": settings.mistral_model,
                    "max_tokens": min(max_tokens, 50),
                    "temperature": 0.3,
                }
                
                if "chat" in endpoint:
                    payload["messages"] = [{"role": "user", "content": prompt}]
                else:
                    payload["prompt"] = prompt
                    payload["stop"] = ["\n", "."]

                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if "chat" in endpoint:
                        connector = result["choices"][0]["message"]["content"].strip()
                    else:
                        connector = result.get("choices", [{}])[0].get("text", "").strip()
                    
                    # Ensure it ends properly
                    if connector and not connector.endswith(('.', ',')):
                        connector += ","
                    
                    return connector
        except Exception:
            # Silently fail back to static connector
            pass
        
        # Fallback connectors
        return "Additionally,"
    
    async def _generate_minimal_response(self, requirement: str) -> ComposedResponse:
        """Generate minimal response when no KB match found."""
        
        # This should rarely happen - flag for review
        text = "Please refer to our company documentation for detailed information on this requirement."
        
        return ComposedResponse(
            text=text,
            provenance=[ProvenanceItem(0, len(text), "AI_GENERATED")],
            kb_percentage=0,
            ai_percentage=100
        )
    
    def _compose_kb_only(
        self,
        kb_content: List[Dict],
        matches: List[MatchResult]
    ) -> ComposedResponse:
        """Compose response using only KB content (no AI) - concise version."""
        
        if not kb_content:
            return ComposedResponse(
                text="[Response pending - requires knowledge base content]",
                provenance=[],
                kb_percentage=0,
                ai_percentage=0
            )
        
        # Only use first KB entry and extract just first 2 sentences
        best_content = kb_content[0]['content']
        sentences = re.split(r'(?<=[.!?])\s+', best_content)
        
        # Take only first 2 meaningful sentences
        selected_sentences = []
        for s in sentences:
            if len(s) >= 20:
                selected_sentences.append(s.strip())
            if len(selected_sentences) >= 2:
                break
        
        response_text = ' '.join(selected_sentences)
        
        if not response_text:
            response_text = best_content[:200]  # Fallback: first 200 chars
        
        provenance = [ProvenanceItem(
            start=0,
            end=len(response_text),
            source="KNOWLEDGE_BASE",
            kb_item_id=kb_content[0]['id']
        )]
        
        return ComposedResponse(
            text=response_text,
            provenance=provenance,
            kb_percentage=100,
            ai_percentage=0
        )
    
    def _calculate_percentages(
        self,
        text: str,
        provenance: List[ProvenanceItem]
    ) -> Tuple[float, float]:
        """Calculate KB and AI content percentages."""
        
        total_len = len(text)
        if total_len == 0:
            return 0, 0
        
        ai_len = sum(
            p.end - p.start 
            for p in provenance 
            if p.source == "AI_GENERATED"
        )
        
        kb_len = sum(
            p.end - p.start 
            for p in provenance 
            if p.source == "KNOWLEDGE_BASE"
        )
        
        ai_pct = (ai_len / total_len) * 100
        kb_pct = (kb_len / total_len) * 100
        
        return kb_pct, ai_pct
    
    def _extract_relevant_content(self, requirement: str, kb_content: List[Dict]) -> str:
        """Extract only the most relevant sentences from KB content for the requirement."""
        # Split KB content into sentences and score by keyword overlap
        requirement_words = set(requirement.lower().split())
        # Remove common words
        stopwords = {'the', 'a', 'an', 'of', 'in', 'to', 'for', 'and', 'or', 'be', 'is', 'are', 'must', 'shall', 'should', 'have', 'has', 'with'}
        requirement_words = requirement_words - stopwords
        
        scored_sentences = []
        
        for item in kb_content:
            sentences = re.split(r'(?<=[.!?])\s+', item['content'])
            for sentence in sentences:
                if len(sentence) < 20:
                    continue
                # Score by word overlap
                sentence_words = set(sentence.lower().split()) - stopwords
                overlap = len(requirement_words & sentence_words)
                if overlap >= 1:  # At least 1 meaningful word in common
                    scored_sentences.append((overlap, sentence.strip(), item['id']))
        
        # Sort by relevance and take top sentences
        scored_sentences.sort(reverse=True, key=lambda x: x[0])
        
        # Take only top 2 most relevant sentences for concise responses
        selected = scored_sentences[:2]
        
        if not selected:
            # Fallback to first sentence of best match
            first_sentence = kb_content[0]['content'].split('.')[0] + '.' if kb_content else ""
            return first_sentence
        
        return ' '.join([s[1] for s in selected])
    
    async def _refine_for_tender(
        self, 
        requirement: str, 
        kb_text: str,
        mode: str = "balanced",
        tone: str = "professional"
    ) -> Optional[ComposedResponse]:
        """Refine KB content into a professional tender response."""
        
        print(f"[REFINE] Mistral API Key present: {bool(settings.mistral_api_key)}")
        print(f"[REFINE] Mode: {mode}, Tone: {tone}")
        
        if not settings.mistral_api_key:
            print("[REFINE] No API key, skipping LLM")
            return None  # No LLM available, skip refinement
        
        # Mode and Tone specific instructions
        mode_instr = {
            "light": "Make minimal changes. Keep as much original text as possible.",
            "balanced": "Rewrite moderately for flow and clarity.",
            "aggressive": "Completely rewrite for maximum human-like flow.",
            "creative": "Add creative flair while maintaining facts."
        }.get(mode, "Rewrite moderately for flow and clarity.")

        tone_instr = {
            "professional": "Direct, business-like, and authoritative.",
            "casual": "Friendly and approachable but professional.",
            "formal": "Highly structured and sophisticated.",
            "simple": "Clear, concise, and easy to understand.",
            "academic": "Scholarly, precise, and objective with formal vocabulary."
        }.get(tone, "Direct, business-like, and authoritative.")

        # Detect language of the requirement
        try:
            req_lang = detect(requirement)
            lang_map = {
                "en": "English", "hi": "Hindi", "es": "Spanish", 
                "fr": "French", "ar": "Arabic", "de": "German",
                "pt": "Portuguese", "zh-cn": "Chinese (Simplified)"
            }
            lang_name = lang_map.get(req_lang, "the same language as the requirement")
            lang_instr = f"IMPORTANT: Write the response in {lang_name}."
        except:
            lang_name = "the same language as the requirement"
            lang_instr = f"IMPORTANT: Write the response in {lang_name}."

        try:
            headers = {"Authorization": f"Bearer {settings.mistral_api_key}"}
            current_text = None
            
            # ATTEMPT LOOP (paraphrase until AI% < 30%)
            for attempt in range(10):
                print(f"[REFINE] Attempt {attempt+1}/10 (Lang: {req_lang if 'req_lang' in locals() else 'unknown'})...")
                
                # Adjust prompt for retries
                if attempt == 0:
                    current_prompt = f"""You are an expert tender proposal writer. 
{lang_instr}
Rewrite the SOURCE CONTENT to directly answer the REQUIREMENT.
                    
REQUIREMENT:
{requirement}

SOURCE CONTENT:
{kb_text}

INSTRUCTIONS:
- {mode_instr}
- Tone: Use a {tone_instr} tone.
- Language: You MUST use {lang_name}.
- Be concise and direct (2-4 sentences max).
- Answer ONLY what the requirement asks.
- Do NOT add external marketing fluff.
- Maintain all technical facts and data from the SOURCE CONTENT.

RESPONSE:"""
                else:
                    # Retry prompt: Ask explicitly to stick closer to source to lower AI score
                    current_prompt = f"""The previous response was flagged as having too high an AI score. 
{lang_instr}

Rewrite the text below. You MUST use more of the EXACT phrases and vocabulary from the ORIGINAL SOURCE CONTENT to lower the AI score while still following the style instructions.

PREVIOUS (REJECTED):
{current_text}

ORIGINAL SOURCE:
{kb_text}

STYLE INSTRUCTIONS:
- Language: {lang_name}
- Mode: {mode_instr}
- Tone: {tone_instr}

REWRITE:"""

                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{self.mistral_url}/v1/chat/completions",
                        headers=headers,
                        json={
                            "model": settings.mistral_model,
                            "messages": [{"role": "user", "content": current_prompt}],
                            "max_tokens": 200,
                            "temperature": 0.7 if attempt > 0 else 0.3,
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        raw_refined_text = result["choices"][0]["message"]["content"].strip()
                        
                        # Create temporary ComposedResponse for humanization
                        temp_composed = ComposedResponse(
                            text=raw_refined_text,
                            provenance=[ProvenanceItem(0, len(raw_refined_text), "KNOWLEDGE_BASE")],
                            kb_percentage=50, # Placeholder
                            ai_percentage=100
                        )
                        
                        # Apply humanization
                        humanized = self._humanize(temp_composed, mode=mode)
                        ai_pct = humanized.ai_percentage
                        current_text = humanized.text
                        
                        print(f"[REFINE] Attempt {attempt+1}: AI Score: {ai_pct:.1f}%")
                        
                        # Use successful result immediately
                        if ai_pct <= self.max_ai_percentage:
                            print("[REFINE] AI% acceptable! Returning response.")
                            return humanized
                        else:
                            print(f"[REFINE] AI% {ai_pct:.1f}% > {self.max_ai_percentage}%. Retrying...")
                    else:
                        print(f"[REFINE] API Error: {response.status_code}")
                        break
            
            # All attempts exhausted - return None to trigger KB fallback
            print("[REFINE] All attempts failed to meet AI% threshold.")
            return None

        except Exception as e:
            print(f"[REFINE] Exception: {e}")
        
        return None
    
    def _humanize(self, composed: ComposedResponse, mode: str = "balanced") -> ComposedResponse:
        """Apply humanization to remove AI patterns."""
        
        # Use the advanced humanize_text service
        humanized_text, original_score, new_score, techniques = humanize_text(
            composed.text, 
            intensity=mode
        )
        
        # Apply local replacements as well (tender specific)
        for pattern, replacement in self.replacements.items():
            humanized_text = re.sub(pattern, replacement, humanized_text, flags=re.IGNORECASE)
        
        # Clean up extra spaces
        humanized_text = re.sub(r'\s+', ' ', humanized_text).strip()
        
        return ComposedResponse(
            text=humanized_text,
            provenance=composed.provenance,
            kb_percentage=composed.kb_percentage,
            ai_percentage=new_score
        )


# Singleton instance
_composer: Optional[ResponseComposer] = None


def get_composer() -> ResponseComposer:
    global _composer
    if _composer is None:
        _composer = ResponseComposer()
    return _composer
