import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, SceneObject } from '../../types';
import { askTutor } from '../../lib/ai';
import { useSceneStore } from '../../store/useSceneStore';
import { SuggestedQuestions } from './SuggestedQuestions';

/** A chat turn, plus client-only flags for a failed request. */
type ChatMsg = ChatMessage & { error?: boolean; failedQuestion?: string };

/** Minimum gap between sends — debounces eager clicking into the rate limit. */
const SEND_COOLDOWN_MS = 2000;

/** AI tutor conversation for the selected object. Remounted per object via a
 *  `key`, so each world gets a fresh conversation. */
export function ChatBox({ object, accent }: { object: SceneObject; accent: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tooFast, setTooFast] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSentAt = useRef(0);

  const chatExpanded = useSceneStore((s) => s.chatExpanded);
  const toggleChatExpanded = useSceneStore((s) => s.toggleChatExpanded);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

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
    }
  }

  /** Send a fresh question typed or picked by the user. */
  function ask(raw: string) {
    const question = raw.trim();
    if (!question || loading || debounced()) return;

    lastSentAt.current = Date.now();
    const history = messages;
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    void runRequest(question, history);
  }

  /** Re-send a question whose previous attempt failed. */
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

  const empty = messages.length === 0 && !loading;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Strip with the expand / collapse toggle. */}
      <div className="flex shrink-0 items-center justify-between px-4 pt-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Cosmos AI
        </span>
        <button
          onClick={toggleChatExpanded}
          aria-label={chatExpanded ? 'Collapse chat' : 'Expand chat'}
          title={chatExpanded ? 'Collapse chat' : 'Expand chat'}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/55 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
        >
          <ExpandIcon expanded={chatExpanded} />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-2">
        {empty ? (
          <div>
            <p className="mb-3 text-sm leading-relaxed text-white/55">
              Your AI tutor for everything about{' '}
              <span className="text-white/90">{object.name}</span>.
            </p>
            <SuggestedQuestions
              questions={object.suggestedQuestions}
              onPick={ask}
              disabled={loading}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message, i) => (
              <MessageBubble key={i} message={message} accent={accent} onRetry={retry} />
            ))}
            {loading && <TypingIndicator />}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="shrink-0 border-t border-white/[0.06] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        {tooFast && (
          <p className="mb-1.5 px-1 text-[11px] text-amber-300/80">
            One moment — you're sending questions a little too fast.
          </p>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition focus-within:border-white/25">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${object.name}…`}
            aria-label={`Ask a question about ${object.name}`}
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-lg px-3 py-1 text-xs font-semibold text-[#05060a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-25"
            style={{ background: accent }}
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}

/** Maximize / minimize corner-bracket icon. */
function ExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {expanded ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
    </svg>
  );
}

function MessageBubble({
  message,
  accent,
  onRetry,
}: {
  message: ChatMsg;
  accent: string;
  onRetry: (question: string) => void;
}) {
  if (message.role === 'user') {
    return (
      <div
        className="max-w-[85%] self-end rounded-2xl rounded-br-sm px-3.5 py-2 text-sm font-medium text-[#05060a]"
        style={{ background: accent }}
      >
        {message.content}
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="max-w-full self-start">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-300/70">
            Couldn't answer
          </span>
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-red-400/25 bg-red-500/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-red-100/85">
          {message.content}
          {message.failedQuestion && (
            <button
              onClick={() => onRetry(message.failedQuestion!)}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-red-400/30 px-2.5 py-1 text-[11px] font-semibold text-red-100 transition hover:border-red-400/60 hover:bg-red-400/15"
            >
              <RetryIcon />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full self-start">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Cosmos
        </span>
      </div>
      <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/85">
        {message.content}
      </div>
    </div>
  );
}

/** Circular-arrow retry glyph. */
function RetryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 self-start rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04] px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/55"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
