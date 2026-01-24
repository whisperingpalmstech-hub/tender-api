# TenderAI System Overview

## 1. System Architecture
TenderAI is a **Retrieval-Augmented Generation (RAG)** system designed to automate the creation of professional tender proposals. It bridges the gap between raw tender documents and your company's proprietary knowledge base.

### Technology Stack
- **Frontend**: Next.js 14, TailwindCSS, Lucide Icons (Modern, Responsive UI).
- **Backend**: FastAPI (Python), Uvicorn (High-performance Async API).
- **Database**: Supabase (PostgreSQL) + pgvector (for future vector storage).
- **AI/LLM**: Mistral 7B (via Mistral AI API) for text generation and refinement.
- **Search Engine**: FAISS (Facebook AI Similarity Search) + SentenceTransformers (`all-MiniLM-L6-v2`) for local semantic search.
- **Processing**: `pdfplumber` & `pytesseract` for OCR/PDF parsing.

---

## 2. How It Works: The Pipeline

### Step 1: Ingestion & Parsing
When you upload a PDF/DOCX:
1. The **Parser** reads the file. If it's a scanned PDF, it applies **OCR** (Optical Character Recognition) to extract text.
2. The **Extractor** identifies separate requirements (e.g., "3.1 Eligibility", "Scope of Work") using regex patterns and structure analysis. 

### Step 2: Knowledge Retrieval (RAG)
1. Each extracted requirement is converted into a **Vector Embedding** (a mathematical representation of meaning).
2. The system queries the **FAISS Index** (your Knowledge Base) to find company data that matches the vector.
3. It retrieves the **Top 3** most relevant chunks of text (e.g., "ISO Certifications", "Previous Project Descriptions").

### Step 3: Response Generation (The "Composer")
1. **Selection**: It picks the best matching Knowledge Base content.
2. **Drafting**: It creates a draft response.
3. **Refinement Loop (The "Humanizer")**:
   - The system sends the prompt to Mistral AI.
   - **Quality Gate**: It calculates the **AI Content Percentage**.
   - If AI Content > 30%, it rejects the draft and tells the AI to "Rewrite using original source words".
   - It repeats this loop up to **10 times** until the response is indistinguishable from human-written text (High match score with Knowledge Base).

### Step 4: Export
- The approved responses are compiled into a **Professional DOCX** proposal.
- Formatted with industry-standard layout (Cover Page, Exec Summary, Compliance Matrix).

---

## 3. What is the Knowledge Base?
The Knowledge Base (KB) is the "Brain" of the company. It consists of:
- **Raw Text**: Past proposals, company profiles, case studies, technical specs.
- **Embeddings**: Mathematical vectors that allow the AI to understand *meanings*, not just keyword matches.

*Example:* 
If a tender asks for "Turnover", the KB finds content related to "Financials", "Revenue", or "Balance Sheet" because they are semantically related, even if the exact word "Turnover" isn't used.

---

## 4. Current Workflow & Approval

### Who Approves?
Currently, the system is configured for a **Single-User / Admin workflow**:
1. **User** uploads document.
2. **User** clicks "Prepare Responses" (System generates Drafts).
3. **User** reviews drafts in the Dashboard.
   - Can Edit text.
   - Can Regenerate (triggering the AI loop).
4. **User** clicks "Submit for Review" -> "Approve".

**In a detailed production environment**, this can be split:
- **Bid Manager**: Uploads & Assigns.
- **Technical Writer**: Generates & Edits (Draft -> Pending Review).
- **Approver/VP**: Reviews final text (Pending Review -> Approved).

*Currently, you (the logged-in user) hold all these roles for efficiency.*

---

## 5. Recent Achievements
We have successfully implemented:
1.  **Strict Compliance**: AI content is strictly limited to **<30%**. If LLM deviates, it is forced to retry until it uses your verified company language.
2.  **Smart Refinement**: A 10-step iterative loop that paraphrases AI output to sound distinctively human.
3.  **Professional Export**: Big-4 style DOCX generation with cover pages, tables, and precise formatting.
4.  **UI Feedback**: Real-time progress loaders and detailed error handling.
