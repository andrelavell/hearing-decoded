import { listEpisodes } from "@/lib/blobs";
import Link from "next/link";
import { format } from "date-fns";
import Stars from "@/components/Stars";

export default async function HomePage() {
  const episodes = await listEpisodes();
  
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700 mb-6">
            <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse"></div>
            Academic Podcast Series
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight">
            Hearing <span className="gradient-text">Decoded</span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Exploring the fascinating world of auditory science through engaging academic discussions and cutting-edge research insights.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-primary-500">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="font-medium">{episodes.length} Episodes</span>
          </div>
          <span className="text-slate-400">•</span>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-primary-500">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="font-medium">Research-Based</span>
          </div>
          <span className="text-slate-400">•</span>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-primary-500">
              <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/>
            </svg>
            <span className="font-medium">Live Transcripts</span>
          </div>
        </div>
      </section>

      {/* Episodes Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-slate-900">Latest Episodes</h2>
          <div className="h-1 flex-1 max-w-32 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full ml-6"></div>
        </div>
        
        {episodes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No episodes yet</h3>
            <p className="text-slate-500 mb-6">New episodes will appear here as they're published.</p>
            <a href="/admin" className="btn-primary">Add First Episode</a>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {episodes.map((ep) => (
              <Link 
                key={ep.id} 
                href={`/episode/${ep.id}`} 
                className="card group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Episode Artwork */}
                <div className="aspect-square bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-black text-white/90 tracking-tight">
                      {ep.title.slice(0,1).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white/80 text-sm font-medium">Episode</div>
                  </div>
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-primary-600 ml-1">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Episode Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-primary-600 transition-colors duration-200">
                      {ep.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                      <Stars value={ep.rating} />
                      <span className="text-slate-400">•</span>
                      <span className="font-medium">{ep.views.toLocaleString()} listens</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">
                      {format(new Date(ep.createdAt), "MMM d, yyyy")}
                    </span>
                    {typeof ep.duration === 'number' && (
                      <span className="text-slate-500 font-medium">
                        {Math.floor(ep.duration / 60)} min
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      {episodes.length > 0 && (
        <section className="text-center py-16 bg-gradient-to-br from-primary-50 to-white rounded-3xl">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Ready to dive deeper?</h2>
            <p className="text-lg text-slate-600">
              Join our community of researchers, students, and professionals exploring the science of hearing.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn-primary">Subscribe to Updates</button>
              <button className="btn-secondary">Browse Research</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
