import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, SceneObject } from '../../types';
import { askTutor } from '../../lib/ai';
import { getFallbackFact } from '../../data/facts';
import { SuggestedQuestions } from './SuggestedQuestions';

/** AI tutor conversation for the selected object. Remounted per object via a
 *  `key`, so each world gets a fresh conversation. */
export function ChatBox({ object, accent }: { object: SceneObject; accent: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(raw: string) {
    const question = raw.trim();
    if (!question || loading) return;

    const history = messages;
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const answer = await askTutor(object.name, object.aiContext, question, history);
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    } catch {
      // Never leave the user hanging — fall back to a static fact.
      setMessages((m) => [...m, { role: 'assistant', content: getFallbackFact(object) }]);
    } finally {
      setLoading(false);
    }
  }

  const empty = messages.length === 0 && !loading;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {empty ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Ask Cosmos
            </p>
            <p className="mt-1.5 mb-3 text-sm leading-relaxed text-white/55">
              Your AI tutor for everything about{' '}
              <span className="text-white/90">{object.name}</span>.
            </p>
            <SuggestedQuestions
              questions={object.suggestedQuestions}
              onPick={send}
              disabled={loading}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message, i) => (
              <MessageBubble key={i} message={message} accent={accent} />
            ))}
            {loading && <TypingIndicator />}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="shrink-0 border-t border-white/[0.06] p-3"
      >
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

function MessageBubble({ message, accent }: { message: ChatMessage; accent: string }) {
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
