# SeeLess backend

FastAPI backend for the SeeLess multilingual visual accessibility assistant.

## Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then edit .env with real API keys
```

Required keys in `.env`:

- `OPENAI_API_KEY` — used for vision, QA, language generation and (optional) ASR.
- `ELEVENLABS_API_KEY` — used for TTS.
- One of `ELEVENLABS_VOICE_{EN,FR,ES,YO}` per language you plan to demo, or set `ELEVENLABS_DEFAULT_VOICE` as a fallback.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints (all under `/api/v1`)

| Method | Path                    | Purpose |
| ------ | ----------------------- | ------- |
| GET    | `/health`               | Reports which providers are configured. |
| POST   | `/analyze`              | Multipart: `image`, `language`, optional `detail` (`brief`\|`standard`\|`full`), optional `hint`. Returns analysis id, description, structured observations and ranked observations. |
| POST   | `/ask`                  | JSON: `analysis_id`, `question`, `language`. Grounded QA using the stored image + observations. |
| POST   | `/speech/synthesize`    | JSON: `text`, `language`, optional `voice_id`. Streams `audio/mpeg`. |
| POST   | `/speech/transcribe`    | Multipart: `audio`, optional `language`. Returns `{text, language}`. |

## Design notes

- The pipeline is modular: perception → evidence → ranking → language generation → TTS → QA.
- The vision stage returns JSON matching the `StructuredObservations` schema. Bounding boxes are never invented — `source_region` is always `null`.
- Ranking is a transparent weighted heuristic `S(o) = 0.4·I + 0.2·C + 0.3·R + 0.1·P`. Components are returned so the ranking is explainable.
- Sessions live in-memory with a 15 minute TTL (configurable). This is single-instance only; swap `app/session_store.py` for Redis for horizontal scale.
- Image bytes are never written to logs.
