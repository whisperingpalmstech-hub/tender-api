"""
Requirement Extractor Service
Extracts and categorizes requirements from parsed documents
"""
import re
from typing import List, Dict
from dataclasses import dataclass
from enum import Enum


class RequirementCategory(str, Enum):
    ELIGIBILITY = "ELIGIBILITY"
    TECHNICAL = "TECHNICAL"
    COMPLIANCE = "COMPLIANCE"


@dataclass
class ExtractedRequirement:
    text: str
    category: RequirementCategory
    subcategory: str | None
    confidence: float
    page_number: int | None
    order: int


class RequirementExtractor:
    """Extract and categorize requirements from document text."""
    
    def __init__(self):
        # Eligibility patterns
        self.eligibility_patterns = [
            r"must have.*(?:certification|certificate|license)",
            r"minimum.*(?:\d+\s*)?years?.*experience",
            r"registered.*(?:company|firm|entity)",
            r"turnover.*(?:crore|lakh|million|billion)",
            r"iso\s*\d+.*certified",
            r"annual.*revenue",
            r"net\s*worth",
            r"valid.*registration",
            r"(?:should|must|shall)\s+be\s+(?:a\s+)?registered",
            r"empaneled\s+with",
            r"financial.*(?:standing|capability|capacity)",
            r"past.*(?:performance|experience)",
            r"similar.*(?:work|project|contract)",
        ]
        
        # Technical patterns
        self.technical_patterns = [
            r"(?:shall|must|should)\s+provide",
            r"(?:shall|must|should)\s+implement",
            r"system\s+(?:must|shall|should)",
            r"technical.*specification",
            r"deliverables?.*(?:include|consist)",
            r"solution\s+(?:must|shall|should)",
            r"(?:hardware|software)\s+requirement",
            r"platform\s+(?:must|shall|should)",
            r"integration\s+with",
            r"support.*(?:24x7|round.*clock)",
            r"uptime.*(?:\d+%|\d+\s*percent)",
            r"performance.*requirement",
            r"scalability",
            r"security.*(?:feature|requirement|standard)",
        ]
        
        # Compliance patterns
        self.compliance_patterns = [
            r"attach.*(?:certificate|document|proof)",
            r"provide.*(?:evidence|proof|documentation)",
            r"submit.*(?:document|certificate|declaration)",
            r"confirm.*compliance",
            r"undertaking.*(?:that|stating)",
            r"declaration.*(?:that|stating)",
            r"affidavit",
            r"self.*certification",
            r"duly.*signed",
            r"notarized",
            r"comply\s+with",
            r"adherence\s+to",
            r"in\s+accordance\s+with",
        ]
        
        # Requirement indicators
        self.requirement_indicators = [
            r"(?:shall|must|should|will|need\s+to|required\s+to)",
            r"mandatory",
            r"essential",
            r"prerequisite",
            r"minimum.*requirement",
            r"eligibility.*criteria",
        ]
        
        # Compile patterns for efficiency
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Compile regex patterns."""
        self.eligibility_re = [re.compile(p, re.IGNORECASE) for p in self.eligibility_patterns]
        self.technical_re = [re.compile(p, re.IGNORECASE) for p in self.technical_patterns]
        self.compliance_re = [re.compile(p, re.IGNORECASE) for p in self.compliance_patterns]
        self.indicator_re = [re.compile(p, re.IGNORECASE) for p in self.requirement_indicators]
    
    async def extract(self, text: str, pages: List[Dict] = None) -> List[ExtractedRequirement]:
        """Extract requirements from document text."""
        requirements = []
        seen_texts = set()
        order = 0
        
        # Split into sentences
        sentences = self._split_sentences(text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            
            # Skip short or duplicate sentences
            if len(sentence) < 20 or sentence.lower() in seen_texts:
                continue
            
            # Check if this is a requirement
            if not self._is_requirement(sentence):
                continue
            
            # Categorize the requirement
            category, confidence, subcategory = self._categorize(sentence)
            
            # Find page number if pages provided
            page_num = self._find_page_number(sentence, pages) if pages else None
            
            requirements.append(ExtractedRequirement(
                text=sentence,
                category=category,
                subcategory=subcategory,
                confidence=confidence,
                page_number=page_num,
                order=order
            ))
            
            seen_texts.add(sentence.lower())
            order += 1
        
        return requirements
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Handle common abbreviations
        text = re.sub(r'\b(Mr|Mrs|Ms|Dr|Prof|Inc|Ltd|Co|etc)\.\s', r'\1<PERIOD> ', text)
        
        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Restore periods
        sentences = [s.replace('<PERIOD>', '.') for s in sentences]
        
        # Also split on numbered lists
        expanded = []
        for sentence in sentences:
            # Check for numbered items
            items = re.split(r'\n\s*(?:\d+[\.\)]\s*|\•\s*|\-\s*)', sentence)
            expanded.extend(items)
        
        return [s.strip() for s in expanded if s.strip()]
    
    def _is_requirement(self, sentence: str) -> bool:
        """Check if sentence is likely a requirement."""
        # Check for requirement indicators
        for pattern in self.indicator_re:
            if pattern.search(sentence):
                return True
        
        # Check category patterns
        for patterns in [self.eligibility_re, self.technical_re, self.compliance_re]:
            for pattern in patterns:
                if pattern.search(sentence):
                    return True
        
        return False
    
    def _categorize(self, sentence: str) -> tuple[RequirementCategory, float, str | None]:
        """Categorize a requirement sentence."""
        scores = {
            RequirementCategory.ELIGIBILITY: 0,
            RequirementCategory.TECHNICAL: 0,
            RequirementCategory.COMPLIANCE: 0,
        }
        
        subcategory = None
        
        # Score eligibility
        for pattern in self.eligibility_re:
            if pattern.search(sentence):
                scores[RequirementCategory.ELIGIBILITY] += 1
                # Detect subcategory
                if "certification" in sentence.lower() or "iso" in sentence.lower():
                    subcategory = "Certifications"
                elif "experience" in sentence.lower() or "years" in sentence.lower():
                    subcategory = "Experience"
                elif "turnover" in sentence.lower() or "revenue" in sentence.lower():
                    subcategory = "Financial"
        
        # Score technical
        for pattern in self.technical_re:
            if pattern.search(sentence):
                scores[RequirementCategory.TECHNICAL] += 1
                if "security" in sentence.lower():
                    subcategory = "Security"
                elif "performance" in sentence.lower():
                    subcategory = "Performance"
                elif "integration" in sentence.lower():
                    subcategory = "Integration"
        
        # Score compliance
        for pattern in self.compliance_re:
            if pattern.search(sentence):
                scores[RequirementCategory.COMPLIANCE] += 1
                if "certificate" in sentence.lower():
                    subcategory = "Documentation"
                elif "declaration" in sentence.lower() or "undertaking" in sentence.lower():
                    subcategory = "Declarations"
        
        # Determine category with highest score
        max_score = max(scores.values())
        if max_score == 0:
            # Default to technical if no clear match
            return RequirementCategory.TECHNICAL, 0.5, None
        
        category = max(scores, key=scores.get)
        total = sum(scores.values())
        confidence = max_score / total if total > 0 else 0.5
        
        return category, min(confidence, 0.99), subcategory
    
    def _find_page_number(self, sentence: str, pages: List[Dict]) -> int | None:
        """Find which page contains the sentence."""
        sentence_lower = sentence.lower()[:50]  # Use first 50 chars
        
        for page in pages:
            if sentence_lower in page.get("content", "").lower():
                return page.get("page_num")
        
        return None


# Singleton instance
_extractor: RequirementExtractor = None


def get_extractor() -> RequirementExtractor:
    global _extractor
    if _extractor is None:
        _extractor = RequirementExtractor()
    return _extractor
