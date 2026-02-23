"""
Admin API Routes
Full user lifecycle management for organization administrators
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.supabase import get_supabase
from app.core.security import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# --- Schemas ---

class InviteUserRequest(BaseModel):
    email: str
    full_name: str
    role: str = "BID_WRITER"
    designation: Optional[str] = None
    department: Optional[str] = None

class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class CreateRoleRequest(BaseModel):
    role_name: str
    description: Optional[str] = None
    permissions: List[str] = []

class UserResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    designation: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None

# --- Helpers ---

def require_admin(user: dict):
    """Ensure the user is an ADMIN."""
    if user.get('role') != 'ADMIN':
        raise HTTPException(
            status_code=403,
            detail="Only Organization Administrators can perform this action."
        )

# --- User Management Endpoints ---

@router.get("/users", response_model=List[UserResponse])
async def list_users(user: dict = Depends(get_current_user)):
    """List all users in the organization."""
    require_admin(user)
    
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    if not tenant_id:
        return []
    
    try:
        result = supabase.table('user_profiles') \
            .select('*') \
            .eq('tenant_id', tenant_id) \
            .execute()
    except Exception as e:
        print(f"[ADMIN] Full select failed, trying basic columns: {e}")
        # Fallback: only query columns that definitely exist
        result = supabase.table('user_profiles') \
            .select('id, full_name, role, is_active') \
            .eq('tenant_id', tenant_id) \
            .execute()
    
    # Try to get emails from Supabase Auth admin API
    email_map = {}
    try:
        auth_client = get_supabase()
        # Use admin list to get emails for these user IDs
        user_ids = [p['id'] for p in (result.data or [])]
        for uid in user_ids:
            try:
                auth_user = auth_client.auth.admin.get_user_by_id(uid)
                if auth_user and hasattr(auth_user, 'user') and auth_user.user:
                    email_map[uid] = auth_user.user.email
            except Exception:
                pass
    except Exception as e:
        print(f"[ADMIN] Could not fetch auth emails: {e}")
    
    users = []
    for profile in (result.data or []):
        uid = profile['id']
        users.append({
            'id': uid,
            'full_name': profile.get('full_name'),
            'email': email_map.get(uid, profile.get('email')),
            'role': profile.get('role', 'USER'),
            'designation': profile.get('designation'),
            'department': profile.get('department'),
            'is_active': profile.get('is_active', True),
            'created_at': profile.get('created_at'),
        })
    
    return users


@router.post("/users/invite")
async def invite_user(
    request: InviteUserRequest,
    user: dict = Depends(get_current_user)
):
    """Invite a new user to the organization.
    
    Creates a Supabase Auth account and user_profiles entry so the 
    invited user can immediately log in with a temporary password.
    """
    require_admin(user)
    
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant assigned")
    
    # Check if user with this email already exists in the tenant
    try:
        tenant_profiles = supabase.table('user_profiles') \
            .select('id') \
            .eq('tenant_id', tenant_id) \
            .execute()
        
        for p in (tenant_profiles.data or []):
            try:
                auth_user = supabase.auth.admin.get_user_by_id(p['id'])
                if auth_user and hasattr(auth_user, 'user') and auth_user.user:
                    if auth_user.user.email == request.email:
                        raise HTTPException(
                            status_code=409, 
                            detail="User with this email already exists in your organization"
                        )
            except HTTPException:
                raise
            except Exception:
                pass
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Email duplicate check failed: {e}")
    
    # Generate a temporary password for the new user
    import secrets
    temp_password = secrets.token_urlsafe(12)  # e.g. "aB3_dEf-GhI1"
    
    # Step 1: Create user in Supabase Auth
    new_user_id = None
    try:
        # Try to create a new auth user
        auth_response = supabase.auth.admin.create_user({
            "email": request.email,
            "password": temp_password,
            "email_confirm": True,  # Auto-confirm so they can log in immediately
            "user_metadata": {
                "full_name": request.full_name,
                "org_name": tenant_id,
            }
        })
        
        if auth_response and hasattr(auth_response, 'user') and auth_response.user:
            new_user_id = auth_response.user.id
            print(f"[ADMIN] Created auth user: {new_user_id} for {request.email}")
        else:
            raise Exception("Auth user creation returned no user object")
            
    except Exception as e:
        error_str = str(e)
        # If user already exists in Auth (but not in this tenant), find their ID
        if 'already been registered' in error_str or 'already exists' in error_str:
            try:
                # Find existing auth user
                all_users = supabase.auth.admin.list_users()
                for au in (all_users if isinstance(all_users, list) else []):
                    au_obj = au if hasattr(au, 'email') else None
                    if au_obj and au_obj.email == request.email:
                        new_user_id = au_obj.id
                        break
                
                if not new_user_id:
                    raise HTTPException(
                        status_code=400,
                        detail="User exists in auth but could not be found. Please try again."
                    )
                    
                print(f"[ADMIN] Found existing auth user: {new_user_id}")
                temp_password = None  # User already has a password
                
            except HTTPException:
                raise
            except Exception as lookup_err:
                print(f"[ADMIN] Auth user lookup failed: {lookup_err}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create user account: {error_str}"
                )
        else:
            print(f"[ADMIN] Auth user creation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create user account: {error_str}"
            )
    
    # Step 2: Create user_profiles entry linking user to this tenant
    if new_user_id:
        profile_data = {
            'id': new_user_id,
            'tenant_id': tenant_id,
            'role': request.role.upper(),
            'full_name': request.full_name,
        }
        
        # Try with optional columns first, fallback to basic
        try:
            full_profile = {
                **profile_data,
                'email': request.email,
                'designation': request.designation,
                'department': request.department,
                'is_active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
            }
            supabase.table('user_profiles').upsert(full_profile).execute()
        except Exception as upsert_err:
            err_str = str(upsert_err)
            if 'PGRST204' in err_str or 'does not exist' in err_str or 'schema cache' in err_str:
                print(f"[ADMIN] Upsert with optional fields failed, using basic: {upsert_err}")
                supabase.table('user_profiles').upsert(profile_data).execute()
            else:
                raise
    
    # Step 3: Also save to pending_invitations for record keeping
    try:
        insert_data = {
            'email': request.email,
            'tenant_id': tenant_id,
            'role': request.role.upper(),
            'full_name': request.full_name,
            'invited_by': user['id'],
            'status': 'COMPLETED' if new_user_id else 'PENDING',
        }
        if request.designation:
            insert_data['designation'] = request.designation
        if request.department:
            insert_data['department'] = request.department
        supabase.table('pending_invitations').insert(insert_data).execute()
    except Exception as e:
        print(f"[ADMIN] pending_invitations insert failed: {e}")
    
    # Build response
    response = {
        "status": "created",
        "message": f"User account created for {request.email} with role {request.role}.",
        "user_id": new_user_id,
    }
    
    if temp_password:
        response["temp_password"] = temp_password
        response["message"] += f" Temporary password: {temp_password} — Please share this securely with the user. They can change it after logging in."
    else:
        response["status"] = "assigned"
        response["message"] = f"Existing user {request.email} has been assigned to your organization with role {request.role}. They can log in with their existing password."
    
    return response


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    user: dict = Depends(get_current_user)
):
    """Update a user's role, designation, department, or active status."""
    require_admin(user)
    
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    
    # Verify the target user belongs to the same tenant
    target = supabase.table('user_profiles') \
        .select('id, tenant_id, role') \
        .eq('id', user_id) \
        .single() \
        .execute()
    
    if not target.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target.data.get('tenant_id') != tenant_id:
        raise HTTPException(status_code=403, detail="User is not in your organization")
    
    # Prevent admin from demoting themselves
    if user_id == user['id'] and request.role and request.role.upper() != 'ADMIN':
        raise HTTPException(status_code=400, detail="You cannot change your own admin role")
    
    # Build update data - include all fields
    update_data = {}
    if request.role is not None:
        update_data['role'] = request.role.upper()
    if request.full_name is not None:
        update_data['full_name'] = request.full_name
    
    # Optional columns that may not exist in schema yet
    optional_fields = {}
    if request.designation is not None:
        optional_fields['designation'] = request.designation
    if request.department is not None:
        optional_fields['department'] = request.department
    if request.is_active is not None:
        optional_fields['is_active'] = request.is_active
    optional_fields['updated_at'] = datetime.now().isoformat()
    
    # Try full update first, fallback to basic columns if schema mismatch
    try:
        full_data = {**update_data, **optional_fields}
        result = supabase.table('user_profiles') \
            .update(full_data) \
            .eq('id', user_id) \
            .execute()
    except Exception as e:
        error_msg = str(e)
        if 'PGRST204' in error_msg or 'does not exist' in error_msg or 'schema cache' in error_msg:
            print(f"[ADMIN] Some columns missing, updating basic fields only: {e}")
            if not update_data:
                update_data = {'role': target.data.get('role', 'USER')}  # no-op update
            result = supabase.table('user_profiles') \
                .update(update_data) \
                .eq('id', user_id) \
                .execute()
        else:
            raise
    
    return {
        "status": "success",
        "message": "User updated successfully",
        "user": result.data[0] if result.data else None
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    user: dict = Depends(get_current_user)
):
    """Remove a user from the organization."""
    require_admin(user)
    
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    
    # Cannot delete yourself
    if user_id == user['id']:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    
    # Verify the target user belongs to the same tenant
    target = supabase.table('user_profiles') \
        .select('id, tenant_id') \
        .eq('id', user_id) \
        .single() \
        .execute()
    
    if not target.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target.data.get('tenant_id') != tenant_id:
        raise HTTPException(status_code=403, detail="User is not in your organization")
    
    # Soft delete: clear tenant_id and reset role
    try:
        supabase.table('user_profiles') \
            .update({
                'is_active': False,
                'tenant_id': None,
                'role': 'USER',
                'updated_at': datetime.now().isoformat(),
            }) \
            .eq('id', user_id) \
            .execute()
    except Exception as e:
        error_msg = str(e)
        if 'PGRST204' in error_msg or 'does not exist' in error_msg or 'schema cache' in error_msg:
            print(f"[ADMIN] Some columns missing, using basic delete: {e}")
            supabase.table('user_profiles') \
                .update({
                    'tenant_id': None,
                    'role': 'USER',
                }) \
                .eq('id', user_id) \
                .execute()
        else:
            raise
    
    return {"status": "success", "message": "User removed from organization"}


