import type { Handler } from "@netlify/functions";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const s3 = new S3Client({ region: process.env.AWS_S3_REGION });

function toVtt(segments: Array<{ start: number; end: number; text: string }>) {
  const toTimestamp = (t: number) => {
    const h = Math.floor(t / 3600).toString().padStart(2, "0");
    const m = Math.floor((t % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    const ms = Math.round((t % 1) * 1000).toString().padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  };
  const lines = ["WEBVTT", ""]; 
  for (const seg of segments) {
    lines.push(`${toTimestamp(seg.start)} --> ${toTimestamp(seg.end)}`);
    lines.push(seg.text.trim());
    lines.push("");
  }
  return lines.join("\n");
}

async function putToS3(Key: string, Body: string, ContentType: string) {
  const Bucket = process.env.AWS_S3_BUCKET!;
  await s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
  return `https://${Bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${Key}`;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
    const { episodeId, audioUrl } = JSON.parse(event.body || "{}");
    if (!episodeId || !audioUrl) return { statusCode: 400, body: "episodeId and audioUrl required" };

    const res = await fetch(audioUrl);
    if (!res.ok) return { statusCode: 400, body: "Failed to fetch audio" };
    const arrayBuffer = await res.arrayBuffer();
    const file = await toFile(Buffer.from(arrayBuffer), "audio.mp3", { type: "audio/mpeg" });

    // Whisper transcription (verbose for segments)
    const tr: any = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json"
    } as any);

    // Build VTT
    const segments: Array<{ start: number; end: number; text: string }> = ((tr && tr.segments) || []).map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text,
    }));
    const vtt = toVtt(segments);

    // Save to S3
    const baseKey = `transcripts/${episodeId}/${Date.now()}`;
    const vttUrl = await putToS3(`${baseKey}.vtt`, vtt, "text/vtt");
    const jsonUrl = await putToS3(`${baseKey}.json`, JSON.stringify({ text: tr.text, segments }, null, 2), "application/json");

    // Update episode record via internal API
    const siteUrl = process.env.SITE_BASE_URL || process.env.URL || "";
    const apiUrl = siteUrl ? `${siteUrl}/api/episodes/${episodeId}` : `/api/episodes/${episodeId}`;
    await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captionsVttUrl: vttUrl, transcriptJsonUrl: jsonUrl })
    }).catch(() => {});

    return { statusCode: 200, body: JSON.stringify({ vttUrl, jsonUrl }) };
  } catch (e: any) {
    return { statusCode: 500, body: e.message || "Transcription error" };
  }
};
