import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy for NASA's Near-Earth Object Web Service (NeoWs) feed.
 * Returns a slimmed-down list of today's near-Earth asteroids and caches it
 * for an hour to stay well within NASA's rate limit.
 */

const TTL = 60 * 60 * 1000; // 1 hour
let cache: { at: number; data: unknown } | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.NASA_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'NASA_API_KEY is not configured' });
  }

  if (cache && Date.now() - cache.at < TTL) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json(cache.data);
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const url =
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}` +
      `&end_date=${today}&api_key=${key}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `NASA NeoWs responded ${upstream.status}` });
    }

    const raw = (await upstream.json()) as any;
    const dayList: any[] = raw.near_earth_objects?.[today] ?? [];

    const asteroids = dayList.map((neo) => {
      const meters = neo.estimated_diameter?.meters;
      const approach = neo.close_approach_data?.[0];
      return {
        id: String(neo.id),
        name: String(neo.name ?? 'Unknown').replace(/[()]/g, '').trim(),
        diameterMeters: meters
          ? (meters.estimated_diameter_min + meters.estimated_diameter_max) / 2
          : 0,
        hazardous: Boolean(neo.is_potentially_hazardous_asteroid),
        missDistanceKm: approach ? Number(approach.miss_distance?.kilometers ?? 0) : 0,
        velocityKph: approach ? Number(approach.relative_velocity?.kilometers_per_hour ?? 0) : 0,
        approachDate:
          approach?.close_approach_date_full ?? approach?.close_approach_date ?? today,
        magnitude: typeof neo.absolute_magnitude_h === 'number' ? neo.absolute_magnitude_h : null,
      };
    });

    // Biggest / most interesting first.
    asteroids.sort((a, b) => b.diameterMeters - a.diameterMeters);

    const data = { date: today, count: asteroids.length, asteroids };
    cache = { at: Date.now(), data };
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message });
  }
}
