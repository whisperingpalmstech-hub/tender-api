import { Database } from './database';

// Document types
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentStatus = Document['status'];

// Requirement types
export type Requirement = Database['public']['Tables']['requirements']['Row'];
export type RequirementCategory = Requirement['category'];

// Response types
export type Response = Database['public']['Tables']['responses']['Row'];
export type ResponseStatus = Response['status'];

// Match types
export type MatchResult = Database['public']['Tables']['match_results']['Row'];
export type MatchSummary = Database['public']['Tables']['match_summaries']['Row'];

// Knowledge Base types
export type KnowledgeBaseItem = Database['public']['Tables']['knowledge_base']['Row'];

// User types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserRole = UserProfile['role'];

// API Response types
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Document with relations
export interface DocumentWithRelations extends Document {
    requirements?: Requirement[];
    match_summary?: MatchSummary;
    responses?: Response[];
}

// Requirement with match data
export interface RequirementWithMatch extends Requirement {
    match_percentage?: number;
    matched_content?: string;
    response?: Response;
}

// Match report for UI
export interface MatchReport {
    document_id: string;
    tender_name: string;
    summary: {
        eligibility_match: number;
        technical_match: number;
        compliance_match: number;
        overall_match: number;
    };
    breakdown: {
        eligibility: { total: number; matched: number };
        technical: { total: number; matched: number };
        compliance: { total: number; matched: number };
    };
    requirements: RequirementWithMatch[];
}

// Upload state
export interface UploadState {
    file: File | null;
    uploading: boolean;
    progress: number;
    error: string | null;
}

// Processing status
export interface ProcessingStatus {
    status: DocumentStatus;
    progress: number;
    currentStep: string;
    error?: string;
}
