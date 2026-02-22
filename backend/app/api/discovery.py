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
async def list_discovered_tenders(tenant_id: str, status: str = "PENDING", min_score: int = 30):
    """
    List discovered tenders for approval.
    Only returns tenders that:
    1. Match the minimum score threshold (aligned with company knowledge base)
    2. Are NOT expired (submission_deadline is in the future or not set)
    """
    from datetime import datetime
    
    supabase = get_supabase()
    query = supabase.table("discovered_tenders") \
        .select("*, tender_attachments(*)") \
        .eq("tenant_id", tenant_id)
    
    if status:
        query = query.eq("status", status)
    
    # Only return tenders that meet the minimum match score (KB relevance filter)
    query = query.gte("match_score", min_score)
    
    # Filter out expired tenders (deadline already passed)
    now_iso = datetime.now().isoformat()
    # We use an OR filter: deadline is null (no expiry set) OR deadline is in the future
    query = query.or_(f"submission_deadline.is.null,submission_deadline.gt.{now_iso}")
        
    result = query.order("match_score", desc=True).execute()
    return result.data

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
    # Upsert config
    result = supabase.table("discovery_config") \
        .upsert({
            "tenant_id": tenant_id,
            **config,
            "updated_at": "now()"
        }) \
        .execute()
    return result.data
