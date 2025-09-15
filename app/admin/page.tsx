"use client";

import { useEffect, useState } from "react";
import { Episode } from "@/lib/types";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [episodes, setEpisodes] = useState<Omit<Episode, "body">[]>([]);
  const [form, setForm] = useState({ title: "", body: "", rating: 5 });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; body: string; rating: number; views: number }>({ title: "", body: "", rating: 5, views: 0 });

  useEffect(() => {
    // Load Netlify Identity Widget via CDN if not already present
    function setup() {
      const ni = (window as any).netlifyIdentity;
      if (!ni) return;
      setIdentity(ni);
      ni.init();
      setUser(ni.currentUser());
      const onLogin = (u: any) => setUser(u);
      const onLogout = () => setUser(null);
      ni.on("login", onLogin);
      ni.on("logout", onLogout);
      return () => {
        ni.off("login", onLogin);
        ni.off("logout", onLogout);
      };
    }
    if ((window as any).netlifyIdentity) {
      return setup();
    } else {
      const s = document.createElement("script");
      s.src = "https://identity.netlify.com/v1/netlify-identity-widget.js";
      s.async = true;
      s.onload = () => setup();
      document.body.appendChild(s);
      return () => {
        // no-op
      };
    }
  }, []);

  useEffect(() => {
    fetch("/api/episodes").then((r) => r.json()).then(setEpisodes).catch(() => setEpisodes([]));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert("Select an MP3 file");
    setLoading(true);
    try {
      // 1) Ask backend for presigned PUT URL
      const presign = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      }).then((r) => r.json());

      // 2) Upload file directly to S3
      await fetch(presign.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      const audioUrl = presign.publicUrl as string;

      // 3) Create episode record
      const created = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, body: form.body, audioUrl, rating: form.rating })
      }).then((r) => r.json());

      // 4) Trigger transcription function
      await fetch("/.netlify/functions/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: created.id, audioUrl })
      });

      setEpisodes((prev) => [created, ...prev]);
      setForm({ title: "", body: "", rating: 5 });
      setFile(null);
      alert("Episode created and transcription started.");
    } catch (e: any) {
      alert(e.message || "Failed to create episode");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/episodes/${id}`, { method: "DELETE" });
    setEpisodes((prev) => prev.filter((e) => e.id !== id));
  }

  async function startEdit(e: Omit<Episode, "body">) {
    setEditingId(e.id);
    try {
      const full = await fetch(`/api/episodes/${e.id}`).then((r) => (r.ok ? r.json() : null));
      setEditForm({ title: e.title, body: full?.body ?? "", rating: e.rating, views: e.views });
    } catch {
      setEditForm({ title: e.title, body: "", rating: e.rating, views: e.views });
    }
  }

  async function saveEdit(id: string) {
    const updated = await fetch(`/api/episodes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editForm.title, body: editForm.body, rating: editForm.rating, views: editForm.views })
    }).then((r) => r.json());
    setEpisodes((prev) => prev.map((x) => (x.id === id ? updated : x)));
    setEditingId(null);
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        {user ? (
          <button className="px-3 py-1.5 rounded-md bg-white/10" onClick={() => identity?.logout()}>Logout</button>
        ) : (
          <button className="px-3 py-1.5 rounded-md bg-accent-500 text-black" onClick={() => identity?.open()}>Login</button>
        )}
      </div>

      <form onSubmit={handleCreate} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-1">Title</label>
          <input className="w-full bg-white/5 px-3 py-2 rounded-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Body</label>
          <textarea className="w-full bg-white/5 px-3 py-2 rounded-lg" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
        <div className="flex items-center gap-4">
          <label className="block text-sm text-white/70">Rating
            <input type="number" min={0} max={5} step={0.5} className="ml-2 w-24 bg-white/5 px-2 py-1 rounded" value={form.rating} onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })} />
          </label>
          <input type="file" accept="audio/mpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button disabled={loading} className="ml-auto px-4 py-2 rounded-lg bg-accent-500 text-black font-semibold">{loading ? "Uploading…" : "Create Episode"}</button>
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg text-white/80">All Episodes</h2>
        {episodes.map((e) => (
          <div key={e.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1">
              {editingId === e.id ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-sm">Title
                    <input className="w-full bg-white/5 px-2 py-1 rounded ml-2" value={editForm.title} onChange={(ev) => setEditForm({ ...editForm, title: ev.target.value })} />
                  </label>
                  <label className="text-sm">Rating
                    <input type="number" min={0} max={5} step={0.5} className="w-24 bg-white/5 px-2 py-1 rounded ml-2" value={editForm.rating} onChange={(ev) => setEditForm({ ...editForm, rating: parseFloat(ev.target.value) })} />
                  </label>
                  <label className="text-sm sm:col-span-2">Body
                    <textarea className="w-full bg-white/5 px-2 py-1 rounded ml-2" rows={3} value={editForm.body} onChange={(ev) => setEditForm({ ...editForm, body: ev.target.value })} />
                  </label>
                  <label className="text-sm">Views
                    <input type="number" min={0} className="w-32 bg-white/5 px-2 py-1 rounded ml-2" value={editForm.views} onChange={(ev) => setEditForm({ ...editForm, views: parseInt(ev.target.value || '0', 10) })} />
                  </label>
                </div>
              ) : (
                <>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-white/60">{new Date(e.createdAt).toLocaleString()}</div>
                </>
              )}
            </div>
            {editingId === e.id ? (
              <>
                <button className="px-3 py-1.5 rounded-md bg-accent-500 text-black" onClick={() => saveEdit(e.id)}>Save</button>
                <button className="px-3 py-1.5 rounded-md bg-white/10" onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <a className="px-3 py-1.5 rounded-md bg-white/10" href={`/episode/${e.id}`}>View</a>
                <button className="px-3 py-1.5 rounded-md bg-white/10" onClick={() => startEdit(e)}>Edit</button>
                <button className="px-3 py-1.5 rounded-md bg-white/10" onClick={() => remove(e.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
