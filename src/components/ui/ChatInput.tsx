import { useState } from 'react';
import type { SceneObject } from '../../types';

/**
 * The AI-tutor input box. Rendered as a flex-shrink-0 sibling of the scroll
 * region so it stays pinned to the panel's edge and never scrolls away; the
 * safe-area padding keeps it clear of the on-screen keyboard / home bar.
 */
export function ChatInput({
  object,
  accent,
  onSend,
  loading,
  tooFast,
}: {
  object: SceneObject;
  accent: string;
  onSend: (question: string) => boolean;
  loading: boolean;
  tooFast: boolean;
}) {
  const [input, setInput] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (onSend(input)) setInput('');
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
  );
}
