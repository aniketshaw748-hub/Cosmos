import { useRef, useState } from 'react';
import type { ChatMessage, SceneObject } from '../types';
import { askTutor } from '../lib/ai';
import { useSceneStore } from '../store/useSceneStore';

/** A chat turn, plus client-only flags for a failed request. */
export type ChatMsg = ChatMessage & { error?: boolean; failedQuestion?: string };

/** Minimum gap between sends — debounces eager clicking into the rate limit. */
const SEND_COOLDOWN_MS = 2000;

export interface ChatController {
  messages: ChatMsg[];
  loading: boolean;
  tooFast: boolean;
  /** Send a fresh question. Returns false if it was rejected (empty / debounced). */
  ask: (raw: string) => boolean;
  /** Re-send a question whose previous attempt failed. */
  retry: (question: string) => void;
}

/**
 * AI-tutor conversation state for one object. Mount the consumer with a
 * `key={object.id}` so each object starts a fresh conversation.
 */
export function useChat(object: SceneObject): ChatController {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [tooFast, setTooFast] = useState(false);
  const lastSentAt = useRef(0);

  /** True if we're still inside the post-send cooldown window. */
  function debounced(): boolean {
    if (Date.now() - lastSentAt.current < SEND_COOLDOWN_MS) {
      setTooFast(true);
      window.setTimeout(() => setTooFast(false), 1600);
      return true;
    }
    return false;
  }

  /** Fire one request and append the answer (or a friendly error bubble). */
  async function runRequest(question: string, history: ChatMsg[]) {
    setLoading(true);
    try {
      // Only real exchanges are useful context — drop earlier error bubbles.
      const clean = history.filter((m) => !m.error);
      const answer = await askTutor(object.name, object.aiContext, question, clean);
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : 'The tutor ran into a problem — please try again.';
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: detail, error: true, failedQuestion: question },
      ]);
    } finally {
      setLoading(false);
      // Marks when this exchange ended — the Curious AI waits on this.
      useSceneStore.getState().noteChatActivity();
    }
  }

  function ask(raw: string): boolean {
    const question = raw.trim();
    if (!question || loading || debounced()) return false;

    lastSentAt.current = Date.now();
    const history = messages;
    setMessages((m) => [...m, { role: 'user', content: question }]);
    // Feed the Curious AI: what was asked, and that a chat is in progress.
    const store = useSceneStore.getState();
    store.noteAskedQuestion(question);
    store.noteChatActivity();
    void runRequest(question, history);
    return true;
  }

  function retry(question: string) {
    if (loading || debounced()) return;

    lastSentAt.current = Date.now();
    // History up to (but not including) the failed user turn.
    const errorIdx = messages.findIndex((m) => m.error);
    const history = errorIdx > 0 ? messages.slice(0, errorIdx - 1) : [];
    // Drop the error bubble; the user question bubble stays.
    setMessages((m) => m.filter((msg) => !msg.error));
    void runRequest(question, history);
  }

  return { messages, loading, tooFast, ask, retry };
}
