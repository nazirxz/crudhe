"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ProgramSession } from "@/types/database";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("program_sessions").select("*").order("day").then(({ data }) => {
      setSessions(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">Sesi Program</span>
          </div>
          <Link href="/dashboard/sessions/edit" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 shadow-md shadow-teal-200 transition-all">
            + Tambah / Edit Sesi
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📚 Sesi Program Edukasi</h1>
            <p className="text-sm text-gray-500 mt-1">15 hari sesi edukasi pasien kemoterapi</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Total: </span>
            <span className="font-bold text-teal-700">{sessions.length}/15</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 text-lg">Belum ada sesi program</p>
            <p className="text-sm text-gray-400 mt-1">Klik tombol "Tambah" untuk memulai</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <Link
                key={s.day}
                href={`/dashboard/sessions/${s.day}`}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full opacity-10" style={{ background: `linear-gradient(135deg, ${s.color_from}, ${s.color_to})` }} />
                <div className="flex items-start justify-between">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${s.color_from}, ${s.color_to})` }}>
                    {s.day}
                  </span>
                  <span className="text-gray-300 group-hover:text-teal-500 transition-colors">→</span>
                </div>
                <h2 className="mt-3 font-bold text-gray-900 line-clamp-2">{s.title}</h2>
                <p className="mt-1 text-xs text-gray-500">{s.theme}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
