from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import get_settings
from app.core.supabase import get_supabase

settings = get_settings()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Validate JWT token and return user info."""
    token = credentials.credentials
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        if user_id is None:
            print("[AUTH] JWT decoded but 'sub' claim missing")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub"
            )
        
        return {"id": user_id, "email": payload.get("email")}
    
    except JWTError as e:
        print(f"[AUTH] JWT Decode failed: {e}. Falling back to Supabase API check.")
        # Try Supabase verification
        try:
            from app.core.supabase import get_supabase
            supabase = get_supabase()
            
            # NOTE: some versions of supabase-py might need different auth handling
            # If the token is valid, get_user(token) should work.
            user_response = supabase.auth.get_user(token)
            
            if user_response and hasattr(user_response, 'user') and user_response.user:
                return {
                    "id": user_response.user.id,
                    "email": user_response.user.email
                }
            elif user_response and isinstance(user_response, dict) and 'user' in user_response:
                return {
                    "id": user_response['user']['id'],
                    "email": user_response['user']['email']
                }
        except Exception as se:
            print(f"[AUTH] Supabase verification fallback also failed: {se}")
            pass
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict | None:
    """Get current user if authenticated, None otherwise."""
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
