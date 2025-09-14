import { NextRequest, NextResponse } from "next/server";
import { getEpisode, saveEpisode } from "@/lib/blobs";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const ep = await getEpisode(params.id);
  if (!ep) return NextResponse.json({ error: "Not found" }, { status: 404 });
  ep.views = (ep.views || 0) + 1;
  ep.updatedAt = new Date().toISOString();
  await saveEpisode(ep);
  return NextResponse.json({ views: ep.views });
}
