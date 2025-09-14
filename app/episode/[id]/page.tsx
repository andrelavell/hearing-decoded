import { getEpisode } from "@/lib/blobs";
import Stars from "@/components/Stars";
import AudioPlayer from "@/components/AudioPlayer";
import { notFound } from "next/navigation";
import ViewCounter from "@/components/ViewCounter";
import { format } from "date-fns";

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const ep = await getEpisode(params.id);
  if (!ep) return notFound();

  const created = new Date(ep.createdAt);

  return (
    <div className="space-y-10">
      <ViewCounter id={params.id} />

      {/* Top heading area */}
      <div className="space-y-4">
        <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-semibold">
          Episode
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white max-w-4xl">
          {ep.title}
        </h1>
      </div>

      {/* Hero content area: left meta + inline player, right visual */}
      <section className="grid lg:grid-cols-[minmax(0,1fr),420px] gap-8 items-start">
        {/* Left card */}
        <div className="card p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-[120px,1fr]">
            {/* Square cover */}
            <div>
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent-500 to-ink-700 shadow-soft flex items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight text-black/80">
                  {ep.title.slice(0,1).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Meta and player */}
            <div className="min-w-0">
              <dl className="text-sm text-white/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <dt className="text-white/60">Published on:</dt>
                  <dd>{format(created, "MMM d, yyyy")}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-white/60">Duration:</dt>
                  <dd>{typeof ep.duration === 'number' ? `${Math.floor(ep.duration / 60)} min` : '—'}</dd>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <Stars value={ep.rating} />
                  <span className="text-white/40">•</span>
                  <span>{ep.views.toLocaleString()} views</span>
                </div>
              </dl>

              <div className="mt-5">
                <div className="text-sm text-white/80 mb-2 flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-yellow-400"></span>
                  <span className="font-medium">Play episode</span>
                </div>
                <AudioPlayer src={ep.audioUrl} captionsVttUrl={ep.captionsVttUrl} variant="inline" color="yellow" />
              </div>

              <div className="mt-6">
                <div className="text-sm text-white/70 mb-2">Listen on:</div>
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" title="Apple"></span>
                  <span className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600" title="Instagram"></span>
                  <span className="h-7 w-7 rounded-full bg-green-500" title="Spotify"></span>
                  <span className="h-7 w-7 rounded-full bg-emerald-500" title="RSS"></span>
                  <span className="h-7 w-7 rounded-full bg-yellow-400" title="Other"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right visual panel */}
        <div className="hidden lg:block">
          <div className="rounded-3xl p-3 bg-yellow-400">
            <div className="rounded-2xl overflow-hidden bg-white/5 aspect-[4/3] flex items-center justify-center">
              {/* Placeholder image */}
              <img
                src={`https://picsum.photos/seed/${ep.id}/800/600`}
                alt="Episode visual"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      {ep.body && (
        <section className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-3">Episode Description</h2>
          <article className="max-w-none">
            <p className="whitespace-pre-wrap text-white/80 leading-relaxed">{ep.body}</p>
          </article>
        </section>
      )}
    </div>
  );
}
