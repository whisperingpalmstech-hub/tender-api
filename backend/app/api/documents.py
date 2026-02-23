"""
Document API Routes
"""
import asyncio
import json
import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import io

from app.core.supabase import get_supabase_client
from app.core.security import get_current_user
from app.worker.tasks import parse_document_task
from app.schemas import (
    DocumentResponse,
    DocumentStatusResponse,
    RequirementResponse,
    RequirementWithMatch,
    MatchReport,
    MatchSummary,
    MatchBreakdown,
)
from app.services.exporter import get_exporter, CompanyProfile

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=List[DocumentResponse])
async def get_documents(
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Get all documents for current user's tenant."""
    # If no tenant_id (e.g. migration phase), fallback to user isolation or empty
    if not user.get('tenant_id'):
        # Fallback to private mode
        result = supabase.table('documents')\
            .select('*')\
            .eq('user_id', user['id'])\
            .order('created_at', desc=True)\
            .execute()
    else:
        # Tenant mode
        result = supabase.table('documents')\
            .select('*')\
            .eq('tenant_id', user['tenant_id'])\
            .order('created_at', desc=True)\
            .execute()
    
    return result.data


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Get document by ID."""
    query = supabase.table('documents').select('*').eq('id', document_id)
    
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    else:
        query = query.eq('user_id', user['id'])
        
    result = query.single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return result.data


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: str,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Get document processing status."""
    # Query
    query = supabase.table('documents')\
        .select('id, status, processing_progress, error_message')\
        .eq('id', document_id)
        
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    else:
        query = query.eq('user_id', user['id'])
        
    result = query.single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = result.data
    
    step_labels = {
        'UPLOADED': 'Queued for processing',
        'PARSING': 'Extracting text from document',
        'EXTRACTING': 'Identifying requirements',
        'MATCHING': 'Analyzing against company data',
        'READY': 'Analysis complete',
        'ERROR': 'Processing failed',
    }
    
    return DocumentStatusResponse(
        id=doc['id'],
        status=doc['status'],
        progress=doc['processing_progress'],
        current_step=step_labels.get(doc['status'], 'Processing'),
        error=doc.get('error_message')
    )


@router.post("/{document_id}/process")
async def trigger_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Trigger document processing."""
    # Verify ownership
    # Verify ownership
    query = supabase.table('documents')\
        .select('id, status')\
        .eq('id', document_id)
        
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    else:
        query = query.eq('user_id', user['id'])
        
    result = query.single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if result.data['status'] not in ['UPLOADED', 'ERROR']:
        raise HTTPException(status_code=400, detail="Document already processing")
    
    # Queue processing via Celery
    parse_document_task.delay(document_id)
    
    return {"message": "Processing started", "document_id": document_id}


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Delete document."""
    # Verify ownership
    # Verify ownership
    query = supabase.table('documents')\
        .select('id, file_path')\
        .eq('id', document_id)
        
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    else:
        query = query.eq('user_id', user['id'])
    
    result = query.single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # --- DELETION ORDER (to avoid FK violations) ---
    try:
        # 1. Get response IDs for this document
        resp_result = supabase.table('responses').select('id').eq('document_id', document_id).execute()
        response_ids = [r['id'] for r in resp_result.data] if resp_result.data else []
        
        if response_ids:
            # 2. Delete review comments
            supabase.table('review_comments').delete().in_('response_id', response_ids).execute()
            # 3. Delete AI logs
            supabase.table('ai_percentage_log').delete().in_('response_id', response_ids).execute()
            # 4. Delete workflow history
            supabase.table('workflow_history').delete().eq('entity_type', 'response').in_('entity_id', response_ids).execute()

        # 5. Get requirement IDs for this document
        req_result = supabase.table('requirements').select('id').eq('document_id', document_id).execute()
        requirement_ids = [r['id'] for r in req_result.data] if req_result.data else []
        
        if requirement_ids:
            # 6. Delete match results
            supabase.table('match_results').delete().in_('requirement_id', requirement_ids).execute()

        # 7. Delete workflow history for the document itself
        supabase.table('workflow_history').delete().eq('entity_type', 'document').eq('entity_id', document_id).execute()

        # 8. Delete responses
        supabase.table('responses').delete().eq('document_id', document_id).execute()
        
        # 9. Delete requirements
        supabase.table('requirements').delete().eq('document_id', document_id).execute()
        
        # 10. Delete sections
        supabase.table('sections').delete().eq('document_id', document_id).execute()

        # 11. Delete from storage
        if result.data.get('file_path'):
            try:
                supabase.storage.from_('tender-documents').remove([result.data['file_path']])
                print(f"[DOCS] Deleted storage file: {result.data['file_path']}")
            except Exception as e:
                print(f"[DOCS] Storage deletion failed (continuing): {e}")

        # 11. Finally, delete the document itself
        supabase.table('documents').delete().eq('id', document_id).execute()
        print(f"[DOCS] Successfully deleted document {document_id} and all related data")

    except Exception as e:
        print(f"[ERROR] Robust deletion failed: {e}")
        # Fallback to simple delete if possible, but it likely failed already
        try:
             supabase.table('documents').delete().eq('id', document_id).execute()
        except Exception:
             raise HTTPException(status_code=500, detail=f"Database deletion failed: {str(e)}")
    
    return {"message": "Document and all related data deleted successfully"}


@router.get("/{document_id}/requirements", response_model=List[RequirementResponse])
async def get_requirements(
    document_id: str,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Get requirements for document."""
    # Verify ownership
    # Verify ownership
    query = supabase.table('documents').select('id').eq('id', document_id)
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    else:
        query = query.eq('user_id', user['id'])
    doc_result = query.single().execute()
    
    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    result = supabase.table('requirements')\
        .select('*')\
        .eq('document_id', document_id)\
        .order('extraction_order')\
        .execute()
    
    return result.data


@router.get("/{document_id}/match-summary", response_model=MatchReport)
async def get_match_summary(
    document_id: str,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Get match summary for document."""
    # Get document
    # Get document
    query = supabase.table('documents').select('id, tender_name, file_name').eq('id', document_id)
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    else:
        query = query.eq('user_id', user['id'])
    doc_result = query.single().execute()
    
    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = doc_result.data
    
    # Get summary
    summary_result = supabase.table('match_summaries')\
        .select('*')\
        .eq('document_id', document_id)\
        .single()\
        .execute()
    
    # Get requirements with matches
    req_result = supabase.table('requirements')\
        .select('*, match_results(*)')\
        .eq('document_id', document_id)\
        .order('extraction_order')\
        .execute()
    
    requirements_with_match = []
    by_category = {'ELIGIBILITY': {'total': 0, 'matched': 0}, 'TECHNICAL': {'total': 0, 'matched': 0}, 'COMPLIANCE': {'total': 0, 'matched': 0}}
    
    for req in req_result.data:
        matches = req.get('match_results', [])
        best_match = matches[0] if matches else None
        match_pct = best_match['match_percentage'] if best_match else 0
        
        requirements_with_match.append({
            **req,
            'match_percentage': match_pct,
            'matched_content': best_match['matched_content'] if best_match else None,
        })
        
        cat = req['category']
        if cat in by_category:
            by_category[cat]['total'] += 1
            if match_pct >= 50:
                by_category[cat]['matched'] += 1
    
    summary_data = summary_result.data if summary_result.data else {
        'eligibility_match': 0,
        'technical_match': 0,
        'compliance_match': 0,
        'overall_match': 0,
    }
    
    return MatchReport(
        document_id=document_id,
        tender_name=doc.get('tender_name') or doc.get('file_name', ''),
        summary=MatchSummary(
            eligibility_match=summary_data.get('eligibility_match', 0),
            technical_match=summary_data.get('technical_match', 0),
            compliance_match=summary_data.get('compliance_match', 0),
            overall_match=summary_data.get('overall_match', 0),
        ),
        breakdown={
            'eligibility': MatchBreakdown(**by_category['ELIGIBILITY']),
            'technical': MatchBreakdown(**by_category['TECHNICAL']),
            'compliance': MatchBreakdown(**by_category['COMPLIANCE']),
        },
        requirements=requirements_with_match
    )


@router.post("/{document_id}/export")
async def export_document(
    document_id: str,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Export document to enterprise-grade DOCX with dynamic KB data."""
    
    # Get document
    query = supabase.table('documents').select('id, tender_name, file_name, tenant_id').eq('id', document_id)
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    else:
        query = query.eq('user_id', user['id'])
    doc_result = query.single().execute()
    
    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = doc_result.data
    tenant_id = doc.get('tenant_id')
    
    # Get requirements
    req_result = supabase.table('requirements')\
        .select('*')\
        .eq('document_id', document_id)\
        .order('extraction_order')\
        .execute()
    
    # Get responses - Get ALL responses first
    resp_result = supabase.table('responses')\
        .select('*')\
        .eq('document_id', document_id)\
        .execute()
    
    # Fetch company profile from DB
    company_profile_data = {}
    if tenant_id:
        try:
            profile_res = supabase.table('company_profiles').select('*').eq('tenant_id', tenant_id).single().execute()
            if profile_res.data:
                company_profile_data = profile_res.data
        except Exception:
            pass

    # Fallback to local config if still empty
    if not company_profile_data:
        config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'company_profile.json')
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    company_profile_data = config.get('company', {})
            except Exception:
                pass
    
    company = CompanyProfile(
        name=company_profile_data.get('legal_name') or company_profile_data.get('name', 'TechSolutions India Pvt Ltd'),
        tagline=company_profile_data.get('tagline', 'Enterprise Digital Transformation Partners'),
        address=company_profile_data.get('company_address') or company_profile_data.get('address', 'Level 5, Cyber Tower, IT Park, Mumbai - 400076, Maharashtra'),
        phone=company_profile_data.get('contact_phone') or company_profile_data.get('phone', '+91 22 4567 8900'),
        email=company_profile_data.get('contact_email') or company_profile_data.get('email', 'proposals@techsolutions.in'),
        website=company_profile_data.get('website', 'www.techsolutions.in'),
        logo_path=company_profile_data.get('logo_path'),
        primary_color=company_profile_data.get('primary_color', '#0ea5e9'),
        accent_color=company_profile_data.get('accent_color', '#6366f1')
    )
    
    # --- Load Knowledge Base for dynamic content ---
    knowledge_base = []
    kb_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'knowledge_base.json')
    if os.path.exists(kb_path):
        try:
            with open(kb_path, 'r', encoding='utf-8') as f:
                knowledge_base = json.load(f)
        except Exception:
            pass
    
    # --- Load Match Summary for compliance snapshot ---
    match_summary = None
    try:
        summary_res = supabase.table('match_summaries')\
            .select('*')\
            .eq('document_id', document_id)\
            .single()\
            .execute()
        if summary_res.data:
            match_summary = summary_res.data
    except Exception:
        pass
    
    # Prioritize Approved responses, then Drafts
    all_reqs = req_result.data or []
    all_resps = resp_result.data or []
    final_responses = []
    
    for req in all_reqs:
        # Check for approved
        resp = next((r for r in all_resps if r['requirement_id'] == req['id'] and r['status'] == 'APPROVED'), None)
        if not resp:
            # Check for draft
            resp = next((r for r in all_resps if r['requirement_id'] == req['id']), None)
        
        if resp:
            final_responses.append(resp)
    
    exporter = get_exporter(company, knowledge_base)
    docx_bytes = await exporter.export_to_docx(
        tender_name=doc.get('tender_name') or doc.get('file_name', 'Tender Response'),
        responses=final_responses,
        requirements=all_reqs,
        recipient_name="",
        match_summary=match_summary,
        company_data=company_profile_data,
    )
    
    # Log export
    supabase.table('exports').insert({
        'document_id': document_id,
        'export_type': 'DOCX',
        'exported_by': user['id'],
        'tenant_id': user.get('tenant_id')
    }).execute()
    
    filename = f"{doc.get('tender_name', 'tender-response')}.docx"
    
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

