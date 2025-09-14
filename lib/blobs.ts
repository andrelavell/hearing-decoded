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

export async function listEpisodes(): Promise<Omit<Episode, "body">[]> {
  if (!blobsAvailable()) return inMemory.index;
  const store = getStore({ name: STORE_NAME });
  const index = await store.get("index.json", { type: "json" });
  return (index as any) ?? [];
}

export async function getEpisode(id: string): Promise<Episode | null> {
  if (!blobsAvailable()) return inMemory.items.get(id) ?? null;
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
    store.set(`items/${ep.id}.json`, JSON.stringify(ep), { contentType: "application/json" }),
    store.set("index.json", JSON.stringify(await mergeIndex(lite)), { contentType: "application/json" }),
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
    store.set("index.json", JSON.stringify(filtered), { contentType: "application/json" }),
  ]);
}
