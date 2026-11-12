# SeeLess

**Evidence-grounded, multilingual visual accessibility assistant.** Upload or capture an image, receive a spoken, ranked description in English, French, Spanish, or Yoruba, and ask follow-up questions that are answered from the original image.

> Experimental hackathon MVP. **Not** for safety-critical, medical, or navigation decisions.

---

## Pipeline

```
Image Input
  → Multimodal Perception (OpenAI vision)
  → Structured Evidence Representation (Pydantic JSON)
  → Salience Ranking (transparent weighted heuristic)
  → Localized Language Generation (OpenAI, per language)
  → Speech Synthesis (ElevenLabs)
  → Grounded Follow-up QA (image + evidence)
```

The ranking function is:

> **S(o) = 0.4·I(o) + 0.2·C(o) + 0.3·R(o) + 0.1·P(o)**

Each ranked observation is returned with its component contributions so the ordering is explainable.

---

## Repository layout

```
Hackathon/
├── backend/            FastAPI service (pipeline, ranking, in-memory sessions)
├── frontend/           Next.js 14 + React + Tailwind UI
├── evaluation/         12-image × 4-language dev evaluation harness
├── demo/sample-images/ Place demo images here
└── README.md
```

---

## What you need before running

You only need accounts / credentials that the backend calls out to:

| Provider  | Env var                                           | Purpose                       |
| --------- | ------------------------------------------------- | ----------------------------- |
| OpenAI    | `OPENAI_API_KEY`                                  | vision, QA, language, ASR     |
| ElevenLabs| `ELEVENLABS_API_KEY` + per-language voice IDs     | multilingual TTS              |

See `backend/.env.example` for the full list.

**Yoruba speech:** verify output with a native speaker before any public demo. If synthesized Yoruba is not intelligible for a specific message, use a clearly-disclosed pre-recorded fallback.

---

## Local development

Open two terminals.

### 1 — backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # PowerShell
# source .venv/bin/activate         # macOS / Linux
pip install -r requirements.txt
cp .env.example .env                # edit with real keys
uvicorn app.main:app --reload --port 8000
```

### 2 — frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local    # NEXT_PUBLIC_API_BASE_URL points at backend
npm run dev
```

Open http://localhost:3000.

---

## Backend API (prefix `/api/v1`)

| Method | Path                  | Body / form                                                             | Returns                                |
| ------ | --------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| GET    | `/health`             | –                                                                       | `{status, providers}`                  |
| POST   | `/analyze`            | multipart: `image`, `language`, optional `detail`, optional `hint`      | Structured + ranked observations + localized description |
| POST   | `/ask`                | JSON: `analysis_id`, `question`, `language`                             | Grounded answer with supporting evidence + uncertainty |
| POST   | `/speech/synthesize`  | JSON: `text`, `language`, optional `voice_id`                           | `audio/mpeg` stream                    |
| POST   | `/speech/transcribe`  | multipart: `audio`, optional `language`                                 | `{text, language}`                     |

---

## Evaluation

```bash
# with the backend running, from repo root
python evaluation/evaluate.py --api http://localhost:8000 --out evaluation/report.json
```

The harness exercises each sample image in each supported language and records latency, scene-type match, follow-up grounding, and uncertainty surfacing. Treat its output as a **dev report**, not a benchmark.

---

## Design decisions (and why)

1. **Modular pipeline** — easier to inspect, debug, and evaluate than one captioning call.
2. **Structured evidence JSON** — downstream ranking, QA, localization and explainability all share one intermediate representation.
3. **Transparent heuristic ranking** — swappable later for a learned LTR model; configurable weights; component scores returned.
4. **Grounded QA** — follow-up questions re-submit the original image alongside the observations JSON.
5. **Language changes reuse the image** — the backend caches observations per `analysis_id`; the frontend simply re-requests `/analyze` with the same file and a different language for MVP simplicity (still cheap due to short-TTL session storage).
6. **External models, not custom training** — hackathon time is finite. The contribution is orchestration, evidence, ranking, accessibility.
7. **Temporary in-memory sessions** — 15 min TTL. Replace with Redis for horizontal scale.
8. **Text first, speech second** — descriptions are inspectable, replayable, and translatable without re-perception.
9. **Uncertainty is a first-class output** — surfaced in description, QA response, and the evidence panel.
10. **Measure quality, not just HTTP 200s** — the eval harness covers latency, grounding rate, and scene-type match.

---

## Explicit non-goals

- Real-time navigation / obstacle avoidance.
- Custom model training.
- Offline inference.
- Authentication, persistent libraries, or multi-image sessions.
- Diagram / chart interpretation.

---

## Demo plan (90 seconds)

1. Introduce the accessibility problem.
2. Upload a university notice.
3. Show structured evidence + ranking (deadline and location rank above decorations).
4. Play the English description.
5. Switch to Yoruba — observe ranking is preserved, only language regenerates.
6. Ask "What is the registration deadline?" — the answer cites supporting evidence.
7. Ask a deliberately unclear detail — the system acknowledges uncertainty.
