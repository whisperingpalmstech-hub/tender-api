from typing import List, Dict, Any
from datetime import datetime
from app.services.matcher import get_matcher
from app.core.supabase import get_supabase
from app.services.discovery.base import DiscoveredTender

# Minimum match score threshold. Set to 0 to save ALL tenders
# regardless of relevance score. Users can filter by score in the UI.
MIN_MATCH_SCORE = 0

class DiscoveryMatcher:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.supabase = get_supabase()
        self.matcher = get_matcher()

    async def match_tender(self, tender: DiscoveredTender) -> Dict[str, Any]:
        """
        AI-based semantic matching using both Vector Store and LLM for enterprise-level accuracy.
        """
        # 1. Fetch Discovery Config
        config_res = self.supabase.table("discovery_config") \
            .select("*") \
            .eq("tenant_id", self.tenant_id) \
            .execute()
        
        config = config_res.data[0] if config_res.data else {}
        preferred_domains = config.get("preferred_domains", [])
        keywords = config.get("keywords", [])
        
        # 2. Vector Match (Against past projects & KB)
        # Search using title + description for better context
        search_query = f"{tender.title} {tender.description[:200]}"
        kb_matches = await self.matcher.search(search_query, top_k=3)
        
        kb_context = "\n".join([f"- {m.content[:300]}..." for m in kb_matches])
        
        # 3. LLM Semantic Analysis (The 'Agent' Part)
        from app.core.config import get_settings
        settings = get_settings()
        
        # Fetch detailed company profile for core competence context
        profile_res = self.supabase.table("company_profiles").select("capabilities, legal_name").eq("tenant_id", self.tenant_id).limit(1).execute()
        company_profile = profile_res.data[0] if profile_res.data else {}
        capabilities = company_profile.get("capabilities", [])
        company_name = company_profile.get("legal_name", "Our Company")
        
        # Combine capabilities with preferred domains
        competencies = list(set(preferred_domains + capabilities))

        prompt = f"""
        Analyze the following Tender Discovery for {company_name}.
        
        COMPANY CORE COMPETENCIES:
        {', '.join(competencies)}
        
        RELEVANT INTERNAL MATCHES (Experience & Expertise):
        {kb_context if kb_context else "No direct past performance matches found."}
        
        KEYWORDS OF INTEREST:
        {', '.join(keywords)}

        TENDER DETAILS:
        Title: {tender.title}
        Authority: {tender.authority}
        Category: {tender.category}
        Description: {tender.description}

        TASK:
        1. Determine if this tender is RELEVANT to the company. A tender is relevant ONLY if it aligns with at least one of the company's core competencies, past experience, or knowledge base entries. If the tender is about a domain completely outside the company's expertise, mark it as NOT relevant.
        2. Assign a Match Score (0-100) based on how well this aligns with the company's competencies and past experience. Score 0-29 means no meaningful alignment. Score 30-60 means partial alignment. Score 61-100 means strong alignment.
        3. Provide a 1-2 sentence explanation. If there are relevant internal matches, mention them. If not relevant, explain why.
        4. Extract 3-5 relevant domain tags.

        IMPORTANT: Be strict about relevance. If the tender domain (e.g., construction, agriculture, textiles) has NO overlap with the company's IT/software/cybersecurity/ERP competencies, the score MUST be below 30 and relevant MUST be false.

        FORMAT (JSON):
        {{
            "score": number,
            "relevant": true/false,
            "explanation": "string",
            "tags": ["tag1", "tag2"]
        }}
        """
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    f"{settings.llm_api_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.llm_api_key}"},
                    json={
                        "model": settings.llm_model,
                        "messages": [{"role": "system", "content": "You are an expert procurement consultant. Evaluate tender fit based on company competencies."}, 
                                    {"role": "user", "content": prompt}],
                        "response_format": {"type": "json_object"}
                    },
                    timeout=30.0
                )
                llm_data = res.json()["choices"][0]["message"]["content"]
                import json
                result = json.loads(llm_data)
        except Exception as e:
            print(f"LLM Match Error: {e}")
            # Fallback to simple keyword-based logic if LLM fails
            has_keyword_match = any(d.lower() in tender.title.lower() or d.lower() in (tender.description or "").lower() for d in competencies)
            fallback_score = 50 if has_keyword_match else 10
            result = {
                "score": fallback_score,
                "relevant": has_keyword_match,
                "explanation": "Automated domain keyword match (LLM Unavailable)." if has_keyword_match else "No keyword overlap with company knowledge base (LLM Unavailable).",
                "tags": [d for d in competencies if d.lower() in tender.title.lower() or d.lower() in (tender.description or "").lower()]
            }

        # Save ALL tenders regardless of score — let the user decide in the UI
        is_relevant = True

        # Labeling
        if not is_relevant:
            label = "Not Relevant"
        elif result["score"] > 80:
            label = "Highly Relevant"
        elif result["score"] > 50:
            label = "Related"
        else:
            label = "Weak Match"

        return {
            "score": result["score"],
            "explanation": result["explanation"],
            "tags": result.get("tags", []),
            "label": label,
            "is_relevant": is_relevant
        }

    async def process_and_update_tender(self, tender_id: str):
        """Fetch tender from DB, match it, and update it."""
        tender_res = self.supabase.table("discovered_tenders") \
            .select("*") \
            .eq("id", tender_id) \
            .execute()
        
        if not tender_res.data:
            return
            
        tender_record = tender_res.data[0]
        # Convert record to DiscoveredTender object for matcher
        tender_obj = DiscoveredTender(
            external_ref_id=tender_record["external_ref_id"],
            title=tender_record["title"],
            category=tender_record["category"],
            description=tender_record["description"],
            source_portal=tender_record["source_portal"]
        )
        
        match_results = await self.match_tender(tender_obj)
        
        self.supabase.table("discovered_tenders") \
            .update({
                "match_score": match_results["score"],
                "match_explanation": match_results["explanation"],
                "domain_tags": match_results["tags"]
            }) \
            .eq("id", tender_id) \
            .execute()
        
        return match_results
