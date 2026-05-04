"""Virtion — LiveKit voice agent (patient persona, real-time).

Runs as a separate process from the FastAPI server. Joins every LiveKit
room created by the frontend and roleplays the patient over WebRTC:

    Browser mic → Deepgram/OpenAI STT → Claude/OpenAI LLM → Cartesia/ElevenLabs/OpenAI TTS → Browser

The persona prompt and voice ID come from room metadata (set by the
backend `/voice/token` endpoint when the room is created), so this
worker has zero patient-specific knowledge — TS owns that.

Run:
    backend/.venv-voice/Scripts/python.exe backend/voice_agent.py dev
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import Agent, AgentSession, RoomInputOptions, WorkerOptions, cli
from livekit.plugins import anthropic, cartesia, deepgram, silero

try:
    from livekit.plugins import elevenlabs
except ImportError:  # Optional TTS fallback plugin.
    elevenlabs = None

try:
    from livekit.plugins import openai
except ImportError:  # Optional STT/LLM/TTS fallback plugin.
    openai = None

# Load backend env files first, then root .env as a final local fallback.
_BACKEND = Path(__file__).resolve().parent
_ROOT = _BACKEND.parent
load_dotenv(_BACKEND / ".env.local")
load_dotenv(_BACKEND / ".env")
load_dotenv(_ROOT / ".env")

logger = logging.getLogger("virtion.voice-agent")
logger.setLevel(logging.INFO)


# Cartesia Sonic-2 voice IDs — verified via /voices API (gender attr).
# 2 male + 2 female English voices, picked deterministically per case.
VOICE_IDS = {
    "M": [
        "d709a7e8-9495-4247-aef0-01b3207d11bf",  # Donny - Steady Presence
        "ea7c252f-6cb1-45f5-8be9-b4f6ac282242",  # Logan - Approachable Friend
    ],
    "F": [
        "cec7cae1-ac8b-4a59-9eac-ec48366f37ae",  # Haley - Engaging Friend
        "ea93f57f-7c71-4d79-aeaa-0a39b150f6ca",  # Diana - Gentle Mom
    ],
}

DEFAULT_VOICE = VOICE_IDS["M"][0]
DEFAULT_INSTRUCTIONS = (
    "You are a patient speaking to a doctor. Keep replies to 1-2 short spoken "
    "sentences. Output spoken dialogue only — no stage directions, no asterisks."
)
DEFAULT_INITIAL = "Hi doc."
ELEVENLABS_VOICE_IDS = {
    "M": "pNInz6obpgDQGcFmaJgB",
    "F": "EXAVITQu4vr4xnSDxMaL",
}


def _env(*names: str) -> str:
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    return ""


def _sync_provider_env_aliases() -> None:
    eleven_key = _env("ELEVEN_API_KEY", "ELEVENLABS_API_KEY")
    if eleven_key and not os.environ.get("ELEVEN_API_KEY"):
        os.environ["ELEVEN_API_KEY"] = eleven_key


def _hash_str(s: str) -> int:
    """FNV-1a, mirrors src/voice/patientPersona.ts so TS-side and Python-side
    pick the same voice slot for the same case ID if frontend chose to defer."""
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def pick_voice(case_id: str, gender: str) -> str:
    pool = VOICE_IDS.get(gender.upper()) or VOICE_IDS["M"]
    return pool[_hash_str(case_id) % len(pool)]


def parse_metadata(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("room metadata is not valid JSON: %r", raw[:120])
        return {}


def build_stt():
    if os.environ.get("DEEPGRAM_API_KEY"):
        model = os.environ.get("DEEPGRAM_STT_MODEL", "nova-3")
        logger.info("voice STT provider=deepgram model=%s", model)
        return deepgram.STT(model=model, language="en")
    if openai and os.environ.get("OPENAI_API_KEY"):
        model = os.environ.get("OPENAI_STT_MODEL", "gpt-4o-transcribe")
        logger.info("voice STT provider=openai model=%s", model)
        return openai.STT(model=model, language="en")
    raise RuntimeError("No voice STT provider configured. Add DEEPGRAM_API_KEY or OPENAI_API_KEY.")


def build_llm():
    if os.environ.get("ANTHROPIC_API_KEY"):
        model = os.environ.get("ANTHROPIC_VOICE_MODEL", "claude-haiku-4-5-20251001")
        logger.info("voice LLM provider=anthropic model=%s", model)
        return anthropic.LLM(model=model, temperature=0.8)
    if openai and os.environ.get("OPENAI_API_KEY"):
        model = os.environ.get("OPENAI_VOICE_MODEL", "gpt-4o-mini")
        logger.info("voice LLM provider=openai model=%s", model)
        responses = getattr(openai, "responses", None)
        if responses and hasattr(responses, "LLM"):
            return responses.LLM(model=model)
        return openai.LLM(model=model, temperature=0.8)
    raise RuntimeError("No voice LLM provider configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY.")


def build_tts(voice_id: str, gender: str):
    if os.environ.get("CARTESIA_API_KEY"):
        model = os.environ.get("CARTESIA_TTS_MODEL", "sonic-2")
        logger.info("voice TTS provider=cartesia model=%s voice=%s", model, voice_id)
        return cartesia.TTS(model=model, voice=voice_id)

    eleven_key = _env("ELEVEN_API_KEY", "ELEVENLABS_API_KEY")
    if elevenlabs and eleven_key:
        eleven_voice = (
            _env(f"ELEVENLABS_VOICE_ID_{gender}", f"ELEVEN_VOICE_ID_{gender}")
            or _env("ELEVENLABS_VOICE_ID", "ELEVEN_VOICE_ID")
            or ELEVENLABS_VOICE_IDS.get(gender, ELEVENLABS_VOICE_IDS["M"])
        )
        model = _env("ELEVENLABS_TTS_MODEL", "ELEVEN_TTS_MODEL") or "eleven_flash_v2_5"
        logger.info("voice TTS provider=elevenlabs model=%s voice=%s", model, eleven_voice)
        return elevenlabs.TTS(voice_id=eleven_voice, model=model)

    if openai and os.environ.get("OPENAI_API_KEY"):
        model = os.environ.get("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
        voice = _env(f"OPENAI_TTS_VOICE_{gender}", "OPENAI_TTS_VOICE") or "ash"
        logger.info("voice TTS provider=openai model=%s voice=%s", model, voice)
        return openai.TTS(
            model=model,
            voice=voice,
            instructions="Speak naturally as a concise patient in a clinical simulation.",
        )

    raise RuntimeError("No voice TTS provider configured. Add CARTESIA_API_KEY, ELEVENLABS_API_KEY, or OPENAI_API_KEY.")


async def entrypoint(ctx: agents.JobContext):
    _sync_provider_env_aliases()
    await ctx.connect()

    meta = parse_metadata(ctx.room.metadata)
    case_id = meta.get("caseId") or meta.get("case_id") or "unknown"
    speaker_gender = (meta.get("voiceGender") or meta.get("gender") or "M").upper()
    system_prompt = meta.get("systemPrompt") or DEFAULT_INSTRUCTIONS
    initial_line = meta.get("initialLine") or DEFAULT_INITIAL

    voice_id = meta.get("voiceId") or pick_voice(case_id, speaker_gender)

    logger.info(
        "joining room=%s case=%s gender=%s voice=%s",
        ctx.room.name, case_id, speaker_gender, voice_id,
    )

    session = AgentSession(
        stt=build_stt(),
        llm=build_llm(),
        tts=build_tts(voice_id, speaker_gender),
        vad=silero.VAD.load(),
    )

    agent = Agent(instructions=system_prompt)

    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(),
    )

    # Frontend signals end-of-visit by publishing a small JSON payload to
    # the room data channel. We speak ONE short farewell out loud via
    # session.say (direct TTS — no LLM round-trip) so the patient actually
    # says goodbye before the room is torn down. Without this the audio
    # cuts mid-sentence on dispatch.
    FAREWELLS = [
        "Thank you, doctor. Take care.",
        "Okay, thanks doc. Goodbye.",
        "Thanks for your help. Bye.",
        "Alright, take care. Goodbye.",
    ]
    farewell_pick = FAREWELLS[_hash_str(case_id) % len(FAREWELLS)]

    # RPC method invoked by the doctor's browser when they click "Dispatch".
    # Speaks ONE short goodbye via direct TTS so the patient actually says
    # bye out loud before the room is torn down.
    @ctx.room.local_participant.register_rpc_method("farewell")
    async def _on_farewell(data: rtc.RpcInvocationData) -> str:
        logger.info("rpc farewell invoked by %s", data.caller_identity)
        try:
            session.say(farewell_pick)
            logger.info("farewell speaking: %r", farewell_pick)
        except Exception as e:
            logger.exception("session.say failed: %s", e)
            return "error"
        return "ok"

    # Patient blurts their chief complaint as soon as the doctor walks up.
    await session.generate_reply(
        instructions=(
            f'Stay strictly in character. Speak this opening line, naturally, '
            f'as the patient (or accompanying parent for pediatric cases) '
            f'arriving in the room: "{initial_line}". One short sentence only.'
        ),
    )


if __name__ == "__main__":
    # `agent_name="virtion-voice"` opts the worker out of automatic dispatch and
    # into explicit-by-name dispatch. Backend rooms are created with
    # `RoomAgentDispatch(agent_name="virtion-voice")` so this matches.
    cli.run_app(
        WorkerOptions(entrypoint_fnc=entrypoint, agent_name="virtion-voice")
    )
