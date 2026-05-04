# Virtion

Browser-based ER + polyclinic clinical training simulator. You play the doctor: patients arrive at triage, you talk to them in real time, order tests, treat, disposition, then receive an attending-style debrief.

> Training simulator only. Cases are plausible but synthetic — no clinical claims or medical advice.

---

## About

Virtion is a voice-first AI patient simulator for medical students and newly graduated doctors. You take the history, order labs, read imaging, diagnose, and prescribe while talking to AI patients in real time. After each session, an attending grader marks communication, history-taking, and clinical reasoning, citing published guidelines (NICE, ESC, AHA, GINA, GOLD) from a curated registry so the grading cannot fabricate sources.

The product vision extends beyond the browser simulator: mobile and desktop training apps, AR/VR clinical spaces, consent-first research data tooling, and an opt-in compute network for future biomedical simulation workloads. See [docs/platform-roadmap.md](docs/platform-roadmap.md).



## What's inside

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Three.js (`@react-three/fiber`, `@react-three/drei`) |
| Voice transport | LiveKit Cloud (WebRTC) via `livekit-client` |
| Voice worker | Python `livekit-agents` — Deepgram/OpenAI STT → Anthropic/OpenAI patient dialogue → Cartesia/ElevenLabs/OpenAI TTS |
| HTTP backend | FastAPI on `127.0.0.1:8787` — Managed Agents proxy + LiveKit JWT mint |
| Attending grader | Claude **Opus 4.7** as a Managed Agent (`virtion-attending`) with direct-model and deterministic fallbacks |
| Model fallback router | Anthropic, OpenAI, Vercel AI Gateway, OpenRouter, Gemini, Cerebras, then local deterministic rubric fallback |
| State | Single `Store` class with `useSyncExternalStore` (no Redux/Zustand) |

Two flows:
- **ER** — multiple beds, real-time voice with each patient, tests resolve over simulated minutes.
- **Polyclinic** — one outpatient at a time, tests resolve instantly.

---

## Prerequisites

- **Node.js 22+** (TS files are run natively via type-stripping)
- **Python 3.11+**
- A modern browser with mic permission (Chrome/Edge recommended for WebRTC)

---

## API keys you'll need

All keys are server-side only — the browser never sees them. Get one of each:

| Service | What it does | Where to get it | Free tier? |
|---|---|---|---|
| **Anthropic** | Primary attending grader (Opus 4.7) and patient voice persona (Haiku 4.5) | https://console.anthropic.com → API Keys | Pay-as-you-go, no free tier |
| **OpenAI / OpenRouter / Vercel AI Gateway / Gemini / Cerebras** | Optional direct-model fallbacks for triage, patient text, and debrief degradation | Provider consoles | Varies |
| **LiveKit Cloud** | Real-time WebRTC transport between browser ↔ voice worker | https://cloud.livekit.io → create project → Settings → Keys (gives `URL`, `API Key`, `API Secret`) | Yes — generous free tier |
| **Deepgram** | Streaming speech-to-text inside the voice worker | https://console.deepgram.com → API Keys | Yes — $200 free credit |
| **Cartesia / ElevenLabs / OpenAI TTS** | Streaming text-to-speech inside the voice worker, in fallback order | Provider consoles | Varies |

---

## Setup

### 1. Frontend

```bash
npm ci
```

### 2. Backend (two separate venvs)

The FastAPI server and the LiveKit voice worker have very different dependency trees, so they each get their own venv.

```bash
cd backend

# FastAPI server — small (FastAPI + Anthropic + livekit-api)
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt

# Voice worker — larger (livekit-agents + speech/LLM provider plugins)
python -m venv .venv-voice
.venv-voice/Scripts/python -m pip install -r voice_agent_requirements.txt
```

> On macOS/Linux replace `.venv/Scripts/python` with `.venv/bin/python`.

### 3. Configure secrets

```bash
cp backend/.env.example backend/.env.local
```

Fill in `backend/.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxx
LIVEKIT_API_SECRET=...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
ELEVEN_API_KEY=...

# Leave these blank on first run — see "Bootstrap the Managed Agent" below
VIRTION_AGENT_ID=
VIRTION_ENV_ID=

# Optional direct-model and speech fallback lanes
OPENAI_API_KEY=
VERCEL_AI_GATEWAY_API_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=
CEREBRAS_API_KEY=
```

### 4. Bootstrap the Managed Agent (one-time)

Start the FastAPI server, then create the persistent attending agent:

```bash
backend/.venv/Scripts/python backend/server.py
# In another terminal:
curl -X POST http://127.0.0.1:8787/agent/bootstrap
```

