from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PARSING = "PARSING"
    EXTRACTING = "EXTRACTING"
    MATCHING = "MATCHING"
    READY = "READY"
    ERROR = "ERROR"


class RequirementCategory(str, Enum):
    ELIGIBILITY = "ELIGIBILITY"
    TECHNICAL = "TECHNICAL"
    COMPLIANCE = "COMPLIANCE"


class ResponseStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    EXPORTED = "EXPORTED"


# Document Schemas
class DocumentBase(BaseModel):
    file_name: str
    tender_name: Optional[str] = None


class DocumentCreate(DocumentBase):
    file_path: str
    file_type: Optional[str] = None
    file_size_bytes: Optional[int] = None


class DocumentUpdate(BaseModel):
    tender_name: Optional[str] = None
    status: Optional[DocumentStatus] = None
    processing_progress: Optional[int] = None
    error_message: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: str
    user_id: str
    file_path: str
    file_type: Optional[str]
    file_size_bytes: Optional[int]
    status: DocumentStatus
    processing_progress: int
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentStatusResponse(BaseModel):
    id: str
    status: DocumentStatus
    progress: int
    current_step: str
    error: Optional[str] = None


# Requirement Schemas
class RequirementBase(BaseModel):
    requirement_text: str
    category: RequirementCategory
    subcategory: Optional[str] = None
    confidence_score: Optional[float] = None
    page_number: Optional[int] = None


class RequirementCreate(RequirementBase):
    document_id: str
    extraction_order: Optional[int] = None


class RequirementResponse(RequirementBase):
    id: str
    document_id: str
    extraction_order: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class RequirementWithMatch(RequirementResponse):
    match_percentage: Optional[float] = None
    matched_content: Optional[str] = None


# Match Schemas
class MatchResultCreate(BaseModel):
    document_id: str
    requirement_id: str
    kb_item_id: Optional[str] = None
    match_percentage: float
    matched_content: Optional[str] = None
    rank: Optional[int] = None


class MatchSummary(BaseModel):
    eligibility_match: float
    technical_match: float
    compliance_match: float
    overall_match: float


class MatchBreakdown(BaseModel):
    total: int
    matched: int


class MatchReport(BaseModel):
    document_id: str
    tender_name: str
    summary: MatchSummary
    breakdown: dict[str, MatchBreakdown]
    requirements: List[RequirementWithMatch]


# Response Schemas
class ResponseBase(BaseModel):
    response_text: str


class ResponseCreate(ResponseBase):
    document_id: str
    requirement_id: Optional[str] = None


class ResponseUpdate(BaseModel):
    response_text: Optional[str] = None
    status: Optional[ResponseStatus] = None


class ResponseResponse(ResponseBase):
    id: str
    document_id: str
    requirement_id: Optional[str]
    status: ResponseStatus
    version: int
    created_by: Optional[str]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GenerateResponsesRequest(BaseModel):
    requirement_ids: List[str]
    response_style: Optional[str] = "professional"
    mode: Optional[str] = "balanced"
    tone: Optional[str] = "professional"


# Knowledge Base Schemas
class KnowledgeBaseCreate(BaseModel):
    title: Optional[str] = None
    content: str
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class KnowledgeBaseUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class KnowledgeBaseResponse(BaseModel):
    id: str
    title: Optional[str]
    content: str
    category: Optional[str]
    tags: Optional[List[str]]
    version: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Export Schemas
class ExportRequest(BaseModel):
    format: str = "docx"
    include_requirements: bool = True


class ExportResponse(BaseModel):
    id: str
    document_id: str
    file_path: str
    created_at: datetime
