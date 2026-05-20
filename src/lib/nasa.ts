import type { ApodData, NeoFeed } from '../types';

/** Client-side fetchers for the /api NASA proxies. */

export async function fetchApod(): Promise<ApodData> {
  const res = await fetch('/api/apod');
  if (!res.ok) throw new Error(`APOD request failed (${res.status})`);
  return res.json() as Promise<ApodData>;
}

export async function fetchNeoFeed(): Promise<NeoFeed> {
  const res = await fetch('/api/neo');
  if (!res.ok) throw new Error(`NEO feed request failed (${res.status})`);
  return res.json() as Promise<NeoFeed>;
}
