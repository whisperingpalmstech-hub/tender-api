"""
FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import documents, responses, knowledge_base, humanize
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
app.include_router(humanize.router)  # Standalone AI Humanizer
app.include_router(humanize.root_router) # Unified Endpoint


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "Tender Analysis API", "docs": "/docs"}
