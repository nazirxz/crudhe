"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RelaxationTrack, RelaxationCategory } from "@/types/database";

const CATEGORIES: RelaxationCategory[] = ["ombak", "hujan", "hutan", "sungai", "air-terjun", "burung", "angin", "musik", "campuran"];

export default function RelaxationPage() {
  const [tracks, setTracks] = useState<RelaxationTrack[]>([]);
  const [filter, setFilter] = useState<RelaxationCategory | "semua">("semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("relaxation_tracks").select("*").order("title").then(({ data }) => {
      setTracks(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "semua" ? tracks : tracks.filter((t) => t.category === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Relaksasi</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Suara Relaksasi</h1>

        {/* Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterBtn active={filter === "semua"} onClick={() => setFilter("semua")}>Semua</FilterBtn>
          {CATEGORIES.map((c) => (
            <FilterBtn key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</FilterBtn>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Memuat...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">Tidak ada track untuk kategori ini.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <a
                key={t.id}
                href={t.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <span className="inline-block rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">{t.category}</span>
                <h2 className="mt-2 font-semibold text-gray-900">{t.title}</h2>
                <p className="mt-1 text-xs text-teal-600">Buka di YouTube →</p>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition ${active ? "bg-teal-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
    >
      {children}
    </button>
  );
}