The response contains an `agent_id` and `environment_id`. Paste them back into `backend/.env.local` as `VIRTION_AGENT_ID` / `VIRTION_ENV_ID` and **restart the server**. Subsequent runs are no-ops.

---

## Run (three terminals)

```bash
# Terminal 1 — frontend
npm run dev
# Vite serves http://localhost:5173

# Terminal 2 — FastAPI backend
backend/.venv/Scripts/python backend/server.py
# Listens on http://127.0.0.1:8787 (proxied by Vite at /agent/* and /voice/*)

# Terminal 3 — LiveKit voice worker
backend/.venv-voice/Scripts/python backend/voice_agent.py dev
# Logs "registered worker" once connected to LiveKit Cloud
```

All three must be up for premium voice. If voice setup fails, the encounter degrades to text patient roleplay. If premium model providers fail, the app returns structured degraded outputs instead of blanking.

Open http://localhost:5173 and grant microphone permission when prompted.

---

## Useful scripts

```bash
npm run build      # tsc + vite build
npm run preview    # preview production build
npm run verify     # deterministic invariants over src/data/* — run after editing cases/tests/treatments
npm run test       # custom-tools + loop-commands tests
```

---

## Project layout

```
src/
  game/               # Store, types, single source of truth
  data/               # Patients, tests, treatments, medications, guidelines (pure data)
  components/         # React UI
  components/three/   # Three.js scenes (ER room, polyclinic)
  voice/              # LiveKit conversation + persona builders
  agents/             # Managed Agent client + custom-tool UI renderer
backend/
  server.py           # FastAPI: Managed Agents proxy + /voice/token
  voice_agent.py      # LiveKit Agents worker with STT/LLM/TTS fallbacks
.claude/skills/       # Authoring skills (patient generator, rubric author, guideline curator, ...)
scripts/verify/       # Deterministic data-integrity checks
```

---

## Model routing

| Call | Model | Why |
|---|---|---|
| Patient voice persona | Haiku 4.5 | Fast, cheap, good enough for in-character reply |
| Real-time speech stack | Deepgram → OpenAI STT, Anthropic → OpenAI LLM, Cartesia → ElevenLabs → OpenAI TTS | Premium voice first, then lower-friction fallbacks |
| Patient text / triage fallback | Anthropic → OpenAI → Vercel AI Gateway → OpenRouter → Gemini → Cerebras → deterministic | Keeps the simulator responsive when one provider fails |
| `virtion-attending` grading | **Opus 4.7** Managed Agent → direct debrief fallback → deterministic rubric | Clinical reasoning first, graceful degradation last |

## Netlify fallback host

`netlify.toml` publishes the Vite build from `dist`, keeps SPA navigation on `/index.html`, and runs an Edge Function proxy for `/voice/*`, `/agent/*`, and `/health`. Set these Netlify environment variables server-side only:

```env
VIRTION_BACKEND_URL=https://your-backend-host
BACKEND_SHARED_SECRET=the-same-secret-as-the-backend
```

Use the **exact** public URL from Railway (**Settings → Networking / Generate domain**), for example `https://virtion-backend-production.up.railway.app`, with **no trailing slash**.

If `https://virtion.netlify.app/health` returns `"backend_error":"unreachable"` or `"backend_proxy_configured":true` together with degraded upstream, `VIRTION_BACKEND_URL` in Netlify does not match your live Railway hostname — update it and **trigger a Netlify redeploy**.

The Edge Function injects the shared secret so the browser can call same-origin `/voice/token` on `https://virtion.netlify.app` without exposing backend credentials.

## Render production backend

`render.yaml` creates the two always-on production processes Virtion needs:

- `virtion-backend` — FastAPI web service for `/agent/*`, `/health`, and backend `/voice/token`.
- `virtion-voice-worker` — persistent LiveKit Agents worker that listens for `virtion-voice` dispatches and speaks to patients.

Use Render's Blueprint flow from the repo root. Fill every `sync: false` secret directly in Render, then copy the backend service URL into Netlify/Vercel as `VIRTION_BACKEND_URL`. The frontend can stay on Netlify and Vercel; the realtime patient worker must run as this long-lived Render worker.

---

## Notes

- **Group policy on Windows:** scripts call `node node_modules/<pkg>/bin/<entry>.js` instead of the `.bin` shims because some corporate machines block `.exe` wrappers under `node_modules/`. Keep this pattern when adding new scripts.
- **Prompt caching is on** in the patient-persona path — set `cache_control: { type: 'ephemeral' }` on system prompts when you add new Claude calls.
- **Out of scope:** multi-agent handoffs, persistent user accounts, anything claiming clinical accuracy.

---

## License

Private
