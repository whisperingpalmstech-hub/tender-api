"""
Document Processing Pipeline
Orchestrates the full document processing flow
"""
import asyncio
from typing import Optional
from uuid import UUID

from app.core.supabase import get_supabase
from app.services.parser import get_parser
from app.services.extractor import get_extractor
from app.services.matcher import get_matcher


class ProcessingPipeline:
    """Orchestrates document processing pipeline."""
    
    def __init__(self):
        self.parser = get_parser()
        self.extractor = get_extractor()
        self.matcher = get_matcher()
        self.supabase = get_supabase()
    
    async def process_document(self, document_id: str):
        """Process document through full pipeline."""
        
        try:
            # Get document record
            result = self.supabase.table('documents').select('*').eq('id', document_id).single().execute()
            document = result.data
            
            if not document:
                raise ValueError(f"Document not found: {document_id}")
            
            # Step 1: Parse document
            print(f"[{document_id}] Starting parsing...")
            await self._update_status(document_id, "PARSING", 10)
            
            # Download file from storage
            print(f"[{document_id}] Downloading file: {document['file_path']}")
            file_content = self.supabase.storage.from_('tender-documents').download(document['file_path'])
            print(f"[{document_id}] File downloaded, size: {len(file_content)} bytes")
            
            # Parse
            parsed = await self.parser.parse(file_content, document.get('file_type', 'PDF'))
            print(f"[{document_id}] Parsing complete. Extracted {len(parsed.raw_text)} chars.")
            
            await self._update_status(document_id, "PARSING", 30)
            
            # Step 2: Extract requirements
            print(f"[{document_id}] Starting extraction...")
            await self._update_status(document_id, "EXTRACTING", 40)
            
            requirements = await self.extractor.extract(parsed.raw_text, parsed.pages)
            print(f"[{document_id}] Extraction complete. Found {len(requirements)} requirements.")
            
            # Save requirements to database
            for req in requirements:
                self.supabase.table('requirements').insert({
                    'document_id': document_id,
                    'requirement_text': req.text,
                    'category': req.category.value,
                    'subcategory': req.subcategory,
                    'confidence_score': req.confidence,
                    'page_number': req.page_number,
                    'extraction_order': req.order,
                }).execute()
            
            await asyncio.sleep(0.5)
            await self._update_status(document_id, "EXTRACTING", 60)
            
            # Step 3: Match against knowledge base
            print(f"[{document_id}] Starting matching...")
            await asyncio.sleep(0.5)
            await self._update_status(document_id, "MATCHING", 70)
            
            # Get saved requirements
            req_result = self.supabase.table('requirements').select('*').eq('document_id', document_id).execute()
            saved_requirements = req_result.data
            
            # Match requirements
            req_for_matching = [
                {'id': r['id'], 'text': r['requirement_text'], 'category': r['category']}
                for r in saved_requirements
            ]
            
            match_results = await self.matcher.match_requirements(req_for_matching)
            
            # Save match results
            for result in match_results:
                for match in result.get('matches', [])[:3]:  # Top 3 matches
                    self.supabase.table('match_results').insert({
                        'document_id': document_id,
                        'requirement_id': result['requirement_id'],
                        'kb_item_id': match['kb_item_id'],
                        'match_percentage': result['match_percentage'],
                        'matched_content': match['content'][:500],  # Limit content
                        'rank': match['rank'],
                    }).execute()
            
            await asyncio.sleep(0.5)
            await self._update_status(document_id, "MATCHING", 90)
            
            # Calculate and save summary
            summary_data = self.matcher.calculate_summary(match_results)
            
            self.supabase.table('match_summaries').insert({
                'document_id': document_id,
                'eligibility_match': summary_data['summary']['eligibility_match'],
                'technical_match': summary_data['summary']['technical_match'],
                'compliance_match': summary_data['summary']['compliance_match'],
                'overall_match': summary_data['summary']['overall_match'],
                'total_requirements': len(saved_requirements),
                'matched_requirements': sum(
                    1 for r in match_results if r['match_percentage'] >= 50
                ),
            }).execute()
            
            # Complete
            await asyncio.sleep(0.5)
            await self._update_status(document_id, "READY", 100)
            
        except Exception as e:
            print(f"Processing error: {e}")
            await self._update_status(document_id, "ERROR", 0, str(e))
            raise
    
    async def _update_status(
        self,
        document_id: str,
        status: str,
        progress: int,
        error: Optional[str] = None
    ):
        """Update document processing status."""
        
        update_data = {
            'status': status,
            'processing_progress': progress,
        }
        
        if error:
            update_data['error_message'] = error
        
        print(f"[{document_id}] Updating status to: {status} ({progress}%)")
        self.supabase.table('documents').update(update_data).eq('id', document_id).execute()


# Singleton
_pipeline: Optional[ProcessingPipeline] = None


def get_pipeline() -> ProcessingPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = ProcessingPipeline()
    return _pipeline


async def process_document_async(document_id: str):
    """Process document in background."""
    pipeline = get_pipeline()
    await pipeline.process_document(document_id)
