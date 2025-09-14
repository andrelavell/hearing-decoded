import { NextRequest, NextResponse } from "next/server";
import { listEpisodes, saveEpisode } from "@/lib/blobs";
import { NewEpisodeInput, Episode } from "@/lib/types";

export async function GET() {
  const list = await listEpisodes();
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as NewEpisodeInput;
  const now = new Date().toISOString();
  const ep: Episode = {
    id: crypto.randomUUID(),
    title: body.title,
    body: body.body || "",
    audioUrl: body.audioUrl,
    rating: body.rating ?? 5,
    views: body.views ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  await saveEpisode(ep);
  const { body: _omit, ...lite } = ep as any;
  return NextResponse.json(lite);
}
