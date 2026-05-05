"""Provider fallback router for Virtion direct-inference tasks.

The Managed Agent path in ``server.py`` remains the premium debrief route.
This module covers direct text tasks that should never make the app blank:
patient text roleplay, triage classification, and fallback debrief summaries.
Secrets are read from environment variables only and never returned.
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass, field
from typing import Any, Literal

import httpx

ModelTask = Literal["patient", "triage", "debrief"]
DEFAULT_MODEL_ORDER = ["cerebras", "vercel-ai-gateway", "openai", "openrouter", "gemini", "anthropic"]
ORDER_ALIASES = {
    "vercel": "vercel-ai-gateway",
    "vercel_ai_gateway": "vercel-ai-gateway",
    "vercel-gateway": "vercel-ai-gateway",
}


@dataclass
class FallbackTrace:
    provider: str
    model: str
    ok: bool
    detail: str
    elapsed_ms: int


@dataclass
class ProviderSpec:
    name: str
    model: str
    api_key_env: str
    kind: Literal["anthropic", "openai", "gemini"]
    base_url: str
    enabled: bool = True

    @property
    def configured(self) -> bool:
        return self.enabled and bool(os.environ.get(self.api_key_env))


@dataclass
class ModelResult:
    text: str
    provider: str
    model: str
    degraded: bool
    fallback_trace: list[FallbackTrace] = field(default_factory=list)


@dataclass
class ProviderHealth:
    provider: str
    model: str
    configured: bool
    api_key_env: str
    kind: str


def _model(env: str, default: str) -> str:
    return os.environ.get(env) or default


def _chat_completions_url(env: str, default: str) -> str:
    base = os.environ.get(env, default).rstrip("/")
    if base.endswith("/chat/completions"):
        return base
    return f"{base}/chat/completions"


def _normalize_provider(name: str) -> str:
    normalized = name.strip().lower().replace(" ", "-")
    return ORDER_ALIASES.get(normalized, normalized)


def provider_order(task: ModelTask) -> list[str]:
    raw = os.environ.get(f"{task.upper()}_MODEL_ORDER") or os.environ.get("MODEL_ROUTER_ORDER") or ""
    requested = [_normalize_provider(part) for part in raw.split(",") if part.strip()]
    ordered: list[str] = []
    for name in [*requested, *DEFAULT_MODEL_ORDER]:
        if name and name not in ordered:
            ordered.append(name)
    return ordered


def _ordered_specs(specs: list[ProviderSpec], task: ModelTask) -> list[ProviderSpec]:
    remaining = {_normalize_provider(spec.name): spec for spec in specs}
    ordered: list[ProviderSpec] = []
    for name in provider_order(task):
        spec = remaining.pop(_normalize_provider(name), None)
        if spec:
            ordered.append(spec)
    ordered.extend(remaining.values())
    return ordered


def provider_specs(task: ModelTask) -> list[ProviderSpec]:
    if task == "triage":
        anthropic_model = _model("ANTHROPIC_TRIAGE_MODEL", "claude-opus-4-7")
        openai_model = _model("OPENAI_TRIAGE_MODEL", "gpt-4o-mini")
        openrouter_model = _model("OPENROUTER_TRIAGE_MODEL", "openai/gpt-4o-mini")
        gateway_model = _model("VERCEL_AI_GATEWAY_TRIAGE_MODEL", "openai/gpt-4o-mini")
        gemini_model = _model("GEMINI_TRIAGE_MODEL", "gemini-2.0-flash-lite")
        cerebras_model = _model("CEREBRAS_TRIAGE_MODEL", "llama-3.3-70b")
    elif task == "debrief":
        anthropic_model = _model("ANTHROPIC_DEBRIEF_MODEL", "claude-opus-4-7")
        openai_model = _model("OPENAI_DEBRIEF_MODEL", "gpt-4o-mini")
        openrouter_model = _model("OPENROUTER_DEBRIEF_MODEL", "anthropic/claude-3.5-sonnet")
        gateway_model = _model("VERCEL_AI_GATEWAY_DEBRIEF_MODEL", "openai/gpt-4o-mini")
        gemini_model = _model("GEMINI_DEBRIEF_MODEL", "gemini-2.0-flash")
        cerebras_model = _model("CEREBRAS_DEBRIEF_MODEL", "llama-3.3-70b")
    else:
        anthropic_model = _model("ANTHROPIC_PATIENT_MODEL", "claude-haiku-4-5")
        openai_model = _model("OPENAI_PATIENT_MODEL", "gpt-4o-mini")
        openrouter_model = _model("OPENROUTER_PATIENT_MODEL", "openai/gpt-4o-mini")
        gateway_model = _model("VERCEL_AI_GATEWAY_PATIENT_MODEL", "openai/gpt-4o-mini")
        gemini_model = _model("GEMINI_PATIENT_MODEL", "gemini-2.0-flash-lite")
        cerebras_model = _model("CEREBRAS_PATIENT_MODEL", "llama-3.1-8b")

    specs = [
        ProviderSpec("anthropic", anthropic_model, "ANTHROPIC_API_KEY", "anthropic", "https://api.anthropic.com/v1/messages"),
        ProviderSpec("openai", openai_model, "OPENAI_API_KEY", "openai", "https://api.openai.com/v1/chat/completions"),
        ProviderSpec("vercel-ai-gateway", gateway_model, "VERCEL_AI_GATEWAY_API_KEY", "openai", _chat_completions_url("VERCEL_AI_GATEWAY_BASE_URL", "https://ai-gateway.vercel.sh/v1")),
        ProviderSpec("openrouter", openrouter_model, "OPENROUTER_API_KEY", "openai", "https://openrouter.ai/api/v1/chat/completions"),
        ProviderSpec("gemini", gemini_model, "GEMINI_API_KEY", "gemini", "https://generativelanguage.googleapis.com/v1beta/models"),
        ProviderSpec("cerebras", cerebras_model, "CEREBRAS_API_KEY", "openai", "https://api.cerebras.ai/v1/chat/completions"),
    ]
    return _ordered_specs(specs, task)


def provider_health(task: ModelTask = "patient") -> list[ProviderHealth]:
    return [
        ProviderHealth(
            provider=spec.name,
            model=spec.model,
            configured=spec.configured,
            api_key_env=spec.api_key_env,
            kind=spec.kind,
        )
        for spec in provider_specs(task)
    ]


async def route_text(
    task: ModelTask,
    system: str,
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 512,
    temperature: float = 0.3,
) -> ModelResult:
    trace: list[FallbackTrace] = []
    for spec in provider_specs(task):
        if not spec.configured:
            trace.append(FallbackTrace(spec.name, spec.model, False, "not configured", 0))
            continue
        started = time.perf_counter()
        try:
            text = await _invoke_provider(spec, system, messages, max_tokens=max_tokens, temperature=temperature)
            elapsed = int((time.perf_counter() - started) * 1000)
            if not text.strip():
                raise RuntimeError("empty response")
            trace.append(FallbackTrace(spec.name, spec.model, True, "ok", elapsed))
            return ModelResult(text=text, provider=spec.name, model=spec.model, degraded=False, fallback_trace=trace)
        except Exception as exc:  # provider/network failures should not break the app
            elapsed = int((time.perf_counter() - started) * 1000)
            trace.append(FallbackTrace(spec.name, spec.model, False, str(exc)[:240], elapsed))

    text = deterministic_text(task, system, messages)
    trace.append(FallbackTrace("local-deterministic", "virtion-rubric-fallback", True, "last resort", 0))
    return ModelResult(
        text=text,
        provider="local-deterministic",
        model="virtion-rubric-fallback",
        degraded=True,
        fallback_trace=trace,
    )


async def _invoke_provider(
    spec: ProviderSpec,
    system: str,
    messages: list[dict[str, str]],
    *,
    max_tokens: int,
    temperature: float,
) -> str:
    if spec.kind == "anthropic":
        return await _invoke_anthropic(spec, system, messages, max_tokens=max_tokens, temperature=temperature)
    if spec.kind == "gemini":
        return await _invoke_gemini(spec, system, messages, max_tokens=max_tokens, temperature=temperature)
    return await _invoke_openai_compatible(spec, system, messages, max_tokens=max_tokens, temperature=temperature)


async def _invoke_anthropic(
    spec: ProviderSpec,
    system: str,
    messages: list[dict[str, str]],
    *,
    max_tokens: int,
    temperature: float,
) -> str:
    key = os.environ[spec.api_key_env]
    payload = {
        "model": spec.model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system,
        "messages": messages,
    }
    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    async with httpx.AsyncClient(timeout=24) as client:
        resp = await client.post(spec.base_url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
    blocks = data.get("content") or []
    return "".join(block.get("text", "") for block in blocks if block.get("type") == "text")


async def _invoke_openai_compatible(
    spec: ProviderSpec,
    system: str,
    messages: list[dict[str, str]],
    *,
    max_tokens: int,
    temperature: float,
) -> str:
    key = os.environ[spec.api_key_env]
    payload = {
        "model": spec.model,
        "messages": [{"role": "system", "content": system}, *messages],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    headers = {
        "authorization": f"Bearer {key}",
        "content-type": "application/json",
        "http-referer": "https://virtion.vercel.app",
        "x-title": "Virtion",
    }
    async with httpx.AsyncClient(timeout=24) as client:
        resp = await client.post(spec.base_url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
    choices = data.get("choices") or []
    if not choices:
        return ""
    msg = choices[0].get("message") or {}
    return str(msg.get("content") or "")


async def _invoke_gemini(
    spec: ProviderSpec,
    system: str,
    messages: list[dict[str, str]],
    *,
    max_tokens: int,
    temperature: float,
) -> str:
    key = os.environ[spec.api_key_env]
    contents: list[dict[str, Any]] = []
    for message in messages:
        role = "model" if message.get("role") == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": message.get("content", "")}]})
    payload = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
    }
    url = f"{spec.base_url}/{spec.model}:generateContent?key={key}"
    async with httpx.AsyncClient(timeout=24) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(str(part.get("text", "")) for part in parts)


def deterministic_text(task: ModelTask, system: str, messages: list[dict[str, str]]) -> str:
    if task == "triage":
        return _deterministic_triage(messages[-1].get("content", "") if messages else "")
    if task == "debrief":
        return "Deterministic fallback debrief: the premium attending route was unavailable. Review the structured rubric score below and rerun the case when provider access returns."
    last = messages[-1].get("content", "") if messages else ""
    return _deterministic_patient_reply(system, last)


def _deterministic_patient_reply(system: str, last_user: str) -> str:
    lower = last_user.lower()
    if not last_user.strip():
        return "I'm here because these symptoms have been worrying me."
    if any(word in lower for word in ["pain", "hurt", "ache", "sore"]):
        return "It has been uncomfortable and I would like to understand what is causing it."
    if any(word in lower for word in ["medicine", "medication", "tablet", "prescribe"]):
        return "I can take medicine if you explain what it is for and what side effects to watch for."
    if any(word in lower for word in ["worry", "concern", "expect"]):
        return "I am mostly worried this could become serious or affect my daily life."
    complaint_match = re.search(r"chief complaint[:\s]+(.+)", system, flags=re.IGNORECASE)
    if complaint_match:
        return f"The main thing is {complaint_match.group(1).strip()[:120]}"
    return "I understand. Can you explain the next step in simple terms?"


def _deterministic_triage(text: str) -> str:
    lower = text.lower()
    critical_terms = [
        "st elevation", "troponin", "airway", "anaphylaxis", "stroke",
        "vf", "ventricular fibrillation", "torsades", "sbp 80", "spo2 88",
    ]
    urgent_terms = ["chest pain", "appendicitis", "asthma", "rvr", "fever", "shortness of breath"]
    if any(term in lower for term in critical_terms):
        level = "critical"
        rationale = "Red-flag features in the presentation require immediate senior review."
        flags = ["deterministic red flag"]
    elif any(term in lower for term in urgent_terms):
        level = "urgent"
        rationale = "Symptoms may carry significant morbidity, but no deterministic immediate red flag was found."
        flags = []
    else:
        level = "stable"
        rationale = "No deterministic red flags or urgent features were detected in the supplied summary."
        flags = []
    return json.dumps({"esi_level": level, "rationale": rationale, "red_flags": flags})


def trace_as_dict(trace: list[FallbackTrace]) -> list[dict[str, Any]]:
    return [item.__dict__ for item in trace]
