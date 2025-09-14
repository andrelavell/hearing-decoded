import { listEpisodes } from "@/lib/blobs";
import Link from "next/link";
import { format } from "date-fns";
import Stars from "@/components/Stars";

export default async function HomePage() {
  const episodes = await listEpisodes();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Episodes</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        {episodes.length === 0 && (
          <p className="text-white/60">No episodes yet. Add one in Admin.</p>
        )}
        {episodes.map((ep) => (
          <Link key={ep.id} href={`/episode/${ep.id}`} className="card p-5 block hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-accent-500 to-ink-700 flex items-center justify-center text-2xl font-semibold">{ep.title.slice(0,1).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate font-medium text-white/90">{ep.title}</h2>
                  <span className="text-xs text-white/50">{format(new Date(ep.createdAt), "MMM d, yyyy")}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
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
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
