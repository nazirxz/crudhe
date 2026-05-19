"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RelaxationTrack, RelaxationCategory } from "@/types/database";

const CATEGORIES: RelaxationCategory[] = ["ombak", "hujan", "hutan", "sungai", "air-terjun", "burung", "angin", "musik", "campuran"];

const CATEGORY_ICONS: Record<string, string> = {
  ombak: "🌊", hujan: "🌧️", hutan: "🌲", sungai: "💧", "air-terjun": "🏞️", burung: "🐦", angin: "🍃", musik: "🎶", campuran: "🎵", semua: "🎧",
};

export default function RelaxationPage() {
  const [tracks, setTracks] = useState<RelaxationTrack[]>([]);
  const [filter, setFilter] = useState<RelaxationCategory | "semua">("semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("relaxation_tracks").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setTracks(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "semua" ? tracks : tracks.filter((t) => t.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Relaksasi</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎵 Suara Relaksasi</h1>
          <p className="text-sm text-gray-500 mt-1">Dengarkan suara alam untuk menenangkan pikiran</p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("semua")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filter === "semua" ? "bg-teal-600 text-white shadow-md shadow-teal-200" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"}`}
          >
            {CATEGORY_ICONS.semua} Semua ({tracks.length})
          </button>
          {CATEGORIES.map((c) => {
            const count = tracks.filter(t => t.category === c).length;
            if (count === 0) return null;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition-all ${filter === c ? "bg-teal-600 text-white shadow-md shadow-teal-200" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"}`}
              >
                {CATEGORY_ICONS[c]} {c} ({count})
              </button>
            );
          })}
        </div>

        {/* Tracks */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400">Tidak ada track untuk kategori ini</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <a
                key={t.id}
                href={`https://www.youtube.com/watch?v=${t.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{CATEGORY_ICONS[t.category] || "🎵"}</span>
                  <span className="inline-flex rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 capitalize">{t.category}</span>
                </div>
                <h2 className="mt-3 font-bold text-gray-900 group-hover:text-teal-700 transition-colors">{t.title}</h2>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{t.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{Math.floor(t.duration_sec / 60)} menit</span>
                  <span className="text-sm font-medium text-teal-600 group-hover:text-teal-700">▶ Putar</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
