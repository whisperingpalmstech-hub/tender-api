export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// Type for table relationships (required by @supabase/postgrest-js)
type GenericRelationship = {
    foreignKeyName: string;
    columns: string[];
    isOneToOne?: boolean;
    referencedRelation: string;
    referencedColumns: string[];
};

export interface Database {
    public: {
        Tables: {
            user_profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    department: string | null;
                    role: 'USER' | 'REVIEWER' | 'ADMIN';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    department?: string | null;
                    role?: 'USER' | 'REVIEWER' | 'ADMIN';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    department?: string | null;
                    role?: 'USER' | 'REVIEWER' | 'ADMIN';
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: GenericRelationship[];
            };
            documents: {
                Row: {
                    id: string;
                    user_id: string;
                    file_name: string;
                    file_path: string;
                    file_type: string | null;
                    file_size_bytes: number | null;
                    tender_name: string | null;
                    status: 'UPLOADED' | 'PARSING' | 'EXTRACTING' | 'MATCHING' | 'READY' | 'ERROR';
                    processing_progress: number;
                    error_message: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    file_name: string;
                    file_path: string;
                    file_type?: string | null;
                    file_size_bytes?: number | null;
                    tender_name?: string | null;
                    status?: 'UPLOADED' | 'PARSING' | 'EXTRACTING' | 'MATCHING' | 'READY' | 'ERROR';
                    processing_progress?: number;
                    error_message?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    file_name?: string;
                    file_path?: string;
                    file_type?: string | null;
                    file_size_bytes?: number | null;
                    tender_name?: string | null;
                    status?: 'UPLOADED' | 'PARSING' | 'EXTRACTING' | 'MATCHING' | 'READY' | 'ERROR';
                    processing_progress?: number;
                    error_message?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: GenericRelationship[];
            };
            requirements: {
                Row: {
                    id: string;
                    document_id: string;
                    requirement_text: string;
                    category: 'ELIGIBILITY' | 'TECHNICAL' | 'COMPLIANCE';
                    subcategory: string | null;
                    confidence_score: number | null;
                    page_number: number | null;
                    extraction_order: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    requirement_text: string;
                    category: 'ELIGIBILITY' | 'TECHNICAL' | 'COMPLIANCE';
                    subcategory?: string | null;
                    confidence_score?: number | null;
                    page_number?: number | null;
                    extraction_order?: number | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    requirement_text?: string;
                    category?: 'ELIGIBILITY' | 'TECHNICAL' | 'COMPLIANCE';
                    subcategory?: string | null;
                    confidence_score?: number | null;
                    page_number?: number | null;
                    extraction_order?: number | null;
                    created_at?: string;
                };
                Relationships: GenericRelationship[];
            };
            knowledge_base: {
                Row: {
                    id: string;
                    title: string | null;
                    content: string;
                    category: string | null;
                    tags: string[] | null;
                    source_file: string | null;
                    version: number;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    title?: string | null;
                    content: string;
                    category?: string | null;
                    tags?: string[] | null;
                    source_file?: string | null;
                    version?: number;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    title?: string | null;
                    content?: string;
                    category?: string | null;
                    tags?: string[] | null;
                    source_file?: string | null;
                    version?: number;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: GenericRelationship[];
            };
            match_results: {
                Row: {
                    id: string;
                    document_id: string;
                    requirement_id: string;
                    kb_item_id: string | null;
                    match_percentage: number;
                    matched_content: string | null;
                    rank: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    requirement_id: string;
                    kb_item_id?: string | null;
                    match_percentage: number;
                    matched_content?: string | null;
                    rank?: number | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    requirement_id?: string;
                    kb_item_id?: string | null;
                    match_percentage?: number;
                    matched_content?: string | null;
                    rank?: number | null;
                    created_at?: string;
                };
                Relationships: GenericRelationship[];
            };
            match_summaries: {
                Row: {
                    id: string;
                    document_id: string;
                    eligibility_match: number | null;
                    technical_match: number | null;
                    compliance_match: number | null;
                    overall_match: number | null;
                    total_requirements: number | null;
                    matched_requirements: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    eligibility_match?: number | null;
                    technical_match?: number | null;
                    compliance_match?: number | null;
                    overall_match?: number | null;
                    total_requirements?: number | null;
                    matched_requirements?: number | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    eligibility_match?: number | null;
                    technical_match?: number | null;
                    compliance_match?: number | null;
                    overall_match?: number | null;
                    total_requirements?: number | null;
                    matched_requirements?: number | null;
                    created_at?: string;
                };
                Relationships: GenericRelationship[];
            };
            responses: {
                Row: {
                    id: string;
                    document_id: string;
                    requirement_id: string | null;
                    response_text: string;
                    status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'EXPORTED';
                    version: number;
                    created_by: string | null;
                    approved_by: string | null;
                    approved_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    requirement_id?: string | null;
                    response_text: string;
                    status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'EXPORTED';
                    version?: number;
                    created_by?: string | null;
                    approved_by?: string | null;
                    approved_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    requirement_id?: string | null;
                    response_text?: string;
                    status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'EXPORTED';
                    version?: number;
                    created_by?: string | null;
                    approved_by?: string | null;
                    approved_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: GenericRelationship[];
            };
            exports: {
                Row: {
                    id: string;
                    document_id: string;
                    export_type: string;
                    file_path: string | null;
                    exported_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    export_type?: string;
                    file_path?: string | null;
                    exported_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    export_type?: string;
                    file_path?: string | null;
                    exported_by?: string | null;
                    created_at?: string;
                };
                Relationships: GenericRelationship[];
            };
            audit_log: {
                Row: {
                    id: string;
                    entity_type: string | null;
                    entity_id: string | null;
                    action: string | null;
                    user_id: string | null;
                    previous_value: Json | null;
                    new_value: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    entity_type?: string | null;
                    entity_id?: string | null;
                    action?: string | null;
                    user_id?: string | null;
                    previous_value?: Json | null;
                    new_value?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    entity_type?: string | null;
                    entity_id?: string | null;
                    action?: string | null;
                    user_id?: string | null;
                    previous_value?: Json | null;
                    new_value?: Json | null;
                    created_at?: string;
                };
                Relationships: GenericRelationship[];
            };
        };
        Views: {};
        Functions: {};
        Enums: {};
    };
}
