import { getEpisode } from "@/lib/blobs";
import Stars from "@/components/Stars";
import AudioPlayer from "@/components/AudioPlayer";
import { notFound } from "next/navigation";
import ViewCounter from "@/components/ViewCounter";

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const ep = await getEpisode(params.id);
  if (!ep) return notFound();

  return (
    <div className="space-y-10">
      <ViewCounter id={params.id} />

      {/* Hero section */}
      <section className="card overflow-hidden">
        <div className="p-6 sm:p-10 grid gap-8 sm:grid-cols-[220px,1fr] lg:grid-cols-[280px,1fr]">
          {/* Cover */}
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent-500 to-ink-700 shadow-soft flex items-center justify-center">
              <span className="text-6xl font-extrabold tracking-tight text-black/80">
                {ep.title.slice(0,1).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{ep.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
              <Stars value={ep.rating} />
              <span className="text-white/40">•</span>
              <span>{ep.views.toLocaleString()} views</span>
              {typeof ep.duration === 'number' && (
                <>
                  <span className="text-white/40">•</span>
                  <span>{Math.floor(ep.duration / 60)} min</span>
                </>
              )}
            </div>
            {ep.body && (
              <p className="mt-5 max-h-28 overflow-hidden text-white/80 leading-relaxed">
                {ep.body}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Player */}
      <section>
        <AudioPlayer src={ep.audioUrl} captionsVttUrl={ep.captionsVttUrl} />
      </section>

      {/* Description */}
      {ep.body && (
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-3">Episode summary</h2>
          <article className="max-w-none">
            <p className="whitespace-pre-wrap text-white/80 leading-relaxed">{ep.body}</p>
          </article>
        </section>
      )}
    </div>
  );
}
