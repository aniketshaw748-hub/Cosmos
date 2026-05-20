/** A single result from the NASA Image and Video Library (Feature 6). */
export interface NasaImage {
  id: string;
  title: string;
  description: string;
  year: string;
  center: string;
  thumbUrl: string;
}

/** Chooses a sensible NASA-image search term for an object. */
export function galleryQuery(object: { name: string; kind: string }): string {
  if (object.kind === 'star') return 'sun';
  if (object.kind === 'asteroid') return 'asteroid';
  return object.name.replace(/^the\s+/i, '');
}

/** Derives a larger image URL from a NASA thumbnail URL, for the lightbox. */
export function largeImageUrl(thumbUrl: string): string {
  return thumbUrl.replace('~thumb', '~medium');
}

/**
 * Searches the NASA Image and Video Library. The API is free and needs no key,
 * and serves CORS headers, so this is called directly from the client.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function searchNasaImages(query: string): Promise<NasaImage[]> {
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(
    query,
  )}&media_type=image`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NASA image search failed (${res.status})`);

  const json = (await res.json()) as any;
  const items: any[] = json?.collection?.items ?? [];

  return items
    .slice(0, 24)
    .map((item) => {
      const meta = item.data?.[0] ?? {};
      const date = String(meta.date_created ?? '');
      return {
        id: String(meta.nasa_id ?? meta.title ?? Math.random()),
        title: String(meta.title ?? 'Untitled'),
        description: String(meta.description ?? ''),
        year: date.slice(0, 4),
        center: String(meta.center ?? 'NASA'),
        thumbUrl: String(item.links?.[0]?.href ?? ''),
      };
    })
    .filter((img) => img.thumbUrl.startsWith('http'));
}
