import { getEpisode } from "@/lib/blobs";
import Stars from "@/components/Stars";
import AudioPlayer from "@/components/AudioPlayer";
import { notFound } from "next/navigation";
import ViewCounter from "@/components/ViewCounter";

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const ep = await getEpisode(params.id);
  if (!ep) return notFound();

  return (
    <div className="space-y-8">
      <ViewCounter id={params.id} />
      <div className="flex items-start gap-6">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-500 to-ink-700 flex items-center justify-center text-2xl font-semibold">{ep.title.slice(0,1).toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{ep.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
            <Stars value={ep.rating} />
            <span className="text-white/40">•</span>
            <span>{ep.views.toLocaleString()} views</span>
          </div>
        </div>
      </div>

      <AudioPlayer src={ep.audioUrl} captionsVttUrl={ep.captionsVttUrl} />

      <article className="prose prose-invert max-w-none">
        <p className="whitespace-pre-wrap text-white/80 leading-relaxed">{ep.body}</p>
      </article>
    </div>
  );
}
