"use client";

import { useEffect, useState } from "react";
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

  if (loading) return <Shell><p className="text-gray-500">Memuat...</p></Shell>;

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sesi Program (15 Hari)</h1>
        <a href="/dashboard/sessions/edit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          + Tambah / Edit Sesi
        </a>
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500">Belum ada sesi program.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <a key={s.id} href={`/dashboard/sessions/${s.day}`} className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">Hari {s.day}</span>
                  <h2 className="mt-1 font-semibold text-gray-900">{s.title}</h2>
                </div>
                <span className="text-sm text-gray-400">→</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Sesi Program</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
