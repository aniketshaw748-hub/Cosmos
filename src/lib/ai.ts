import type { ChatMessage } from '../types';

/** Client-side fetcher for the AI tutor (/api/chat). */
export async function askTutor(
  objectName: string,
  objectData: Record<string, unknown>,
  question: string,
  history: ChatMessage[],
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectName, objectData, question, history }),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `Chat request failed (${res.status})`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}
