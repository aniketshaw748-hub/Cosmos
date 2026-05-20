import { useEffect, useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import {
  searchNasaImages,
  galleryQuery,
  largeImageUrl,
  type NasaImage,
} from '../../lib/nasaImages';

type Status = 'loading' | 'ready' | 'empty' | 'error';

/** Feature 6 — a modal grid of real NASA photos of the selected object. */
export function NASAGallery() {
  const galleryOpen = useSceneStore((s) => s.galleryOpen);
  const selected = useSceneStore((s) => s.selected);
  const setGalleryOpen = useSceneStore((s) => s.setGalleryOpen);

  const [status, setStatus] = useState<Status>('loading');
  const [images, setImages] = useState<NasaImage[]>([]);
  const [active, setActive] = useState<NasaImage | null>(null);

  // Lazy fetch — only when the modal is actually opened.
  useEffect(() => {
    if (!galleryOpen || !selected) return;
    let alive = true;
    setStatus('loading');
    setImages([]);
    setActive(null);
    searchNasaImages(galleryQuery(selected))
      .then((imgs) => {
        if (!alive) return;
        setImages(imgs);
        setStatus(imgs.length ? 'ready' : 'empty');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, [galleryOpen, selected]);

  // Escape closes the lightbox first, then the gallery.
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (active) setActive(null);
      else setGalleryOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryOpen, active, setGalleryOpen]);

  if (!galleryOpen || !selected) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-8"
      onClick={() => setGalleryOpen(false)}
    >
      <div
        className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0a0d16] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
              NASA Image Library
            </p>
            <h2 className="text-xl font-semibold text-white">Photos of {selected.name}</h2>
          </div>
          <button
            onClick={() => setGalleryOpen(false)}
            aria-label="Close gallery"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-lg text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {status === 'loading' && <SkeletonGrid />}
          {status === 'empty' && (
            <Message text={`No NASA photos available for ${selected.name}.`} />
          )}
          {status === 'error' && (
            <Message text="The NASA image library is unavailable right now." />
          )}
          {status === 'ready' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActive(img)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-white/8 bg-white/5"
                >
                  <img
                    src={img.thumbUrl}
                    alt={img.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-[10px] leading-tight text-white/85 opacity-0 transition group-hover:opacity-100">
                    {img.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {active && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/85 p-4 sm:p-10"
          onClick={() => setActive(null)}
        >
          <div
            className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/12 bg-[#0a0d16]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={largeImageUrl(active.thumbUrl)}
              alt={active.title}
              onError={(e) => {
                e.currentTarget.src = active.thumbUrl;
              }}
              className="max-h-[58vh] w-full bg-black object-contain"
            />
            <div className="overflow-y-auto p-5">
              <h3 className="text-base font-semibold text-white">{active.title}</h3>
              <p className="mt-1 text-xs text-white/45">
                {[active.center, active.year].filter(Boolean).join(' · ')}
              </p>
              {active.description && (
                <p className="mt-2 line-clamp-5 text-[13px] leading-relaxed text-white/65">
                  {active.description}
                </p>
              )}
              <p className="mt-3 text-[11px] text-white/35">Source: NASA</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-lg bg-white/5" />
      ))}
    </div>
  );
}

function Message({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-center text-sm text-white/50">
      {text}
    </div>
  );
}
