# Tender Analysis & Response System

Enterprise-grade system for tender document analysis, requirement matching, and response preparation.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js 14 + Tailwind                        │
│                      (Vercel)                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│           Auth │ PostgreSQL │ Storage │ Edge Functions          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PYTHON BACKEND                              │
│                    FastAPI (Railway)                             │
│  Parser │ Extractor │ Matcher │ Composer │ Exporter             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   FAISS Vector Store    │     │    Mistral LLM          │
│   (sentence-transformers)    │     │    (Self-hosted)        │
└─────────────────────────┘     └─────────────────────────┘
```

## 📁 Project Structure

```
tender/
├── frontend/                    # Next.js 14 application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── dashboard/      # Dashboard pages
│   │   │   └── layout.tsx      # Root layout
│   │   ├── components/         # React components
│   │   │   ├── ui/            # Base UI components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── documents/     # Document components
│   │   │   ├── analysis/      # Analysis components
│   │   │   └── responses/     # Response components
│   │   ├── lib/               # Utilities and clients
│   │   ├── store/             # Zustand stores
│   │   └── types/             # TypeScript types
│   └── package.json
├── backend/                     # Python FastAPI
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── core/              # Config, security
│   │   ├── services/          # Business logic
│   │   └── schemas/           # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
├── supabase/                    # Database
│   └── migrations/            # SQL migrations
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- (Optional) GPU for Mistral LLM

### 1. Clone and Setup

```bash
git clone <repository>
cd tender
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/` via SQL Editor
3. Create storage buckets:
   - `tender-documents` (private)
   - `exports` (private)
4. Copy your project URL and keys

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

npm run dev
```

### 4. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

python3 -m venv venv

venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Edit .env with your credentials

# Run server
uvicorn app.main:app --reload

#seed knowldgebase 
python scripts/seed_knowledge_base.py   

cd backend
# 1. Activate Virtual Environment
.\venv\Scripts\activate

# 2. Start the Worker
# Note: On Windows, we use --pool=solo to avoid thread locking issues
celery -A app.core.celery_app worker --pool=solo --loglevel=info

```

### 5. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔧 Configuration

### Frontend Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
BACKEND_API_URL=http://localhost:8000
```

### Backend Environment Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
MISTRAL_API_URL=http://localhost:8080
FAISS_INDEX_PATH=./data/faiss.index
```

## 📦 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard.

### Backend (Railway)

1. Connect repository to Railway
2. Set root directory to `backend`
3. Add environment variables
4. Deploy

### Supabase

Already cloud-hosted. Ensure production RLS policies are configured.

## 🔐 Security

- All API routes require JWT authentication
- Row-Level Security enforced on all tables
- AI percentage logging is internal only
- No AI indicators in user-facing content

## 📊 Key Features

| Feature | Description |
|---------|-------------|
| Document Upload | PDF/DOCX with drag-and-drop |
| Requirement Extraction | NLP-based categorization |
| Match Scoring | Vector similarity search |
| Response Generation | KB-based with <30% AI |
| DOCX Export | Professional formatting |
| Audit Trail | Complete action logging |

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
pytest
```

## 📝 License

Proprietary - Internal Use Only
