import { useEffect } from 'react';
import { useSceneStore } from '../store/useSceneStore';

/**
 * Global keyboard shortcuts:
 *  - Esc   — deselect the current object
 *  - Space — pause / resume orbital motion (ignored while typing)
 */
export function useKeyboardShortcuts(): void {
  const deselect = useSceneStore((s) => s.deselect);
  const togglePaused = useSceneStore((s) => s.togglePaused);
  const galleryOpen = useSceneStore((s) => s.galleryOpen);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea';

      if (e.key === 'Escape') {
        // While the gallery is open it owns Escape (closes lightbox / itself).
        if (!galleryOpen) deselect();
      } else if (e.code === 'Space' && !typing) {
        e.preventDefault();
        togglePaused();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deselect, togglePaused, galleryOpen]);
}
