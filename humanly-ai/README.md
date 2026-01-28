# 🤖 HumanlyAI

> Make AI-written content sound human

A modern, avatar-based web application that transforms AI-generated text into authentic, human-sounding content.

![HumanlyAI](https://img.shields.io/badge/React-18.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)
![Three.js](https://img.shields.io/badge/Three.js-0.169-black)

## ✨ Features

- 🎭 **Interactive 3D Avatar** - Ready Player Me female avatar with lip-sync narration
- 🌍 **Multi-Language Support** - 10 languages including English, Hindi, Marathi, Spanish, French, German, Portuguese, Arabic, Chinese, and Japanese
- 📄 **Multiple Formats** - Support for PDF, DOC, DOCX, and TXT files
- 🔒 **Privacy First** - No document storage, processed content is immediately deleted
- 🎨 **Premium Design** - Glass morphism, smooth animations, and modern aesthetics
- 🔐 **Supabase Auth** - Secure email/password authentication

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| 3D Graphics | React Three Fiber (Three.js) |
| State | Zustand |
| i18n | i18next |
| Auth | Supabase |
| TTS | Web Speech API |

## 📁 Project Structure

```
humanly-ai/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Avatar/          # 3D Avatar component
│   │   └── ui/              # Reusable UI components
│   ├── hooks/
│   │   ├── useAvatar.ts     # Avatar narration logic
│   │   └── useSpeech.ts     # Web Speech API hook
│   ├── i18n/
│   │   └── index.ts         # i18next configuration
│   ├── lib/
│   │   ├── api.ts           # API services
│   │   └── supabase.ts      # Supabase client
│   ├── locales/             # Language JSON files
│   │   ├── en.json
│   │   ├── hi.json
│   │   └── ...
│   ├── pages/
│   │   ├── auth/            # Auth pages
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── LandingPage.tsx  # Landing page
│   │   └── LanguageSelector.tsx
│   ├── store/
│   │   ├── appStore.ts      # App state
│   │   └── authStore.ts     # Auth state
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone and navigate**
   ```bash
   cd humanly-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🔧 Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable Email Auth in Authentication settings
3. Copy your project URL and anon key to `.env`

## 📊 Pricing Plans

| Feature | Free | Pro |
|---------|------|-----|
| Document uploads | 2 | Unlimited |
| Characters per doc | 20,000 | Unlimited |
| All file formats | ✅ | ✅ |
| Priority processing | ❌ | ✅ |
| API access | ❌ | ✅ |

## 🎭 Avatar Features

- **3D Avatar Support**: Configured to load local avatar models
- **Setup Required**: Place your GLB model at `public/avatar/female.glb`
- **Fallback**: Shows a stylized sphere if the model is missing
- **Web Speech API** for text-to-speech narration
- **Lip sync simulation** using Rhubarb viseme format
- **Contextual narration**:
  - Welcome greeting on login
  - Upload guidance
  - Processing step narration
  - Success/error feedback

## 🌍 Supported Languages

1. 🇺🇸 English (en)
2. 🇮🇳 Hindi (hi)
3. 🇮🇳 Marathi (mr)
4. 🇪🇸 Spanish (es)
5. 🇫🇷 French (fr)
6. 🇩🇪 German (de)
7. 🇧🇷 Portuguese (pt)
8. 🇸🇦 Arabic (ar) - RTL support
9. 🇨🇳 Chinese Simplified (zh)
10. 🇯🇵 Japanese (ja)

## 🔐 Privacy

- **No document storage** - Files are processed and immediately deleted
- **No humanized output storage** - Results are only shown in the browser
- **Secure authentication** - Powered by Supabase

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🤝 API Integration

The frontend expects a backend API at `VITE_API_URL` with the following endpoint:

```
POST /humanizer
Content-Type: multipart/form-data

Body:
- file: PDF, DOC, DOCX, or TXT file

Response:
{
  "humanizedText": "...",
  "originalAiScore": 85,
  "humanizedAiScore": 12,
  "reduction": 73
}
```

## 📄 License

Proprietary - All Rights Reserved

---

Built with ❤️ by the HumanlyAI Team
