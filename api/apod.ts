import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy for NASA's Astronomy Picture of the Day.
 * Keeps NASA_API_KEY server-side and caches the response for an hour.
 */

const TTL = 60 * 60 * 1000; // 1 hour
let cache: { at: number; data: unknown } | null = null;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.NASA_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'NASA_API_KEY is not configured' });
  }

  if (cache && Date.now() - cache.at < TTL) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json(cache.data);
  }

  try {
    const url = `https://api.nasa.gov/planetary/apod?thumbs=true&api_key=${key}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `NASA APOD responded ${upstream.status}` });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (await upstream.json()) as any;
    const data = {
      title: raw.title ?? 'Astronomy Picture of the Day',
      explanation: raw.explanation ?? '',
      url: raw.url ?? '',
      hdurl: raw.hdurl ?? null,
      mediaType: raw.media_type ?? 'image',
      thumbnailUrl: raw.thumbnail_url ?? null,
      date: raw.date ?? new Date().toISOString().slice(0, 10),
      copyright: raw.copyright ? String(raw.copyright).trim() : null,
    };

    cache = { at: Date.now(), data };
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message });
  }
}
