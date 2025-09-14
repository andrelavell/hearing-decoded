import { getEpisode } from "@/lib/blobs";
import AudioPlayer from "@/components/AudioPlayer";
import { notFound } from "next/navigation";
import ViewCounter from "@/components/ViewCounter";
import EpisodeMeta from "@/components/EpisodeMeta";

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
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent-500 to-ink-200 shadow-soft flex items-center justify-center">
              <span className="text-6xl font-extrabold tracking-tight text-white">
                {ep.title.slice(0,1).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{ep.title}</h1>
            <EpisodeMeta
              title={ep.title}
              authors={ep.authors}
              createdAt={ep.createdAt}
              duration={ep.duration}
              permalink={ep.permalink}
              doi={ep.doi}
              transcriptJsonUrl={ep.transcriptJsonUrl}
              audioUrl={ep.audioUrl}
            />
            {ep.body && (
              <p className="mt-5 max-h-28 overflow-hidden text-slate-700 leading-relaxed">
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

      {/* Abstract */}
      {ep.body && (
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-3">Abstract</h2>
          <article className="max-w-none">
            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{ep.body}</p>
          </article>
        </section>
      )}

      {/* Key points */}
      {Array.isArray(ep.keyPoints) && ep.keyPoints.length > 0 && (
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-3">Key points</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            {ep.keyPoints.map((kp, i) => (
              <li key={i}>{kp}</li>
            ))}
          </ul>
        </section>
      )}

      {/* References */}
      {Array.isArray(ep.references) && ep.references.length > 0 && (
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-3">References</h2>
          <ol className="list-decimal pl-5 space-y-2 text-slate-700">
            {ep.references.map((ref, i) => (
              <li key={i}>{ref}</li>
            ))}
          </ol>
        </section>
      )}

      {/* License */}
      {ep.license && (
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-3">License</h2>
          <p className="text-slate-700">{ep.license}</p>
        </section>
      )}
    </div>
  );
}

