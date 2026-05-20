import { useSceneStore } from '../../store/useSceneStore';

/** Feature 3 — toggles the focused planet's cut-away interior view. */
export function DissectButton() {
  const dissectMode = useSceneStore((s) => s.dissectMode);
  const toggleDissect = useSceneStore((s) => s.toggleDissect);

  return (
    <button
      onClick={toggleDissect}
      aria-pressed={dissectMode}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        dissectMode
          ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
          : 'border-white/15 bg-white/[0.04] text-white/75 hover:border-white/30 hover:text-white'
      }`}
    >
      {dissectMode ? 'Re-assemble' : 'Dissect'}
    </button>
  );
}
