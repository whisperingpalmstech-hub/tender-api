# AI Content Humanizer - How It Works 🤖➡️👤

This document explains the complete AI detection and humanization system used in this project.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AI HUMANIZATION SYSTEM                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐          ┌─────────────────────────┐           │
│  │   STANDALONE API        │          │   TENDER RESPONSES      │           │
│  │   /api/humanize         │          │   /api/documents/.../   │           │
│  │                         │          │   generate              │           │
│  │   For any application   │          │   For tender docs       │           │
│  └───────────┬─────────────┘          └───────────┬─────────────┘           │
│              │                                    │                          │
│              └──────────────┬─────────────────────┘                          │
│                             │                                                │
│                             ▼                                                │
│              ┌──────────────────────────────┐                                │
│              │   SHARED AI DETECTOR         │                                │
│              │   app/services/ai_detector.py│                                │
│              │                              │                                │
│              │   • calculate_ai_score()     │                                │
│              │   • humanize_text()          │                                │
│              │   • apply_* functions        │                                │
│              └──────────────────────────────┘                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 How AI Detection Works (Like GPTZero)

The system uses **8 different signals** to detect AI-generated content:

### 1. **Burstiness Score** (0-35 points)
AI text has LOW burstiness - sentences are all similar length.
Human text has HIGH burstiness - varied sentence lengths.

```python
# Example - AI-like (low variation):
"The company provides services. The team delivers results. The process ensures quality."
# All 4-5 words per sentence = AI-like

# Example - Human-like (high variation):
"We help. Our team of experts delivers exceptional results through rigorous quality processes."
# Mix of 2 words and 11 words = Human-like
```

**Calculation:**
- Coefficient of Variation (CV) = Standard Deviation / Mean sentence length
- CV < 0.25 → 35 points (very AI)
- CV < 0.40 → 20 points
- CV < 0.55 → 10 points

### 2. **Lexical Diversity** (0-25 points)
AI repeats words; humans use more variety.

**Calculation:**
- Type-Token Ratio = Unique Words / Total Words
- TTR < 0.45 → 25 points (AI)
- TTR < 0.55 → 15 points
- TTR < 0.65 → 8 points

### 3. **Formality Score** (0-40 points)
AI text is overly formal without contractions.

