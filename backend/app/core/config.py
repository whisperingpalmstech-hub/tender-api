from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str
    
    # LLM Settings (Groq/Grok/Mistral)
    llm_api_url: str = "https://api.groq.com/openai/v1"
    llm_api_key: Optional[str] = None
    llm_model: str = "llama-3.1-70b-versatile"
    
    # FAISS
    faiss_index_path: str = "./data/faiss.index"
    knowledge_base_path: str = "./data/knowledge_base.json"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    tesseract_path: Optional[str] = "/usr/bin/tesseract"
    
    # Security
    jwt_secret: str = "development-secret-key"
    jwt_algorithm: str = "HS256"
    

    # AI Content Control
    max_ai_percentage: float = 30.0
    max_regeneration_attempts: int = 3
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    return Settings()
