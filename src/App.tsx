import { Scene } from './components/scene/Scene';
import { InfoPanel } from './components/ui/InfoPanel';

export default function App() {
  return (
    <main className="relative h-full w-full overflow-hidden bg-[#05060a]">
      <Scene />
      <InfoPanel />
    </main>
  );
}
