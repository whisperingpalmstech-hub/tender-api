import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any
from app.core.supabase import get_supabase
from app.services.discovery.base import DiscoveredTender, BaseScraper

class DiscoveryScanner:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.supabase = get_supabase()

    def generate_content_hash(self, tender: DiscoveredTender) -> str:
        """Create a hash of tender content to detect changes."""
        relevant_data = {
            "title": tender.title,
            "description": tender.description,
            "deadline": str(tender.submission_deadline) if tender.submission_deadline else "",
            "attachments": sorted([a.get("url", "") for a in tender.attachments])
        }
        content_str = json.dumps(relevant_data, sort_keys=True)
        return hashlib.sha256(content_str.encode()).hexdigest()

    async def save_discovered_tenders(self, tenders: List[DiscoveredTender]):
        saved_count = 0
        updated_count = 0
        skipped_expired = 0
        skipped_irrelevant = 0
        
        for tender in tenders:
            # --- FILTER 1: Skip expired tenders ---
            if tender.submission_deadline and tender.submission_deadline < datetime.now():
                print(f"[Scanner] Skipping expired tender: {tender.title} (Deadline: {tender.submission_deadline})")
                skipped_expired += 1
                continue

            content_hash = self.generate_content_hash(tender)
            
            # Check if tender already exists
            existing = self.supabase.table("discovered_tenders") \
                .select("id, content_hash, status") \
                .eq("external_ref_id", tender.external_ref_id) \
                .eq("source_portal", tender.source_portal) \
                .execute()
            
            tender_data = {
                "external_ref_id": tender.external_ref_id,
                "title": tender.title,
                "authority": tender.authority,
                "publish_date": tender.publish_date.isoformat() if tender.publish_date else None,
                "submission_deadline": tender.submission_deadline.isoformat() if tender.submission_deadline else None,
                "category": tender.category,
                "department": tender.department,
                "source_portal": tender.source_portal,
                "location": tender.location,
                "description": tender.description,
                "content_hash": content_hash,
                "tenant_id": self.tenant_id,
                "last_scanned_at": datetime.now().isoformat()
            }

            if existing.data:
                # Update if content changed
                record = existing.data[0]
                if record["content_hash"] != content_hash:
                    tender_data["is_updated"] = True
                    # If it was rejected, maybe we want to re-evaluate it if it's updated?
                    # For now, just mark it as updated.
                    self.supabase.table("discovered_tenders") \
                        .update(tender_data) \
                        .eq("id", record["id"]) \
                        .execute()
                    updated_count += 1
                    
                    # Also update attachments
                    await self._update_attachments(record["id"], tender.attachments)
            else:
                # --- FILTER 2: Check knowledge base relevance BEFORE saving ---
                # Run the AI matcher first to determine if this tender aligns with company KB
                from app.services.discovery.matcher import DiscoveryMatcher
                matcher = DiscoveryMatcher(self.tenant_id)
                match_results = await matcher.match_tender(tender)
                
                if not match_results.get("is_relevant", True):
                    print(f"[Scanner] Skipping irrelevant tender (score: {match_results['score']}): {tender.title}")
                    print(f"          Reason: {match_results['explanation']}")
                    skipped_irrelevant += 1
                    continue
                
                # Tender is relevant — save it with match data pre-populated
                tender_data["match_score"] = match_results["score"]
                tender_data["match_explanation"] = match_results["explanation"]
                tender_data["domain_tags"] = match_results.get("tags", [])
                
                result = self.supabase.table("discovered_tenders") \
                    .insert(tender_data) \
                    .execute()
                
                if result.data:
                    new_id = result.data[0]["id"]
                    await self._update_attachments(new_id, tender.attachments)
                    saved_count += 1
        
        return {
            "saved": saved_count, 
            "updated": updated_count,
            "skipped_expired": skipped_expired,
            "skipped_irrelevant": skipped_irrelevant
        }

    async def _update_attachments(self, tender_id: str, attachments: List[Dict[str, str]]):
        if not attachments:
            return
            
        # Clear old attachments for this tender (simplified)
        self.supabase.table("tender_attachments") \
            .delete() \
            .eq("tender_id", tender_id) \
            .execute()
            
        # Add new ones
        attachment_records = [
            {
                "tender_id": tender_id,
                "file_name": a.get("name", "Document"),
                "external_url": a.get("url"),
                "file_type": a.get("url", "").split(".")[-1].upper() if "." in a.get("url", "") else "UNKNOWN"
            }
            for a in attachments
        ]
        
        self.supabase.table("tender_attachments") \
            .insert(attachment_records) \
            .execute()

    async def run_discovery(self, scrapers: List[BaseScraper]):
        all_results = []
        for scraper in scrapers:
            try:
                tenders = await scraper.scan()
                for tender in tenders:
                    # Get full details if needed
                    detailed_tender = await scraper.get_details(tender)
                    all_results.append(detailed_tender)
            except Exception as e:
                print(f"Error running scraper {scraper.__class__.__name__}: {str(e)}")
        
        return await self.save_discovered_tenders(all_results)
