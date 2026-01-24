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
from app.schemas import (
    DocumentResponse,
    DocumentStatusResponse,
    RequirementResponse,
    RequirementWithMatch,
    MatchReport,
    MatchSummary,
    MatchBreakdown,
)
from app.services.pipeline import process_document_async
from app.services.exporter import get_exporter, CompanyProfile

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=List[DocumentResponse])
async def get_documents(
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Get all documents for current user."""
    result = supabase.table('documents')\
        .select('*')\
        .eq('user_id', user['id'])\
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
    result = supabase.table('documents')\
        .select('*')\
        .eq('id', document_id)\
        .eq('user_id', user['id'])\
        .single()\
        .execute()
    
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
    result = supabase.table('documents')\
        .select('id, status, processing_progress, error_message')\
        .eq('id', document_id)\
        .eq('user_id', user['id'])\
        .single()\
        .execute()
    
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
    result = supabase.table('documents')\
        .select('id, status')\
        .eq('id', document_id)\
        .eq('user_id', user['id'])\
        .single()\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if result.data['status'] not in ['UPLOADED', 'ERROR']:
        raise HTTPException(status_code=400, detail="Document already processing")
    
    # Queue processing
    background_tasks.add_task(process_document_async, document_id)
    
    return {"message": "Processing started", "document_id": document_id}


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Delete document."""
    # Verify ownership
    result = supabase.table('documents')\
        .select('id, file_path')\
        .eq('id', document_id)\
        .eq('user_id', user['id'])\
        .single()\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from storage
    try:
        supabase.storage.from_('tender-documents').remove([result.data['file_path']])
    except Exception:
        pass  # Continue even if storage delete fails
    
    # Delete from database (cascades to related tables)
    supabase.table('documents').delete().eq('id', document_id).execute()
    
    return {"message": "Document deleted"}


@router.get("/{document_id}/requirements", response_model=List[RequirementResponse])
async def get_requirements(
    document_id: str,
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """Get requirements for document."""
    # Verify ownership
    doc_result = supabase.table('documents')\
        .select('id')\
        .eq('id', document_id)\
        .eq('user_id', user['id'])\
        .single()\
        .execute()
    
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
    doc_result = supabase.table('documents')\
        .select('id, tender_name, file_name')\
        .eq('id', document_id)\
        .eq('user_id', user['id'])\
        .single()\
        .execute()
    
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
    """Export document to DOCX."""
    
    # Get document
    doc_result = supabase.table('documents')\
        .select('id, tender_name, file_name')\
        .eq('id', document_id)\
        .eq('user_id', user['id'])\
        .single()\
        .execute()
    
    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = doc_result.data
    
    # Get requirements
    req_result = supabase.table('requirements')\
        .select('*')\
        .eq('document_id', document_id)\
        .order('extraction_order')\
        .execute()
    
    # Get responses
    resp_result = supabase.table('responses')\
        .select('*')\
        .eq('document_id', document_id)\
        .eq('status', 'APPROVED')\
        .execute()
    
    # Load company profile from config file
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'company_profile.json')
    
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            company_config = config.get('company', {})
    else:
        company_config = {}
    
    company = CompanyProfile(
        name=company_config.get('name', 'Your Company Name'),
        tagline=company_config.get('tagline', 'Your Company Tagline'),
        address=company_config.get('address', 'Company Address'),
        phone=company_config.get('phone', '+91 XXXXXXXXXX'),
        email=company_config.get('email', 'info@company.com'),
        website=company_config.get('website', 'www.company.com'),
        logo_path=company_config.get('logo_path'),
        primary_color=company_config.get('primary_color', '#1e3a8a'),
        accent_color=company_config.get('accent_color', '#3b82f6')
    )
    
    exporter = get_exporter(company)
    docx_bytes = await exporter.export_to_docx(
        tender_name=doc.get('tender_name') or doc.get('file_name', 'Tender Response'),
        responses=resp_result.data or [],
        requirements=req_result.data or [],
        recipient_name=""  # Can be fetched from document metadata if available
    )
    
    # Log export
    supabase.table('exports').insert({
        'document_id': document_id,
        'export_type': 'DOCX',
        'exported_by': user['id'],
    }).execute()
    
    filename = f"{doc.get('tender_name', 'tender-response')}.docx"
    
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
