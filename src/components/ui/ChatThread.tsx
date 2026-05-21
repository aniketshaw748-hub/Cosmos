import type { SceneObject } from '../../types';
import type { ChatMsg } from '../../hooks/useChat';
import { SuggestedQuestions } from './SuggestedQuestions';

/**
 * The AI-tutor message list. Lives inside the panel's scroll region — the
 * input box is rendered separately so it never scrolls away.
 */
export function ChatThread({
  messages,
  loading,
  accent,
  object,
  onRetry,
  onPick,
}: {
  messages: ChatMsg[];
  loading: boolean;
  accent: string;
  object: SceneObject;
  onRetry: (question: string) => void;
  onPick: (question: string) => void;
}) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="px-6 pb-4 pt-1">
        <p className="mb-3 text-sm leading-relaxed text-white/55">
          Your AI tutor for everything about{' '}
          <span className="text-white/90">{object.name}</span>.
        </p>
        <SuggestedQuestions
          questions={object.suggestedQuestions}
          onPick={onPick}
          disabled={loading}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-6 pb-4 pt-1">
      {messages.map((message, i) => (
        <MessageBubble key={i} message={message} accent={accent} onRetry={onRetry} />
      ))}
      {loading && <TypingIndicator />}
    </div>
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
