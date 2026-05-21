import { memo, useEffect, useRef, useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import type { SceneObject } from '../../types';
import type { ViewportMode } from '../../hooks/useMobileLayout';
import { useVisualViewport } from '../../hooks/useMobileLayout';
import { useChat } from '../../hooks/useChat';
import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import { CuriosityNudge } from './CuriosityNudge';
import { DissectButton } from './DissectButton';
import { getMoonsByPlanet } from '../../data/moons';
import { moonToSceneObject } from '../../lib/sceneObject';

/** How far (px) the user must scroll up before auto-scroll yields to them. */
const SCROLL_LOCK_THRESHOLD = 100;

/**
 * The inner panel: a fixed header, one scroll region holding the object's
 * facts plus the chat transcript, and a pinned chat input. Mounted with a
 * `key={object.id}` so each object gets a fresh conversation + scroll state.
 */
export const PanelContent = memo(function PanelContent({
  object,
  accent,
  mode,
}: {
  object: SceneObject;
  accent: string;
  mode: ViewportMode;
}) {
  const deselect = useSceneStore((s) => s.deselect);
  const select = useSceneStore((s) => s.select);
  const setGalleryOpen = useSceneStore((s) => s.setGalleryOpen);
  const chatExpanded = useSceneStore((s) => s.chatExpanded);
  const toggleChatExpanded = useSceneStore((s) => s.toggleChatExpanded);
  const { keyboard } = useVisualViewport();

  const chat = useChat(object);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stuckUp = useRef(false);
  const [showJump, setShowJump] = useState(false);

  const isPortrait = mode === 'mobile-portrait';
  const isLandscape = mode === 'mobile-landscape';
  const compact = isLandscape;
  // Hide the fact sections when chat is expanded, or when the keyboard is up
  // on a portrait phone (so the conversation keeps every available pixel).
  const hideSections = chatExpanded || (isPortrait && keyboard > 0);
  const moons = object.kind === 'planet' ? getMoonsByPlanet(object.id) : [];

  // Auto-scroll to the newest message — unless the user scrolled up to read
  // back, in which case surface a "jump to latest" pill instead.
  useEffect(() => {
    if (chat.messages.length === 0 && !chat.loading) return;
    if (stuckUp.current) {
      setShowJump(true);
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.messages, chat.loading]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stuckUp.current = distance > SCROLL_LOCK_THRESHOLD;
    if (!stuckUp.current) setShowJump(false);
  }

  function jumpToBottom() {
    stuckUp.current = false;
    setShowJump(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  return (
    <>
      {/* Header — flex-shrink-0, never scrolls. */}
      <header className={`relative shrink-0 ${compact ? 'px-4 pb-2 pt-3' : 'px-6 pb-4 pt-6'}`}>
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
        <div
          className={`absolute flex items-center gap-1.5 ${
            compact ? 'right-3 top-2.5' : 'right-4 top-5'
          }`}
        >
          <button
            onClick={toggleChatExpanded}
            aria-label={chatExpanded ? 'Collapse chat' : 'Expand chat'}
            title={chatExpanded ? 'Collapse chat' : 'Expand chat'}
            className={`flex items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/30 hover:bg-white/10 hover:text-white ${
              compact ? 'h-7 w-7' : 'h-8 w-8'
            }`}
          >
            <ExpandIcon expanded={chatExpanded} />
          </button>
          <button
            onClick={deselect}
            aria-label="Close panel"
            className={`flex items-center justify-center rounded-full border border-white/10 leading-none text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white ${
              compact ? 'h-7 w-7 text-base' : 'h-8 w-8 text-lg'
            }`}
          >
            ×
          </button>
        </div>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          {object.kind}
        </span>
        <h2
          className={`mt-1 font-semibold tracking-tight text-white ${
            compact ? 'text-xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          {object.name}
        </h2>
        {!compact && (
          <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-white/55">
            {object.blurb}
          </p>
        )}
      </header>

      {/* Scroll region — actions, facts, moons and the chat transcript. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="cosmos-scroll min-h-0 flex-1 overflow-y-auto"
      >
        {!hideSections && (
          <>
            {/* Actions */}
            <div className={`flex flex-wrap gap-2 ${compact ? 'px-4 pb-2 pt-2' : 'px-6 pb-3 pt-1'}`}>
              <DissectButton />
              <button
                onClick={() => setGalleryOpen(true)}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:text-white"
              >
                View NASA Photos
              </button>
            </div>

            {/* Quick facts */}
            <div className={`border-b border-white/[0.06] ${compact ? 'px-4 pb-2' : 'px-6 pb-4'}`}>
              {!compact && (
                <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Quick facts
                </h3>
              )}
              {compact ? (
                <div className="flex gap-4 overflow-x-auto pb-1">
                  {object.stats.map((stat) => (
                    <div key={stat.label} className="shrink-0">
                      <dt className="text-[9px] uppercase tracking-wider text-white/35">
                        {stat.label}
                      </dt>
                      <dd className="text-[12px] font-medium text-white/90">{stat.value}</dd>
                    </div>
                  ))}
                </div>
              ) : (
                <dl className="grid grid-cols-2 gap-x-5">
                  {object.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex flex-col border-b border-white/[0.05] py-1.5"
                    >
                      <dt className="text-[10px] uppercase tracking-wider text-white/35">
                        {stat.label}
                      </dt>
                      <dd className="text-[13px] font-medium text-white/90">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {/* Moons */}
            {moons.length > 0 && (
              <div
                className={`border-b border-white/[0.06] ${compact ? 'px-4 py-2' : 'px-6 py-3'}`}
              >
                <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Moons · {moons.length}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {moons.map((moon) => (
                    <button
                      key={moon.id}
                      onClick={() => select(moonToSceneObject(moon, [0, 0, 0]))}
                      className="rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-xs text-white/75 transition hover:border-white/30 hover:text-white"
                    >
                      {moon.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Cosmos AI section label */}
        <div className={`pt-3 pb-1 ${compact ? 'px-4' : 'px-6'}`}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Cosmos AI
          </span>
        </div>

        <ChatThread
          messages={chat.messages}
          loading={chat.loading}
          accent={accent}
          object={object}
          onRetry={chat.retry}
          onPick={chat.ask}
        />
        <div ref={bottomRef} />
      </div>

      {/* Jump-to-latest pill — only while the user has scrolled up. */}
      {showJump && (
        <button
          onClick={jumpToBottom}
          className="absolute bottom-[78px] left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/15 bg-[#11151f] px-3 py-1.5 text-[11px] font-semibold text-white/80 shadow-lg transition hover:border-white/35 hover:text-white"
        >
          New message ↓
        </button>
      )}

      {/* Curious AI nudge — a gentle proactive question, just above the input. */}
      <CuriosityNudge accent={accent} onAccept={chat.ask} />

      {/* Chat input — flex-shrink-0, never scrolls. */}
      <ChatInput
        object={object}
        accent={accent}
        onSend={chat.ask}
        loading={chat.loading}
        tooFast={chat.tooFast}
      />
    </>
  );
});

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
