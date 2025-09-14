import { getStore } from "@netlify/blobs";
import type { Episode } from "@/lib/types";

const STORE_NAME = "episodes";

const inMemory = {
  index: [] as Omit<Episode, "body">[],
  items: new Map<string, Episode>(),
};

function blobsAvailable() {
  try {
    getStore({ name: STORE_NAME });
    return true;
  } catch {
    return false;
  }
}

function remoteBaseUrl() {
  const base = process.env.REMOTE_API_URL || process.env.SITE_BASE_URL || process.env.URL;
  return base?.replace(/\/$/, "");
}

export async function listEpisodes(): Promise<Omit<Episode, "body">[]> {
  if (!blobsAvailable()) {
    const remote = remoteBaseUrl();
    if (remote) {
      try {
        const res = await fetch(`${remote}/api/episodes`, { cache: "no-store" });
        if (res.ok) return (await res.json()) as Omit<Episode, "body">[];
      } catch {
        // ignore and fall through to in-memory
      }
    }
    return inMemory.index;
  }
  const store = getStore({ name: STORE_NAME });
  const index = await store.get("index.json", { type: "json" });
  return (index as any) ?? [];
}

export async function getEpisode(id: string): Promise<Episode | null> {
  if (!blobsAvailable()) {
    const remote = remoteBaseUrl();
    if (remote) {
      try {
        const res = await fetch(`${remote}/api/episodes/${id}`, { cache: "no-store" });
        if (res.ok) return (await res.json()) as Episode;
        if (res.status === 404) return null;
      } catch {
        // ignore and fall through
      }
    }
    return inMemory.items.get(id) ?? null;
  }
  const store = getStore({ name: STORE_NAME });
  const ep = await store.get(`items/${id}.json`, { type: "json" });
  return (ep as any) ?? null;
}

export async function saveEpisode(ep: Episode): Promise<void> {
  if (!blobsAvailable()) {
    const lite = { ...ep } as Omit<Episode, "body"> & { body?: string };
    delete (lite as any).body;
    inMemory.items.set(ep.id, ep);
    const idx = inMemory.index.filter((x) => x.id !== ep.id);
    inMemory.index = [
      ...idx,
      lite as Omit<Episode, "body">,
    ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return;
  }
  const store = getStore({ name: STORE_NAME });
  const lite: Omit<Episode, "body"> = {
    id: ep.id,
    title: ep.title,
    audioUrl: ep.audioUrl,
    captionsVttUrl: ep.captionsVttUrl,
    transcriptJsonUrl: ep.transcriptJsonUrl,
    rating: ep.rating,
    views: ep.views,
    createdAt: ep.createdAt,
    updatedAt: ep.updatedAt,
    duration: ep.duration,
  };
  await Promise.all([
    store.set(`items/${ep.id}.json`, JSON.stringify(ep)),
    store.set("index.json", JSON.stringify(await mergeIndex(lite))),
  ]);
}

async function mergeIndex(item: Omit<Episode, "body">) {
  const store = getStore({ name: STORE_NAME });
  const current = (await store.get("index.json", { type: "json" })) as any[] | null;
  const filtered = (current ?? []).filter((x) => x.id !== item.id);
  return [item, ...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function deleteEpisode(id: string) {
  if (!blobsAvailable()) {
    inMemory.items.delete(id);
    inMemory.index = inMemory.index.filter((x) => x.id !== id);
    return;
  }
  const store = getStore({ name: STORE_NAME });
  const current = (await store.get("index.json", { type: "json" })) as any[] | null;
  const filtered = (current ?? []).filter((x) => x.id !== id);
  await Promise.all([
    store.delete(`items/${id}.json`),
    store.set("index.json", JSON.stringify(filtered)),
  ]);
}