**Checks:**
- No contractions (don't, can't, it's) → +15 points
- Formal transitions (furthermore, moreover, nevertheless) → +3-8 each

### 4. **Sentence Starter Repetition** (0-25 points)
AI often starts sentences the same way.

**Checks:**
- Same starter for 50%+ sentences → +20 points
- Same starter for 33%+ sentences → +10 points

### 5. **Perfect Structure** (0-15 points)
AI has parallel, formulaic paragraph structure.

### 6. **AI Phrases** (0-35 points)
Known AI-specific phrases:

| Phrase | Penalty |
|--------|---------|
| "It is important to note that" | 15 |
| "It should be noted" | 12 |
| "plays a crucial role" | 8 |
| "in today's world" | 8 |
| "continues to be" | 4 |

### 7. **AI Buzzwords** (0-30 points)
Words AI loves to use:

| Word | Penalty |
|------|---------|
| delve | 15 |
| tapestry | 12 |
| synergy | 10 |
| paradigm | 10 |
| holistic | 8 |
| cutting-edge | 8 |
| seamless | 6 |
| robust | 5 |
| innovative | 4 |
| dynamic | 3 |
| evolving | 3 |
| strategic | 3 |

### 8. **Comma Density** (0-10 points)
AI uses complex sentences with many commas.
- More than 1 comma per 8 words → 10 points

---

## 🔧 How Humanization Works

The system applies these techniques (like Grammarly/QuillBot):

### Step 1: Remove AI Markers
Replace buzzwords with simpler alternatives:
```
leverage → use
utilize → use
facilitate → help
comprehensive → complete
innovative → new
robust → strong
dynamic → active
evolving → developing
```

### Step 2: Phrase Paraphrasing
Replace known AI phrases:
```
"It is important to note that" → "" (remove)
"in order to" → "to"
"due to the fact that" → "because"
"a large number of" → "many"
"plays a crucial role" → "is key"
```

### Step 3: Synonym Replacement
Replace words with synonyms at controlled intensity:
```
Light mode: 20% of words
Balanced mode: 35% of words
Aggressive mode: 50% of words
```

### Step 4: Add Contractions
Make text sound natural:
```
"do not" → "don't"
"cannot" → "can't"
"it is" → "it's"
"they are" → "they're"
```

### Step 5: LLM Rewriting (if needed)
If AI score still > 30%, use Mistral LLM to rewrite with prompts that encourage human-like output.

---

## 🎯 The 30% Threshold Logic

The system enforces a **maximum 30% AI score**:

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  START: Input Text                                                    │
│     │                                                                 │
│     ▼                                                                 │
│  Calculate AI Score (0-100%)                                          │
│     │                                                                 │
│     ├─── AI% ≤ 30%? ───YES──→ Return text (success!)                 │
│     │                                                                 │
│     NO                                                                │
│     │                                                                 │
│     ▼                                                                 │
│  Apply Rule-Based Transforms                                          │
│  (markers, phrases, synonyms, contractions)                           │
│     │                                                                 │
│     ▼                                                                 │
│  Calculate AI Score again                                             │
│     │                                                                 │
│     ├─── AI% ≤ 30%? ───YES──→ Return text (success!)                 │
│     │                                                                 │
│     NO                                                                │
│     │                                                                 │
│     ▼                                                                 │
│  ┌─────────────────────────────────────────────────┐                  │
│  │  LLM REWRITE LOOP (up to 10 attempts)          │                  │
│  │                                                 │                  │
│  │  For each attempt:                              │                  │
│  │    1. Call Mistral LLM to rewrite              │                  │
│  │    2. Apply rule-based cleanup                 │                  │
│  │    3. Calculate AI score                       │                  │
│  │    4. If AI% ≤ 30% → Return (success!)         │                  │
│  │    5. If better than best → Save as best       │                  │
│  │    6. Continue to next attempt                 │                  │
│  │                                                 │                  │
│  └─────────────────────────────────────────────────┘                  │
│     │                                                                 │
│     ▼                                                                 │
│  Return best result (may be partial success)                          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints

### 1. Standalone Humanizer (Any Application)

**Endpoint:** `POST /api/humanize`

**Request:**
```json
{
  "text": "Your AI-generated text here...",
  "max_ai_percentage": 30,
  "max_attempts": 10,
  "style": "professional",
  "mode": "balanced"
}
```

**Response:**
```json
{
  "success": true,
  "original_text": "...",
  "humanized_text": "...",
  "original_ai_percentage": 65.5,
  "final_ai_percentage": 28.3,
  "attempts_used": 3,
  "techniques_applied": ["ai_markers_removed:2", "phrases_replaced:3"],
  "message": "✅ Success! AI score: 65.5% → 28.3%"
}
```

**Modes:**
| Mode | Description | Synonym Intensity |
|------|-------------|-------------------|
| `light` | Minimal changes | 20% |
| `balanced` | Moderate rewriting | 35% |
| `aggressive` | Complete overhaul | 50% |
| `creative` | Conversational | 45% |

**Styles:**
- `professional` - Business-appropriate
- `casual` - Friendly, conversational
- `formal` - Polished, proper
- `simple` - Easy to understand
- `academic` - Scholarly

---

### 2. Tender Document Responses

**Endpoint:** `POST /api/documents/{document_id}/responses/generate`

Uses the same AI detection internally when composing responses from the Knowledge Base.

---

## 📁 Code Files

| File | Purpose |
|------|---------|
| `app/services/ai_detector.py` | **Core**: AI detection & humanization functions |
| `app/api/humanize.py` | Standalone API endpoint |
| `app/services/composer.py` | Tender response composer (uses ai_detector) |
| `app/core/config.py` | Configuration (max_ai_percentage = 30%) |

---

## 🧪 Testing

### Test the Detection:
```bash
curl http://localhost:8000/api/humanize/test
```

### Test Full Humanization:
```bash
curl -X POST http://localhost:8000/api/humanize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "It is important to note that our comprehensive solution leverages cutting-edge technology.",
    "max_ai_percentage": 30,
    "mode": "balanced"
  }'
```

---

## ⚙️ Configuration

In `.env` or `app/core/config.py`:

```python
max_ai_percentage = 30.0  # Default threshold
max_regeneration_attempts = 10  # Max LLM rewrites
```

To make detection stricter, lower the threshold:
```python
max_ai_percentage = 20.0  # Stricter
```

To make it more lenient:
```python
max_ai_percentage = 40.0  # More lenient
```

---

## 📊 Example Transformation

**Before (AI Score: 72%):**
> It is important to note that India and the United States share a dynamic and evolving partnership driven by strategic interests. Furthermore, both countries leverage cutting-edge technology to facilitate seamless cooperation. Additionally, they continue to strengthen their robust relationship through comprehensive dialogue.

**After (AI Score: 24%):**
> India and the United States share an active and developing partnership driven by planned interests. Both countries use modern technology to help smooth cooperation. They continue to strengthen their strong relationship through complete dialogue.

**Techniques Applied:**
- ✅ Removed "It is important to note that"
- ✅ Replaced "Furthermore" → ""
- ✅ Replaced "Additionally" → ""
- ✅ Replaced "dynamic" → "active"
- ✅ Replaced "evolving" → "developing"
- ✅ Replaced "strategic" → "planned"
- ✅ Replaced "leverage" → "use"
- ✅ Replaced "cutting-edge" → "modern"
- ✅ Replaced "facilitate" → "help"
- ✅ Replaced "seamless" → "smooth"
- ✅ Replaced "robust" → "strong"
- ✅ Replaced "comprehensive" → "complete"

---

## 🚀 Usage in Other Applications

To use this humanizer in another application:

1. **Start the backend:**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **Call the API:**
   ```javascript
   const response = await fetch('http://localhost:8000/api/humanize', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       text: yourAIText,
       max_ai_percentage: 30,
       mode: 'balanced'
     })
   });
   
   const result = await response.json();
   console.log(result.humanized_text);
   ```

---

## 📝 Summary

1. **Detection** uses 8 signals (burstiness, lexical diversity, formality, etc.)
2. **Humanization** applies rule-based transforms + optional LLM rewriting
3. **Threshold** enforces max 30% AI score
4. **Loop** retries up to 10 times if needed
5. **Fallback** returns best result even if threshold not met
