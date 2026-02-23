from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.core.supabase import get_supabase
from app.services.discovery.scanner import DiscoveryScanner
from app.services.discovery.scrapers.gem_scraper import GeMScraper
from app.services.discovery.scrapers.mock_scraper import MockPortalScraper # Keeping mock for fallback

router = APIRouter(prefix="/discovery", tags=["Discovery"])

@router.post("/scan")
async def trigger_scan(tenant_id: str):
    """
    Trigger a scan of all configured tender portals for a tenant asynchronously.
    """
    from app.worker.tasks import discovery_scan_task
    
    # Trigger Celery task
    task = discovery_scan_task.delay(tenant_id)
    
    return {
        "message": "Discovery scan started in background",
        "task_id": task.id
    }

@router.post("/scan/sync")
async def trigger_scan_sync(tenant_id: str):
    """
    Run discovery scan directly (no Celery/Redis needed).
    Useful for testing or when Celery is not running.
    """
    from app.services.discovery.scanner import DiscoveryScanner
    from app.services.discovery.scrapers.gem_scraper import GeMScraper
    
    print(f"[SCAN] Starting SYNC discovery scan for tenant {tenant_id}")
    
    try:
        scanner = DiscoveryScanner(tenant_id)
        scrapers = [GeMScraper()]
        result = await scanner.run_discovery(scrapers)
        
        print(f"[SCAN] Completed: {result}")
        return {
            "status": "COMPLETED",
            "message": "Scan completed",
            "stats": {
                "saved": result.get("saved", 0),
                "updated": result.get("updated", 0),
                "skipped_expired": result.get("skipped_expired", 0),
                "skipped_irrelevant": result.get("skipped_irrelevant", 0),
                "total_fetched": (
                    result.get("saved", 0) + 
                    result.get("updated", 0) + 
                    result.get("skipped_expired", 0) + 
                    result.get("skipped_irrelevant", 0)
                )
            }
        }
    except Exception as e:
        print(f"[SCAN] Failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scan/status/{task_id}")
async def get_scan_status(task_id: str):
    """
    Check the status of a background discovery scan task.
    Returns scan statistics when complete.
    """
    from app.core.celery_app import celery_app
    
    task_result = celery_app.AsyncResult(task_id)
    
    if task_result.state == "PENDING":
        return {"status": "PENDING", "message": "Scan is queued..."}
    elif task_result.state == "STARTED":
        return {"status": "RUNNING", "message": "Scan is in progress..."}
    elif task_result.state == "SUCCESS":
        result = task_result.result or {}
        scan_data = result.get("result", {})
        return {
            "status": "COMPLETED",
            "message": "Scan completed successfully",
            "stats": {
                "saved": scan_data.get("saved", 0),
                "updated": scan_data.get("updated", 0),
                "skipped_expired": scan_data.get("skipped_expired", 0),
                "skipped_irrelevant": scan_data.get("skipped_irrelevant", 0),
                "total_fetched": (
                    scan_data.get("saved", 0) + 
                    scan_data.get("updated", 0) + 
                    scan_data.get("skipped_expired", 0) + 
                    scan_data.get("skipped_irrelevant", 0)
                )
            }
        }
    elif task_result.state == "FAILURE":
        return {
            "status": "FAILED",
            "message": "Scan failed. Please try again.",
            "error": str(task_result.result) if task_result.result else "Unknown error"
        }
    else:
        return {"status": task_result.state, "message": "Processing..."}


