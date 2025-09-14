import { getEpisode } from "@/lib/blobs";
import AudioPlayer from "@/components/AudioPlayer";
import { notFound } from "next/navigation";
import ViewCounter from "@/components/ViewCounter";

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const ep = await getEpisode(params.id);
  if (!ep) return notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <ViewCounter id={params.id} />
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:py-12">
        <h1 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">
          {ep.title}
        </h1>

        <div className="mt-6">
          <AudioPlayer src={ep.audioUrl} captionsVttUrl={ep.captionsVttUrl} />
        </div>

        {ep.body && (
          <p className="mt-8 text-base leading-relaxed text-white/80 whitespace-pre-wrap">
            {ep.body}
          </p>
        )}
      </div>
    </div>
  );
}

