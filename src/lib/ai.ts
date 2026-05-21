import type { ChatMessage } from '../types';

/** Only the last few turns are sent — older messages stay in the UI only. */
const MAX_HISTORY = 6;

/**
 * Client-side fetcher for the AI tutor (/api/chat). On failure it throws an
 * Error whose message is already user-friendly and safe to show in the chat.
 */
export async function askTutor(
  objectName: string,
  objectData: Record<string, unknown>,
  question: string,
  history: ChatMessage[],
): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objectName,
        objectData,
        question,
        history: history.slice(-MAX_HISTORY),
      }),
    });
  } catch {
    // Network failure — request never reached the server.
    throw new Error("Couldn't reach the tutor — check your connection and try again.");
  }

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    // The server sends a friendly `message`; fall back gracefully if absent.
    throw new Error(
      detail?.message ??
        detail?.error ??
        'The tutor ran into a problem — please try again.',
    );
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}
