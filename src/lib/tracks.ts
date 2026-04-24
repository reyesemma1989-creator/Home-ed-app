// Audio-track storage in IndexedDB (via idb-keyval).
// Tracks are stored as Blobs so mobile browsers handle them efficiently.

import { del, get, keys, set } from 'idb-keyval';
import type { Track } from '../store/types';

const META_KEY = (id: string) => `track-meta:${id}`;
const BLOB_KEY = (id: string) => `track-blob:${id}`;

export async function addTrack(file: File, groupId: string): Promise<Track> {
  const id = crypto.randomUUID();
  const track: Track = {
    id,
    name: file.name.replace(/\.[a-z0-9]+$/i, ''),
    groupId,
    mimeType: file.type || 'audio/mpeg',
    size: file.size,
    addedAt: Date.now(),
  };
  await set(META_KEY(id), track);
  await set(BLOB_KEY(id), file);
  return track;
}

export async function getTrackMeta(id: string): Promise<Track | undefined> {
  return get(META_KEY(id));
}

export async function getTrackBlob(id: string): Promise<Blob | undefined> {
  return get(BLOB_KEY(id));
}

export async function deleteTrack(id: string): Promise<void> {
  await del(META_KEY(id));
  await del(BLOB_KEY(id));
}

export async function listAllTracks(): Promise<Track[]> {
  const ks = (await keys()) as string[];
  const metas: Track[] = [];
  for (const k of ks) {
    if (typeof k === 'string' && k.startsWith('track-meta:')) {
      const meta = (await get(k)) as Track | undefined;
      if (meta) metas.push(meta);
    }
  }
  return metas.sort((a, b) => b.addedAt - a.addedAt);
}

export async function getTrackUrl(id: string): Promise<string | null> {
  const blob = await getTrackBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
