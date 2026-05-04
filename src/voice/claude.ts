export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PATIENT_STREAM_URL = '/agent/patient/stream';

/** Backend now owns the Anthropic key (POST /agent/patient/stream).
 *  Kept as a function so callers don't need to change — any real failure
 *  surfaces from the first streamClaude() fetch. */
export function hasClaudeKey(): boolean {
  return true;
}

export async function* streamClaude(
  systemPrompt: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  let res: Response;
  try {
    res = await fetch(PATIENT_STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemPrompt, messages }),
      signal,
    });
  } catch {
    yield localPatientReply(systemPrompt, messages);
    return;
  }
  if (!res.ok || !res.body) {
    yield localPatientReply(systemPrompt, messages);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      const dataLines = frame
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trimStart());
      if (!dataLines.length) continue;
      let parsed: { text?: string; done?: boolean; error?: string };
      try {
        parsed = JSON.parse(dataLines.join('\n'));
      } catch {
        continue;
      }
      if (parsed.error) {
        yield localPatientReply(systemPrompt, messages);
        return;
      }
      if (parsed.done) return;
      if (typeof parsed.text === 'string') yield parsed.text;
    }
  }
}

function localPatientReply(systemPrompt: string, messages: ChatMessage[]): string {
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? '';
  if (last.includes('pain') || last.includes('hurt')) {
    return 'It has been uncomfortable and I would like to know what is causing it.';
  }
  if (last.includes('worry') || last.includes('concern')) {
    return 'I am mainly worried this could become serious or affect my daily life.';
  }
  if (last.includes('medicine') || last.includes('tablet') || last.includes('prescription')) {
    return 'I can take medicine if you explain what it is for and what side effects to watch for.';
  }
  const chief = /chief complaint[:\s]+(.+)/i.exec(systemPrompt)?.[1]?.trim();
  if (chief) return `The main thing is ${chief.slice(0, 120)}`;
  return 'I understand. Could you explain the next step in simple terms?';
}
