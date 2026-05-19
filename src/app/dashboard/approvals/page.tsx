"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface PendingRecord {
  id: string;
  day: number;
  mood: number | null;
  approval_status: string;
  created_at: string;
  patients: { username_display: string } | null;
}

export default function ApprovalsPage() {
  const [records, setRecords] = useState<PendingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("session_records")
      .select("id, day, mood, approval_status, created_at, patients(username_display)")
      .eq("approval_status", "menunggu")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRecords((data as unknown as PendingRecord[]) || []);
        setLoading(false);
      });
  }, []);

  async function handleApproval(id: string, status: "disetujui" | "ditolak") {
    await supabase.from("session_records").update({ approval_status: status }).eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  const moodEmoji = (m: number | null) => {
    if (m === null) return "-";
    const emojis = ["😢", "😟", "😐", "🙂", "😊"];
    return emojis[Math.min(m, 4)] || String(m);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Approval Sesi</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">✅ Approval Sesi Pasien</h1>
            <p className="text-sm text-gray-500 mt-1">Setujui atau tolak sesi harian yang telah diselesaikan pasien</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Menunggu: </span>
            <span className="font-bold text-amber-600">{records.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-lg font-medium text-gray-600">Semua sesi sudah diproses</p>
            <p className="text-sm text-gray-400 mt-1">Tidak ada sesi yang menunggu persetujuan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-lg font-bold text-amber-700">
                    {r.day}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{r.patients?.username_display || "Pasien"}</p>
                    <p className="text-sm text-gray-500">
                      Hari {r.day} • Mood: {moodEmoji(r.mood)} • {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval(r.id, "disetujui")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
                  >
                    ✓ Setujui
                  </button>
                  <button
                    onClick={() => handleApproval(r.id, "ditolak")}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-md shadow-red-200 transition-all"
                  >
                    ✕ Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
