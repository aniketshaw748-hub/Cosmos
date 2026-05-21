import { Scene } from './components/scene/Scene';
import { InfoPanel } from './components/ui/InfoPanel';
import { DailyHero } from './components/ui/DailyHero';
import { Loader } from './components/ui/Loader';
import { Hud } from './components/ui/Hud';
import { FocusVignette } from './components/ui/FocusVignette';
import { NASAGallery } from './components/ui/NASAGallery';
import { TimelineScrubber } from './components/ui/TimelineScrubber';
import { ComingSoonToast } from './components/ui/ComingSoonToast';
import { MobileNotice } from './components/ui/MobileNotice';
import { CuriousAi } from './components/ui/CuriousAi';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  useKeyboardShortcuts();

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#05060a]">
      <Scene />
      <FocusVignette />
      <Hud />
      <InfoPanel />
      <TimelineScrubber />
      <NASAGallery />
      <ComingSoonToast />
      <CuriousAi />
      <Loader />
      <DailyHero />
      <MobileNotice />
    </main>
  );
}