# --- Role Management ---

@router.get("/roles")
async def list_roles(user: dict = Depends(get_current_user)):
    """List available roles for the organization."""
    require_admin(user)
    
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    
    # Try to get custom roles
    try:
        result = supabase.table('custom_roles') \
            .select('*') \
            .eq('tenant_id', tenant_id) \
            .execute()
        
        custom_roles = result.data or []
    except Exception:
        custom_roles = []
    
    # Default system roles
    default_roles = [
        {"role_name": "ADMIN", "description": "Full access - manage users, settings, and all operations", "is_system": True},
        {"role_name": "MANAGER", "description": "Approve responses, manage knowledge base, view analytics", "is_system": True},
        {"role_name": "BID_WRITER", "description": "Upload documents, write and submit bid responses", "is_system": True},
        {"role_name": "AUDITOR", "description": "Read-only access for compliance review", "is_system": True},
    ]
    
    return {
        "default_roles": default_roles,
        "custom_roles": custom_roles,
    }


@router.post("/roles")
async def create_role(
    request: CreateRoleRequest,
    user: dict = Depends(get_current_user)
):
    """Create a custom role for the organization."""
    require_admin(user)
    
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    
    # Check for duplicate
    system_roles = ['ADMIN', 'MANAGER', 'BID_WRITER', 'AUDITOR', 'USER']
    if request.role_name.upper() in system_roles:
        raise HTTPException(status_code=400, detail="Cannot override system roles")
    
    try:
        result = supabase.table('custom_roles').insert({
            'tenant_id': tenant_id,
            'role_name': request.role_name.upper(),
            'description': request.description,
            'permissions': request.permissions,
        }).execute()
        
        return {"status": "success", "role": result.data[0] if result.data else None}
    except Exception as e:
        print(f"[ADMIN] Role creation failed: {e}")
        # If custom_roles table doesn't exist, just return the role as text
        return {
            "status": "success",
            "role": {"role_name": request.role_name.upper(), "description": request.description},
            "note": "Custom roles table not yet created. Role can still be assigned to users."
        }


@router.delete("/roles/{role_name}")
async def delete_role(
    role_name: str,
    user: dict = Depends(get_current_user)
):
    """Delete a custom role."""
    require_admin(user)
    
    system_roles = ['ADMIN', 'MANAGER', 'BID_WRITER', 'AUDITOR', 'USER']
    if role_name.upper() in system_roles:
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
    
    supabase = get_supabase()
    tenant_id = user.get('tenant_id')
    
    try:
        supabase.table('custom_roles') \
            .delete() \
            .eq('tenant_id', tenant_id) \
            .eq('role_name', role_name.upper()) \
            .execute()
    except Exception:
        pass
    
    return {"status": "success", "message": f"Role {role_name} deleted"}