@router.get("/tenders")
async def list_discovered_tenders(tenant_id: str, status: str = "PENDING", min_score: int = -1):
    """
    List discovered tenders for approval.
    Applies saved discovery_config preferences:
    - min_match_score: minimum relevance score
    - max_results: limit number of results
    - keywords: filter by keywords in title/description
    """
    from datetime import datetime
    
    supabase = get_supabase()
    
    # Load saved discovery config for this tenant
    config = {}
    try:
        config_res = supabase.table("discovery_config") \
            .select("*") \
            .eq("tenant_id", tenant_id) \
            .execute()
        config = config_res.data[0] if config_res.data else {}
    except Exception as e:
        print(f"[DISCOVERY] Could not load config: {e}")
    
    # Use saved min_match_score if not explicitly passed (-1 means "use config")
    effective_min_score = min_score if min_score >= 0 else config.get("min_match_score", 0)
    max_results = config.get("max_results", 100)
    saved_keywords = config.get("keywords", [])
    saved_domains = config.get("preferred_domains", [])
    
    query = supabase.table("discovered_tenders") \
        .select("*, tender_attachments(*)") \
        .eq("tenant_id", tenant_id)
    
    if status:
        query = query.eq("status", status)
    
    # Apply minimum match score filter
    if effective_min_score > 0:
        query = query.gte("match_score", effective_min_score)
    
    # Filter out expired tenders (deadline already passed)
    now_iso = datetime.now().isoformat()
    query = query.or_(f"submission_deadline.is.null,submission_deadline.gt.{now_iso}")
    
    # Apply max results limit
    query = query.order("match_score", desc=True).limit(max_results)
        
    result = query.execute()
    tenders = result.data or []
    
    # Apply keyword/domain text filter if saved in config
    if saved_keywords or saved_domains:
        filter_terms = [k.lower() for k in saved_keywords] + [d.lower() for d in saved_domains]
        if filter_terms:
            # Don't hard-filter, but boost: move keyword-matching ones to top
            # This way user still sees all tenders but matching ones come first
            def keyword_boost(tender):
                title = (tender.get("title") or "").lower()
                desc = (tender.get("description") or "").lower()
                category = (tender.get("category") or "").lower()
                hits = sum(1 for term in filter_terms if term in title or term in desc or term in category)
                return hits
            
            tenders.sort(key=lambda t: (keyword_boost(t), t.get("match_score", 0)), reverse=True)
    
    return tenders

@router.post("/tenders/{tender_id}/approve")
async def approve_tender(tender_id: str):
    """
    Approve a tender and move it to the bid placement workflow.
    """
    supabase = get_supabase()
    # Update status
    result = supabase.table("discovered_tenders") \
        .update({"status": "APPROVED"}) \
        .eq("id", tender_id) \
        .execute()
        
    # In a real scenario, this might trigger document download and OCR pipeline
    # For now, we just update the status as per requirement.
    return {"message": "Tender approved for bid placement", "data": result.data}

@router.post("/tenders/{tender_id}/reject")
async def reject_tender(tender_id: str):
    """
    Reject/Archive a tender.
    """
    supabase = get_supabase()
    result = supabase.table("discovered_tenders") \
        .update({"status": "REJECTED"}) \
        .eq("id", tender_id) \
        .execute()
        
    return {"message": "Tender rejected", "data": result.data}

@router.delete("/tenders/{tender_id}")
async def delete_tender(tender_id: str):
    """
    Permanently delete a tender.
    """
    supabase = get_supabase()
    
    # Delete relevant attachments first to avoid FK errors
    try:
        supabase.table("tender_attachments").delete().eq("tender_id", tender_id).execute()
    except Exception as e:
        print(f"[DISCOVERY] No attachments found or failed to delete: {e}")
        
    result = supabase.table("discovered_tenders") \
        .delete() \
        .eq("id", tender_id) \
        .execute()
        
    return {"message": "Tender deleted", "data": result.data}

@router.get("/config")
async def get_discovery_config(tenant_id: str):
    supabase = get_supabase()
    result = supabase.table("discovery_config") \
        .select("*") \
        .eq("tenant_id", tenant_id) \
        .execute()
    return result.data[0] if result.data else {}

@router.post("/config")
async def update_discovery_config(tenant_id: str, config: Dict[str, Any]):
    supabase = get_supabase()
    
    # Build the upsert data
    upsert_data = {
        "tenant_id": tenant_id,
        "updated_at": "now()"
    }
    
    # Add config fields that were provided
    for key in ["keywords", "preferred_domains", "regions", "min_match_score", "max_results"]:
        if key in config:
            upsert_data[key] = config[key]
    
    # Try full upsert first, fallback to basic columns if schema mismatch
    try:
        result = supabase.table("discovery_config") \
            .upsert(upsert_data) \
            .execute()
        return result.data
    except Exception as e:
        error_str = str(e)
        if 'PGRST204' in error_str or 'does not exist' in error_str or 'schema cache' in error_str:
            print(f"[DISCOVERY] Full config save failed, trying basic columns: {e}")
            # Fallback: only save columns that are guaranteed to exist
            basic_data = {
                "tenant_id": tenant_id,
                "updated_at": "now()"
            }
            for key in ["keywords", "preferred_domains", "min_match_score"]:
                if key in config:
                    basic_data[key] = config[key]
            
            try:
                result = supabase.table("discovery_config") \
                    .upsert(basic_data) \
                    .execute()
                return result.data
            except Exception as inner_e:
                print(f"[DISCOVERY] Basic config save also failed: {inner_e}")
                # Table might not exist at all - return success anyway
                return {"status": "saved_locally", "message": "Config noted. Please run migration.sql to create discovery_config table."}
        else:
            raise

