from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from app.core.supabase import get_supabase
from app.core.security import get_current_user
from app.schemas.company import (
    CompanyProfileCreate, CompanyProfileResponse,
    PastPerformanceCreate, PastPerformanceResponse,
    TeamProfileCreate, TeamProfileResponse,
    MemberResponse, MemberUpdate
)
from app.services.matcher import get_matcher
import json

router = APIRouter(prefix="/api/company", tags=["Company Profile"])

# --- Organization Profile ---

@router.get("/profile", response_model=CompanyProfileResponse)
async def get_company_profile(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    # Check if tenant exists
    if not user.get('tenant_id'):
        raise HTTPException(status_code=400, detail="User has no tenant assigned")
        
    result = supabase.table('company_profiles').select('*').eq('tenant_id', user['tenant_id']).execute()
    
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Company profile not set up")
        
    return result.data[0]

@router.post("/profile", response_model=CompanyProfileResponse)
async def upsert_company_profile(
    profile: CompanyProfileCreate, 
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User has no tenant assigned")
    
    print(f"[DEBUG] Upserting profile for tenant: {tenant_id}")
    try:
        # Check if exists
        existing = supabase.table('company_profiles').select('id').eq('tenant_id', tenant_id).execute()
        
        if hasattr(profile, 'model_dump'):
            data = profile.model_dump()
        else:
            data = profile.dict()
        data['tenant_id'] = tenant_id
        
        if existing.data:
            # Update
            print(f"[DEBUG] Found existing profile {existing.data[0]['id']}, updating...")
            res = supabase.table('company_profiles').update(data).eq('tenant_id', tenant_id).execute()
        else:
            # Insert
            print(f"[DEBUG] No existing profile, inserting new...")
            res = supabase.table('company_profiles').insert(data).execute()
            
        if not res.data:
            print(f"[ERROR] Supabase returned no data. Possible cause: RLS or Validation error.")
            raise HTTPException(status_code=500, detail="Database error: No data returned")
            
        # --- Sync to Knowledge Base for AI Context ---
        try:
            profile_data = res.data[0]
            
            # 1. Main Profile Sync
            kb_content = f"""
Company Legal Profile:
- Name: {profile_data.get('legal_name')}
- Tax ID: {profile_data.get('tax_id')}
- Registration: {profile_data.get('registration_number')}
- Address: {profile_data.get('company_address')}
- Website: {profile_data.get('website')}
- Contact: {profile_data.get('contact_email')} / {profile_data.get('contact_phone')}
- Capabilities: {', '.join(profile_data.get('capabilities', []))}
            """.strip()

            kb_exists = supabase.table('knowledge_base').select('id').eq('tenant_id', tenant_id).eq('category', 'Company Profile System').execute()
            kb_item_data = {
                'title': f"Official Company Profile - {profile_data.get('legal_name')}",
                'content': kb_content,
                'category': 'Company Profile System',
                'tenant_id': tenant_id,
                'is_active': True
            }

            matcher = get_matcher()
            if kb_exists.data:
                kb_id = kb_exists.data[0]['id']
                supabase.table('knowledge_base').update(kb_item_data).eq('id', kb_id).execute()
                matcher.remove_item(kb_id)
                matcher.add_item(kb_id, kb_content, {'title': kb_item_data['title'], 'category': kb_item_data['category']})
            else:
                kb_res = supabase.table('knowledge_base').insert(kb_item_data).execute()
                if kb_res.data:
                    matcher.add_item(kb_res.data[0]['id'], kb_content, {'title': kb_item_data['title'], 'category': kb_item_data['category']})

            # 2. Dedicated Certifications Sync (for visibility in KB UI)
            certs = profile_data.get('certifications', [])
            if certs:
                cert_content = "Company Certifications & Compliance:\n" + "\n".join([
                    f"- {c.get('name')} (Issuer: {c.get('issuer')}, Expiry: {c.get('expiry', 'N/A')})"
                    for c in certs if c.get('name')
                ])
                
                cert_kb_exists = supabase.table('knowledge_base').select('id').eq('tenant_id', tenant_id).eq('category', 'Certifications').execute()
                cert_kb_data = {
                    'title': f"Company Certifications - {profile_data.get('legal_name')}",
                    'content': cert_content,
                    'category': 'Certifications',
                    'tenant_id': tenant_id,
                    'is_active': True
                }
                
                if cert_kb_exists.data:
                    ckb_id = cert_kb_exists.data[0]['id']
                    supabase.table('knowledge_base').update(cert_kb_data).eq('id', ckb_id).execute()
                    matcher.remove_item(ckb_id)
                    matcher.add_item(ckb_id, cert_content, {'title': cert_kb_data['title'], 'category': 'Certifications'})
                else:
                    ckb_res = supabase.table('knowledge_base').insert(cert_kb_data).execute()
                    if ckb_res.data:
                        matcher.add_item(ckb_res.data[0]['id'], cert_content, {'title': cert_kb_data['title'], 'category': 'Certifications'})
            else:
                # If no certs, deactivate the KB item if it exists
                supabase.table('knowledge_base').update({'is_active': False}).eq('tenant_id', tenant_id).eq('category', 'Certifications').execute()

        except Exception as kb_err:
            print(f"[WARNING] Failed to sync profile to KB: {kb_err}")

        return res.data[0]
    except Exception as e:
        print(f"[CRITICAL] Profile upsert failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- Past Performance ---

@router.get("/past-performance", response_model=List[PastPerformanceResponse])
async def get_past_performance(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    if not user.get('tenant_id'):
        return []
    
    result = supabase.table('past_performance').select('*').eq('tenant_id', user['tenant_id']).execute()
    return result.data

@router.post("/past-performance", response_model=PastPerformanceResponse)
async def add_past_performance(
    item: PastPerformanceCreate, 
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    if not user.get('tenant_id'):
        raise HTTPException(status_code=400, detail="User has no tenant assigned")
        
    data = item.dict()
    data['tenant_id'] = user['tenant_id']
    
    result = supabase.table('past_performance').insert(data).execute()
    
    if result.data:
        # Sync to KB
        try:
            pp = result.data[0]
            kb_content = f"""
Case Study / Past Performance:
- Project: {pp.get('project_title')}
- Client: {pp.get('client_name')}
- Value: {pp.get('currency')} {pp.get('project_value')}
- Description: {pp.get('description')}
- Challenges: {pp.get('challenges')}
- Solution: {pp.get('solution')}
- Outcomes: {pp.get('outcomes')}
            """.strip()
            
            kb_item_data = {
                'title': f"Case Study: {pp.get('project_title')}",
                'content': kb_content,
                'category': 'Experience',
                'tenant_id': user['tenant_id'],
                'is_active': True
            }
            kb_res = supabase.table('knowledge_base').insert(kb_item_data).execute()
            if kb_res.data:
                get_matcher().add_item(kb_res.data[0]['id'], kb_content, {'title': kb_item_data['title'], 'category': 'Experience'})
        except Exception as e:
            print(f"KB Sync failed for PP: {e}")

    return result.data[0]

# --- Team Profiles ---

@router.get("/team", response_model=List[TeamProfileResponse])
async def get_team_profiles(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    if not user.get('tenant_id'):
        return []
    
    result = supabase.table('team_profiles').select('*').eq('tenant_id', user['tenant_id']).execute()
    return result.data

@router.post("/team", response_model=TeamProfileResponse)
async def add_team_profile(
    item: TeamProfileCreate, 
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User has no tenant assigned")
        
    data = item.dict()
    data['tenant_id'] = tenant_id
    
    result = supabase.table('team_profiles').insert(data).execute()
    
    if result.data:
        # Sync to KB
        try:
            member = result.data[0]
            kb_content = f"""
Expert Profile:
- Name: {member.get('full_name')}
- Designation: {member.get('designation')}
- Experience: {member.get('years_experience')} years
- Bio: {member.get('bio_summary')}
- Skills: {', '.join(member.get('skills', []))}
            """.strip()
            
            kb_item_data = {
                'title': f"Team Expert: {member.get('full_name')}",
                'content': kb_content,
                'category': 'Team',
                'tenant_id': tenant_id,
                'is_active': True
            }
            kb_res = supabase.table('knowledge_base').insert(kb_item_data).execute()
            if kb_res.data:
                get_matcher().add_item(kb_res.data[0]['id'], kb_content, {'title': kb_item_data['title'], 'category': 'Team'})
        except Exception as e:
            print(f"KB Sync failed for Team: {e}")

    return result.data[0]

@router.delete("/past-performance/{item_id}")
async def delete_past_performance(
    item_id: str,
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    # RLS handles security, but we verify tenant_id presence
    if not user.get('tenant_id'):
        raise HTTPException(status_code=403)
        
    supabase.table('past_performance').delete().eq('id', item_id).eq('tenant_id', user['tenant_id']).execute()
    return {"status": "success"}

@router.delete("/team/{member_id}")
async def delete_team_member(
    member_id: str,
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    if not user.get('tenant_id'):
        raise HTTPException(status_code=403)
        
    supabase.table('team_profiles').delete().eq('id', member_id).eq('tenant_id', user['tenant_id']).execute()
    return {"status": "success"}

# --- Enterprise Team Governance ---

@router.get("/members", response_model=List[MemberResponse])
async def get_members(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    if not tenant_id:
        return []
    
    # Only Admin/Manager can see the full list of members in this detail? 
    # For now, let all logged in tenant users see their team.
    result = supabase.table('user_profiles').select('*').eq('tenant_id', tenant_id).execute()
    return result.data

@router.put("/members/{member_id}/role")
async def update_member_role(
    member_id: str,
    update: MemberUpdate,
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    
    # Security: Only ADMIN can change roles
    if user.get('role') != 'ADMIN':
        raise HTTPException(
            status_code=403, 
            detail="Only Organization Administrators can change roles."
        )
    
    # Ensure the target member is in the same tenant
    target_profile = supabase.table('user_profiles').select('tenant_id').eq('id', member_id).single().execute()
    if not target_profile.data or target_profile.data['tenant_id'] != user['tenant_id']:
        raise HTTPException(status_code=404, detail="Member not found in your organization")

    # Update role
    result = supabase.table('user_profiles').update({
        'role': update.role.upper(),
        'updated_at': datetime.now().isoformat()
    }).eq('id', member_id).execute()
    
    return {"status": "success", "member": result.data[0]}
