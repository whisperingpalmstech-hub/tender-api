const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/backend';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private authToken: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setAuthToken(token: string | null) {
        this.authToken = token;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers,
        };

        if (this.authToken) {
            requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(error.detail || 'An error occurred');
        }

        return response.json();
    }

    // Document endpoints
    async getDocuments() {
        return this.request<any[]>('/api/documents');
    }

    async getDocument(id: string) {
        return this.request<any>(`/api/documents/${id}`);
    }

    async getDocumentStatus(id: string) {
        return this.request<any>(`/api/documents/${id}/status`);
    }

    async deleteDocument(id: string) {
        return this.request<void>(`/api/documents/${id}`, { method: 'DELETE' });
    }

    // Requirements endpoints
    async getRequirements(documentId: string) {
        return this.request<any[]>(`/api/documents/${documentId}/requirements`);
    }

    async updateRequirementCategory(requirementId: string, category: string) {
        return this.request<any>(`/api/requirements/${requirementId}/category`, {
            method: 'PUT',
            body: { category },
        });
    }

    // Matching endpoints
    async getMatchSummary(documentId: string) {
        return this.request<any>(`/api/documents/${documentId}/match-summary`);
    }

    async getMatchResults(documentId: string) {
        return this.request<any[]>(`/api/documents/${documentId}/matches`);
    }

    // Response endpoints
    async getResponses(documentId: string) {
        return this.request<any[]>(`/api/documents/${documentId}/responses`);
    }

    async generateResponses(documentId: string, requirementIds: string[], mode?: string, tone?: string) {
        return this.request<any>(`/api/documents/${documentId}/responses/generate`, {
            method: 'POST',
            body: {
                requirement_ids: requirementIds,
                mode,
                tone
            },
        });
    }

    async updateResponse(responseId: string, text: string) {
        return this.request<any>(`/api/responses/${responseId}`, {
            method: 'PUT',
            body: { response_text: text },
        });
    }

    async approveResponse(responseId: string) {
        return this.request<any>(`/api/responses/${responseId}/approve`, {
            method: 'POST',
        });
    }

    async submitForReview(responseId: string) {
        return this.request<any>(`/api/responses/${responseId}/submit`, {
            method: 'POST',
        });
    }

    async deleteResponse(responseId: string) {
        return this.request<any>(`/api/responses/${responseId}`, {
            method: 'DELETE',
        });
    }

    // Export endpoints
    async exportDocument(documentId: string) {
        const response = await fetch(`${this.baseUrl}/api/documents/${documentId}/export`, {
            method: 'POST',
            headers: {
                'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
            },
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        return response.blob();
    }

    // Knowledge Base endpoints
    async getKnowledgeBase() {
        return this.request<any[]>('/api/knowledge-base');
    }

    async addKnowledgeBaseItem(item: { title: string; content: string; category: string }) {
        return this.request<any>('/api/knowledge-base', {
            method: 'POST',
            body: item,
        });
    }

    async updateKnowledgeBaseItem(id: string, item: { title?: string; content?: string; category?: string }) {
        return this.request<any>(`/api/knowledge-base/${id}`, {
            method: 'PUT',
            body: item,
        });
    }

    async deleteKnowledgeBaseItem(id: string) {
        return this.request<void>(`/api/knowledge-base/${id}`, { method: 'DELETE' });
    }

    // Health check
    async healthCheck() {
        return this.request<{ status: string }>('/health');
    }

    // Humanize endpoint
    async humanize(text: string, options: { mode?: string; style?: string } = {}) {
        return this.request<any>('/api/humanize', {
            method: 'POST',
            body: {
                text,
                mode: options.mode || 'balanced',
                style: options.style || 'professional',
            },
        });
    }

    // Company Profile endpoints
    async getCompanyProfile() {
        return this.request<any>('/api/company/profile');
    }

    async updateCompanyProfile(profile: any) {
        return this.request<any>('/api/company/profile', {
            method: 'POST', // Using POST for upsert as per backend
            body: profile,
        });
    }

    async getPastPerformance() {
        return this.request<any[]>('/api/company/past-performance');
    }

    async addPastPerformance(item: any) {
        return this.request<any>('/api/company/past-performance', {
            method: 'POST',
            body: item,
        });
    }

    async getTeamProfiles() {
        return this.request<any[]>('/api/company/team');
    }

    async addTeamProfile(item: any) {
        return this.request<any>('/api/company/team', {
            method: 'POST',
            body: item,
        });
    }

    async deletePastPerformance(id: string) {
        return this.request<any>(`/api/company/past-performance/${id}`, {
            method: 'DELETE',
        });
    }

    async deleteTeamMember(id: string) {
        return this.request<any>(`/api/company/team/${id}`, {
            method: 'DELETE',
        });
    }

    // Review Comments
    async getResponseComments(responseId: string) {
        return this.request<any[]>(`/api/responses/${responseId}/comments`);
    }

    async addResponseComment(responseId: string, text: string) {
        return this.request<any>(`/api/responses/${responseId}/comments`, {
            method: 'POST',
            body: { comment_text: text },
        });
    }

    async resolveComment(commentId: string) {
        return this.request<any>(`/api/responses/comments/${commentId}/resolve`, {
            method: 'POST',
        });
    }

    // Enterprise Member Governance
    async getOrgMembers() {
        return this.request<any[]>('/api/company/members');
    }

    async updateMemberRole(memberId: string, role: string) {
        return this.request<any>(`/api/company/members/${memberId}/role`, {
            method: 'PUT',
            body: { role },
        });
    }

    // --- Admin User Management ---

    async getAdminUsers() {
        return this.request<any[]>('/api/admin/users');
    }

    async inviteUser(data: { email: string; full_name: string; role: string; designation?: string; department?: string }) {
        return this.request<any>('/api/admin/users/invite', {
            method: 'POST',
            body: data,
        });
    }

    async updateUser(userId: string, data: { role?: string; designation?: string; department?: string; full_name?: string; is_active?: boolean }) {
        return this.request<any>(`/api/admin/users/${userId}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteUser(userId: string) {
        return this.request<any>(`/api/admin/users/${userId}`, { method: 'DELETE' });
    }

    async getAdminRoles() {
        return this.request<any>('/api/admin/roles');
    }

    async createRole(data: { role_name: string; description?: string; permissions?: string[] }) {
        return this.request<any>('/api/admin/roles', {
            method: 'POST',
            body: data,
        });
    }

    async deleteRole(roleName: string) {
        return this.request<any>(`/api/admin/roles/${roleName}`, { method: 'DELETE' });
    }

    // --- Discovery Config ---

    async getDiscoveryConfig() {
        return this.request<any>('/api/discovery/config');
    }

    async updateDiscoveryConfig(config: any) {
        return this.request<any>('/api/discovery/config', {
            method: 'POST',
            body: config,
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
