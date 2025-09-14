import { NextRequest, NextResponse } from "next/server";
import { deleteEpisode, getEpisode, saveEpisode } from "@/lib/blobs";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const ep = await getEpisode(params.id);
  if (!ep) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ep);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getEpisode(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const patch = await req.json();
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await saveEpisode(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await deleteEpisode(params.id);
  return NextResponse.json({ ok: true });
}
