import sys
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests as http_requests

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from app.api import documents, responses, knowledge_base, humanize, discovery, admin
from app.api.company import routes as company_routes
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Tender Analysis API",
    description="Backend API for Tender Analysis & Response System + Standalone AI Humanizer",
    version="1.0.0",
    docs_url="/docs",  # Always enable for testing
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router)
app.include_router(responses.router)
app.include_router(knowledge_base.router)
app.include_router(company_routes.router)
app.include_router(humanize.router)  # Standalone AI Humanizer
app.include_router(humanize.root_router) # Unified Endpoint
app.include_router(discovery.router)
app.include_router(admin.router)


# --- Startup Migration ---
def run_schema_migration():
    """Check and add missing columns to user_profiles on startup."""
    try:
        headers = {
            "apikey": settings.supabase_service_key,
            "Authorization": f"Bearer {settings.supabase_service_key}",
        }
        
        required_columns = {
            "email": "TEXT",
            "designation": "TEXT", 
            "department": "TEXT",
            "is_active": "BOOLEAN DEFAULT TRUE",
            "updated_at": "TIMESTAMPTZ DEFAULT NOW()",
            "created_at": "TIMESTAMPTZ DEFAULT NOW()",
        }
        
        missing = []
        for col_name in required_columns:
            resp = http_requests.get(
                f"{settings.supabase_url}/rest/v1/user_profiles?select={col_name}&limit=0",
                headers=headers,
                timeout=5
            )
            if resp.status_code != 200:
                missing.append(col_name)
        
        if not missing:
            print("[MIGRATION] ✓ All user_profiles columns exist.")
            return
        
        print(f"[MIGRATION] Missing columns detected: {missing}")
        print(f"[MIGRATION] Please run the following SQL in Supabase Dashboard > SQL Editor:")
        print("-" * 60)
        for col_name in missing:
            col_type = required_columns[col_name]
            print(f"ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
        print("-" * 60)
        print("[MIGRATION] The admin panel may not work correctly until these columns are added.")
        
    except Exception as e:
        print(f"[MIGRATION] Could not check schema: {e}")


@app.on_event("startup")
async def startup_event():
    """Run migrations on startup."""
    run_schema_migration()


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "Tender Analysis API", "docs": "/docs"}

