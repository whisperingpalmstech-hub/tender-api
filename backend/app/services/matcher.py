"""
Vector Matching Service
Uses FAISS for semantic similarity search against knowledge base
"""
import os
import json
import numpy as np
from typing import List, Dict, Optional
from dataclasses import dataclass

import faiss
from sentence_transformers import SentenceTransformer

from app.core.config import get_settings

settings = get_settings()


@dataclass
class MatchResult:
    kb_item_id: str
    content: str
    score: float
    rank: int


class VectorMatcher:
    """Vector-based semantic matching using FAISS."""
    
    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        self.model = SentenceTransformer(model_name)
        self.dimension = 384  # Dimension for paraphrase-multilingual-MiniLM-L12-v2
        self.index: Optional[faiss.IndexFlatIP] = None
        self.kb_items: List[Dict] = []
        self.id_to_index: Dict[str, int] = {}
        
        # Load existing index if available
        self._load_index()
    
    def _load_index(self):
        """Load existing FAISS index and KB data."""
        index_path = settings.faiss_index_path
        kb_path = settings.knowledge_base_path
        
        if os.path.exists(index_path) and os.path.exists(kb_path):
            try:
                self.index = faiss.read_index(index_path)
                with open(kb_path, 'r', encoding='utf-8') as f:
                    self.kb_items = json.load(f)
                self.id_to_index = {item['id']: i for i, item in enumerate(self.kb_items)}
            except Exception as e:
                print(f"Error loading index: {e}")
                self._create_empty_index()
        else:
            self._create_empty_index()
    
    def _create_empty_index(self):
        """Create empty FAISS index."""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.kb_items = []
        self.id_to_index = {}
    
    def _save_index(self):
        """Save FAISS index and KB data to disk."""
        os.makedirs(os.path.dirname(settings.faiss_index_path), exist_ok=True)
        
        faiss.write_index(self.index, settings.faiss_index_path)
        with open(settings.knowledge_base_path, 'w', encoding='utf-8') as f:
            json.dump(self.kb_items, f, ensure_ascii=False, indent=2)
    
    def add_item(self, item_id: str, content: str, metadata: Dict = None):
        """Add item to knowledge base and index."""
        # Generate embedding
        embedding = self.model.encode([content])[0]
        embedding = embedding / np.linalg.norm(embedding)  # Normalize
        
        # Add to FAISS
        self.index.add(np.array([embedding], dtype=np.float32))
        
        # Store KB item
        kb_item = {
            'id': item_id,
            'content': content,
            **(metadata or {})
        }
        self.kb_items.append(kb_item)
        self.id_to_index[item_id] = len(self.kb_items) - 1
        
        # Save
        self._save_index()
    
    def remove_item(self, item_id: str):
        """Remove item from knowledge base (rebuild index)."""
        if item_id not in self.id_to_index:
            return
        
        # Remove from KB items
        self.kb_items = [item for item in self.kb_items if item['id'] != item_id]
        
        # Rebuild index
        self._rebuild_index()
    
    def _rebuild_index(self):
        """Rebuild FAISS index from KB items."""
        self._create_empty_index()
        
        if not self.kb_items:
            self._save_index()
            return
        
        # Regenerate embeddings
        contents = [item['content'] for item in self.kb_items]
        embeddings = self.model.encode(contents)
        
        # Normalize
        faiss.normalize_L2(embeddings)
        
        # Add to index
        self.index.add(embeddings.astype(np.float32))
        
        # Rebuild mapping
        self.id_to_index = {item['id']: i for i, item in enumerate(self.kb_items)}
        
        # Save
        self._save_index()
    
    def sync_with_database(self, kb_items: List[Dict]):
        """Sync FAISS index with database KB items."""
        self.kb_items = kb_items
        self._rebuild_index()
    
    async def search(
        self, 
        query: str, 
        top_k: int = 5,
        min_score: float = 0.0,
        tenant_id: str = None
    ) -> List[MatchResult]:
        """Search for similar KB items."""
        if self.index.ntotal == 0:
            return []
        
        # Generate query embedding
        query_embedding = self.model.encode([query])[0]
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        query_embedding = query_embedding.reshape(1, -1).astype(np.float32)
        
        # Search deeper to allow post-filtering without missing results
        search_k = min(top_k * 10 if tenant_id else top_k, self.index.ntotal)
        scores, indices = self.index.search(query_embedding, search_k)
        
        results = []
        for rank, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < 0 or idx >= len(self.kb_items) or float(score) < min_score:
                continue
            
            kb_item = self.kb_items[idx]
            
            # Enforce multi-tenancy isolation correctly
            if tenant_id and kb_item.get('tenant_id') and kb_item.get('tenant_id') != tenant_id:
                continue
                
            results.append(MatchResult(
                kb_item_id=kb_item['id'],
                content=kb_item['content'],
                score=float(score),
                rank=len(results) + 1
            ))
            
            if len(results) >= top_k:
                break
        
        return results
    
    async def match_requirements(
        self, 
        requirements: List[Dict],
        top_k: int = 3,
        tenant_id: str = None
    ) -> List[Dict]:
        """Match multiple requirements against KB."""
        results = []
        
        for req in requirements:
            matches = await self.search(req['text'], top_k=top_k, tenant_id=tenant_id)
            
            # Calculate match percentage (normalize cosine similarity to 0-100)
            best_match = matches[0] if matches else None
            match_percentage = (best_match.score * 100) if best_match else 0
            
            results.append({
                'requirement_id': req['id'],
                'requirement_text': req['text'],
                'category': req.get('category'),
                'match_percentage': min(match_percentage, 100),
                'matches': [
                    {
                        'kb_item_id': m.kb_item_id,
                        'content': m.content,
                        'score': m.score,
                        'rank': m.rank
                    }
                    for m in matches
                ]
            })
        
        return results
    
    def calculate_summary(self, match_results: List[Dict]) -> Dict:
        """Calculate match summary statistics."""
        by_category = {}
        
        for result in match_results:
            category = result.get('category', 'TECHNICAL')
            if category not in by_category:
                by_category[category] = {'scores': [], 'total': 0, 'matched': 0}
            
            by_category[category]['total'] += 1
            by_category[category]['scores'].append(result['match_percentage'])
            
            if result['match_percentage'] >= 50:  # Consider 50%+ as matched
                by_category[category]['matched'] += 1
        
        summary = {
            'eligibility_match': 0,
            'technical_match': 0,
            'compliance_match': 0,
        }
        
        for cat, data in by_category.items():
            key = f"{cat.lower()}_match"
            if key in summary and data['scores']:
                summary[key] = sum(data['scores']) / len(data['scores'])
        
        # Calculate overall as average of category percentages (category-weighted approach)
        # This ensures each category has equal weight regardless of number of requirements
        category_scores = [
            summary['eligibility_match'],
            summary['technical_match'],
            summary['compliance_match']
        ]
        # Only include categories that have requirements (non-zero scores or explicitly calculated)
        active_category_scores = [score for cat, score in zip(
            ['ELIGIBILITY', 'TECHNICAL', 'COMPLIANCE'], 
            category_scores
        ) if cat in by_category]
        
        summary['overall_match'] = (
            sum(active_category_scores) / len(active_category_scores) 
            if active_category_scores else 0
        )
        
        breakdown = {
            'eligibility': {'total': 0, 'matched': 0},
            'technical': {'total': 0, 'matched': 0},
            'compliance': {'total': 0, 'matched': 0},
        }
        
        for cat, data in by_category.items():
            key = cat.lower()
            if key in breakdown:
                breakdown[key] = {
                    'total': data['total'],
                    'matched': data['matched']
                }
        
        return {
            'summary': summary,
            'breakdown': breakdown
        }


# Singleton instance
_matcher: Optional[VectorMatcher] = None


def get_matcher() -> VectorMatcher:
    global _matcher
    if _matcher is None:
        _matcher = VectorMatcher()
    return _matcher
