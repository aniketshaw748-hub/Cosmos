import { useCuriousAi } from '../../hooks/useCuriousAi';
import { CuriosityLog } from './CuriosityLog';

/**
 * Mount point for the Curious AI. Runs the proactive-question orchestrator and
 * hosts the session-history log. Isolated in its own component so the
 * orchestrator's store subscriptions never re-render the whole app tree.
 */
export function CuriousAi() {
  useCuriousAi();
  return <CuriosityLog />;
}
