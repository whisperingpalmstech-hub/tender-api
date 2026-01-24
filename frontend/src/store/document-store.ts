import { create } from 'zustand';
import { Document, MatchReport, Response, Requirement } from '@/types';

interface DocumentState {
    documents: Document[];
    currentDocument: Document | null;
    matchReport: MatchReport | null;
    responses: Response[];
    requirements: Requirement[];
    isLoading: boolean;
    error: string | null;

    // Actions
    setDocuments: (documents: Document[]) => void;
    setCurrentDocument: (document: Document | null) => void;
    setMatchReport: (report: MatchReport | null) => void;
    setResponses: (responses: Response[]) => void;
    setRequirements: (requirements: Requirement[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    updateDocument: (id: string, updates: Partial<Document>) => void;
    addDocument: (document: Document) => void;
    removeDocument: (id: string) => void;
    updateResponse: (id: string, updates: Partial<Response>) => void;
    reset: () => void;
}

const initialState = {
    documents: [],
    currentDocument: null,
    matchReport: null,
    responses: [],
    requirements: [],
    isLoading: false,
    error: null,
};

export const useDocumentStore = create<DocumentState>((set) => ({
    ...initialState,

    setDocuments: (documents) => set({ documents }),

    setCurrentDocument: (document) => set({ currentDocument: document }),

    setMatchReport: (report) => set({ matchReport: report }),

    setResponses: (responses) => set({ responses }),

    setRequirements: (requirements) => set({ requirements }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    updateDocument: (id, updates) =>
        set((state) => ({
            documents: state.documents.map((doc) =>
                doc.id === id ? { ...doc, ...updates } : doc
            ),
            currentDocument:
                state.currentDocument?.id === id
                    ? { ...state.currentDocument, ...updates }
                    : state.currentDocument,
        })),

    addDocument: (document) =>
        set((state) => ({
            documents: [document, ...state.documents],
        })),

    removeDocument: (id) =>
        set((state) => ({
            documents: state.documents.filter((doc) => doc.id !== id),
            currentDocument:
                state.currentDocument?.id === id ? null : state.currentDocument,
        })),

    updateResponse: (id, updates) =>
        set((state) => ({
            responses: state.responses.map((res) =>
                res.id === id ? { ...res, ...updates } : res
            ),
        })),

    reset: () => set(initialState),
}));
