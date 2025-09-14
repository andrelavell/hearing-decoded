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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <ViewCounter id={params.id} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Episode badge */}
        <div className="mb-6">
          <span className="inline-block bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
            Episode 8
          </span>
        </div>

        {/* Main title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight max-w-4xl">
          {ep.title}
        </h1>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left column - Album art and metadata */}
          <div className="space-y-8">
            {/* Album art with overlay text */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl p-8 flex flex-col justify-between text-black">
                <div className="text-sm font-medium italic">THE</div>
                <div className="space-y-2">
                  <div className="text-6xl font-black">BIG</div>
                  <div className="text-4xl font-bold">DECISION</div>
                </div>
                <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center ml-auto">
                  <div className="w-12 h-12 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/80">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span className="text-sm">Published on: {format(created, "MMM d, yyyy")}</span>
              </div>
              
              <div className="flex items-center gap-2 text-white/80">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span className="text-sm">{typeof ep.duration === 'number' ? `${Math.floor(ep.duration / 60)}min` : '1hr 05min'}</span>
              </div>

              {/* Play button */}
              <div className="flex items-center gap-4 mt-6">
                <button className="bg-yellow-400 text-black w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg hover:bg-yellow-300 transition-colors">
                  ▶
                </button>
                <span className="font-semibold">Play episode</span>
              </div>

              {/* Inline player */}
              <div className="mt-4">
                <AudioPlayer src={ep.audioUrl} captionsVttUrl={ep.captionsVttUrl} variant="inline" color="yellow" />
              </div>

              {/* Listen on platforms */}
              <div className="mt-8">
                <div className="text-sm text-white/70 mb-3">Listen on:</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" title="Apple Podcasts"></div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full" title="Overcast"></div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full" title="Castro"></div>
                  <div className="w-8 h-8 bg-green-500 rounded-full" title="Spotify"></div>
                  <div className="w-8 h-8 bg-gray-600 rounded-full" title="More"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Host image */}
          <div className="lg:block">
            <div className="bg-yellow-400 p-4 rounded-3xl">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/host-${ep.id}/600/450`}
                  alt="Podcast host"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Episode Description */}
        {ep.body && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Episode Description</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/80 leading-relaxed text-lg whitespace-pre-wrap">{ep.body}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
