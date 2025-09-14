import { getEpisode } from "@/lib/blobs";
import Stars from "@/components/Stars";
import AudioPlayer from "@/components/AudioPlayer";
import { notFound } from "next/navigation";
import ViewCounter from "@/components/ViewCounter";
import { format } from "date-fns";

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const ep = await getEpisode(params.id);
  if (!ep) return notFound();

  return (
    <div className="min-h-screen">
      <ViewCounter id={params.id} />

      {/* Hero Landing Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50/30 pb-16 pt-8">
        <div className="absolute inset-0 opacity-50">
          <div className="h-full w-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }} />
        </div>
        
        <div className="container relative">
          <div className="mx-auto max-w-4xl">
            {/* Episode Badge */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
                <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                Academic Podcast Series
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-12 lg:grid-cols-[300px,1fr] lg:gap-16">
              {/* Episode Artwork */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative group">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary-500/20 to-purple-500/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative aspect-square w-72 rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-2xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <span className="relative text-8xl font-black text-white/90 tracking-tight">
                      {ep.title.slice(0,1).toUpperCase()}
                    </span>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white/80 text-sm font-medium">Hearing Decoded</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Episode Details */}
              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                    {ep.title}
                  </h1>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Stars value={ep.rating} />
                      <span className="text-sm font-medium">{ep.rating}/5</span>
                    </div>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm font-medium">{ep.views.toLocaleString()} listens</span>
                    {typeof ep.duration === 'number' && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-sm font-medium">{Math.floor(ep.duration / 60)} minutes</span>
                      </>
                    )}
                    <span className="text-slate-400">•</span>
                    <span className="text-sm font-medium">{format(new Date(ep.createdAt), "MMMM d, yyyy")}</span>
                  </div>
                </div>

                {ep.body && (
                  <div className="prose prose-lg prose-slate max-w-none">
                    <p className="text-xl leading-relaxed text-slate-700 font-medium">
                      {ep.body.split('\n')[0]}
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <button className="btn-primary inline-flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Listen Now
                  </button>
                  <button className="btn-secondary inline-flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V7h10v2z"/>
                    </svg>
                    Download
                  </button>
                  <button className="btn-secondary inline-flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audio Player Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <AudioPlayer src={ep.audioUrl} captionsVttUrl={ep.captionsVttUrl} />
        </div>
      </section>

      {/* Episode Content */}
      {ep.body && (
        <section className="py-16 bg-slate-50/50">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="card-elevated p-8 sm:p-12">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Episode Summary</h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
                </div>
                
                <article className="prose prose-lg prose-slate max-w-none">
                  <div className="text-lg leading-relaxed text-slate-700 space-y-6">
                    {ep.body.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-6 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>

                {/* Episode Stats */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{ep.views.toLocaleString()}</div>
                      <div className="text-sm text-slate-600 font-medium">Total Listens</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{ep.rating}/5</div>
                      <div className="text-sm text-slate-600 font-medium">Average Rating</div>
                    </div>
                    {typeof ep.duration === 'number' && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{Math.floor(ep.duration / 60)}</div>
                        <div className="text-sm text-slate-600 font-medium">Minutes</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{format(new Date(ep.createdAt), "MMM")}</div>
                      <div className="text-sm text-slate-600 font-medium">{format(new Date(ep.createdAt), "yyyy")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Episodes CTA */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Explore More Episodes</h2>
            <p className="text-lg text-slate-600 mb-8">
              Dive deeper into the fascinating world of auditory science with our complete collection.
            </p>
            <a href="/" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Browse All Episodes
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
