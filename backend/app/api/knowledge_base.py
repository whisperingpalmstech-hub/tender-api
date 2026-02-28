"""
Knowledge Base API Routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.core.supabase import get_supabase_client
from app.core.security import get_current_user
from app.schemas import KnowledgeBaseCreate, KnowledgeBaseUpdate, KnowledgeBaseResponse
from app.services.matcher import get_matcher

router = APIRouter(prefix="/api/knowledge-base", tags=["knowledge-base"])


@router.get("", response_model=List[KnowledgeBaseResponse])
async def get_knowledge_base(user: dict = Depends(get_current_user), supabase = Depends(get_supabase_client)):
    query = supabase.table('knowledge_base').select('*').eq('is_active', True).order('created_at', desc=True)
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    
    result = query.execute()
    return result.data


@router.post("", response_model=KnowledgeBaseResponse)
async def create_item(item: KnowledgeBaseCreate, user: dict = Depends(get_current_user), supabase = Depends(get_supabase_client)):
    tenant_id = user.get('tenant_id')
    result = supabase.table('knowledge_base').insert({
        'title': item.title, 
        'content': item.content, 
        'category': item.category, 
        'tags': item.tags, 
        'version': 1, 
        'is_active': True,
        'tenant_id': tenant_id
    }).execute()
    new_item = result.data[0]
    matcher = get_matcher()
    matcher.add_item(item_id=new_item['id'], content=item.content, metadata={'title': item.title, 'category': item.category, 'tenant_id': tenant_id})
    return new_item


@router.put("/{item_id}", response_model=KnowledgeBaseResponse)
async def update_item(item_id: str, update: KnowledgeBaseUpdate, user: dict = Depends(get_current_user), supabase = Depends(get_supabase_client)):
    tenant_id = user.get('tenant_id')
    query = supabase.table('knowledge_base').select('*').eq('id', item_id).eq('is_active', True)
    if tenant_id:
        query = query.eq('tenant_id', tenant_id)
    existing = query.single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Item not found")
    update_data = {}
    if update.content is not None:
        update_data['content'] = update.content
    if update.title is not None:
        update_data['title'] = update.title
    if update.category is not None:
        update_data['category'] = update.category
    if update_data:
        update_data['version'] = existing.data['version'] + 1
        result = supabase.table('knowledge_base').update(update_data).eq('id', item_id).execute()
        if update.content:
            matcher = get_matcher()
            matcher.remove_item(item_id)
            matcher.add_item(item_id=item_id, content=update.content, metadata={'title': update.title or existing.data['title'], 'tenant_id': existing.data.get('tenant_id')})
        return result.data[0]
    return existing.data


@router.delete("/{item_id}")
async def delete_item(item_id: str, user: dict = Depends(get_current_user), supabase = Depends(get_supabase_client)):
    # Verify existence and tenant
    query = supabase.table('knowledge_base').select('id').eq('id', item_id)
    if user.get('tenant_id'):
        query = query.eq('tenant_id', user['tenant_id'])
    if not query.execute().data:
        raise HTTPException(status_code=404, detail="Item not found")

    supabase.table('knowledge_base').update({'is_active': False}).eq('id', item_id).execute()
    get_matcher().remove_item(item_id)
    return {"message": "Item deleted"}


@router.post("/sync")
async def sync_knowledge_base(user: dict = Depends(get_current_user), supabase = Depends(get_supabase_client)):
    """Sync FAISS index with all active items across ALL tenants in database to preserve multi-tenancy."""
    # Always pull for all tenants so we don't wipe out other organizations' knowledge base
    query = supabase.table('knowledge_base').select('*').eq('is_active', True)
    
    result = query.execute()
    matcher = get_matcher()
    matcher.sync_with_database(result.data)
    return {"message": "Global knowledge base synced", "count": len(result.data)}
