# Virtion backend

Two Python processes power the simulator:

1. **FastAPI server** (`server.py`) — Managed Agents proxy (`/agent/*`), provider-fallback text routes, patient-text-chat SSE (`/agent/patient/stream`), and the LiveKit token mint (`/voice/token`). Lives at `127.0.0.1:8787`.
2. **LiveKit voice worker** (`voice_agent.py`) — joins every room created by `/voice/token`, runs provider-fallback STT/LLM/TTS over WebRTC: Deepgram → OpenAI for STT, OpenAI → OpenRouter → Gemini → Vercel AI Gateway → Cerebras → Anthropic for patient dialogue, and OpenAI → ElevenLabs → Cartesia for speech output.

Both must be running for real-time voice to work.

## Install

The two processes use **separate venvs** so the worker's deps don't tangle with the FastAPI server's.

```bash
cd backend

# Server venv — small, just FastAPI + Anthropic + livekit-api.
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt

# Voice worker venv — pulls in livekit-agents + speech/LLM provider plugins.
python -m venv .venv-voice
.venv-voice/Scripts/python.exe -m pip install -r voice_agent_requirements.txt
```

## Configure

Copy `.env.example` to `.env.local` and fill in:

- `ANTHROPIC_API_KEY` — Managed Agent + primary direct LLM.
- Optional fallback keys: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `VERCEL_AI_GATEWAY_API_KEY`, `GEMINI_API_KEY`, `CEREBRAS_API_KEY`.
- Optional order overrides: `MODEL_ROUTER_ORDER`, `VOICE_STT_ORDER`, `VOICE_LLM_ORDER`, `VOICE_TTS_ORDER`.
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — from LiveKit Cloud.
- `DEEPGRAM_API_KEY` — streaming STT. The worker can fail over between Deepgram and OpenAI at runtime.
- `CARTESIA_API_KEY` — streaming TTS fallback. The worker can fail over between OpenAI, ElevenLabs, and Cartesia at runtime.
- `VIRTION_AGENT_ID`, `VIRTION_ENV_ID` — leave blank on first run, paste back from `/agent/bootstrap`.
- Netlify and Vercel use the same server-side proxy variables: `VIRTION_BACKEND_URL` (or `BACKEND_URL`) and `BACKEND_SHARED_SECRET`.

## Run

```bash
# Terminal 1 — FastAPI
.venv/Scripts/python.exe server.py

# Terminal 2 — voice worker
.venv-voice/Scripts/python.exe voice_agent.py dev
```

The worker logs `registered worker` once it's connected to LiveKit Cloud. From then on, any room created via `POST /voice/token` will dispatch a worker into it; the worker reads the persona payload from room metadata and starts the patient.

## Deploy on Railway (recommended setup)

If Railway auto-detects Node and runs `npm ci`, your deploy will fail with `pip: not found`.
Use Dockerfile-based services so Railway always builds with Python. Do not add a
repo-level `railway.json` for this app: the backend and worker need different
Dockerfiles and start commands, and a single root config will override both
services on Git deploy.

1) Create two Railway services from this repo:
- `virtion-backend` (web)
- `virtion-voice-worker` (worker)

2) Configure service roots:
- Root directory for both services: `backend`

3) Configure Dockerfile per service:
- Web service Dockerfile path: `backend/Dockerfile.backend`
- Worker service Dockerfile path: `backend/Dockerfile.worker`

4) Configure start commands:
- Web service: `sh -c "exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8787}"`
- Worker service: `python voice_agent.py start`

5) Set environment variables on both services:
- `BACKEND_SHARED_SECRET`
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- `ANTHROPIC_API_KEY`
- Optional fallback providers: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `VERCEL_AI_GATEWAY_API_KEY`, `GEMINI_API_KEY`, `CEREBRAS_API_KEY`
- Runtime order overrides: `MODEL_ROUTER_ORDER`, `VOICE_STT_ORDER`, `VOICE_LLM_ORDER`, `VOICE_TTS_ORDER`
- Voice providers: `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`, `ELEVEN_API_KEY` or `ELEVENLABS_API_KEY`
- `VIRTION_AGENT_ID`, `VIRTION_ENV_ID` (can be empty first deploy)

6) After web is healthy, bootstrap once:
- `POST https://<railway-backend-domain>/agent/bootstrap` with header `x-virtion-auth: <BACKEND_SHARED_SECRET>`
- Save returned values to `VIRTION_AGENT_ID` and `VIRTION_ENV_ID`, redeploy web service.

7) Wire Netlify:
- `VIRTION_BACKEND_URL=https://<railway-backend-domain>`
- `BACKEND_SHARED_SECRET=<same secret as Railway backend>`

8) Verify:
- `https://<railway-backend-domain>/health`
- `https://virtion.netlify.app/agent/model-health`

## Endpoints

- `GET  /health` — backend + agent + voice + provider-fallback config status.
- `GET  /agent/model-health` — configured provider booleans, no secrets.
- `POST /voice/token` — body `{caseId, systemPrompt, initialLine, gender}`. Pre-creates a LiveKit room with the persona payload as metadata, returns `{token, url, roomName}`.
- `POST /agent/*` — Managed Agents proxy for the virtion-attending. See inline docs in `server.py`.
- `POST /agent/patient/stream` — text-only patient persona SSE; used by the right-sidebar text chat.
- `POST /agent/debrief/fallback` — structured fallback debrief when Managed Agents are unavailable.
