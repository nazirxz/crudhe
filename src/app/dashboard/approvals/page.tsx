"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PendingRecord {
  id: string;
  day: number;
  mood: string | null;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Approval Sesi</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Approval Sesi Pasien</h1>

        {loading ? (
          <p className="text-gray-500">Memuat...</p>
        ) : records.length === 0 ? (
          <p className="text-gray-500">Tidak ada sesi yang menunggu persetujuan.</p>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900">{r.patients?.username_display || "Pasien"}</p>
                  <p className="text-sm text-gray-500">Hari {r.day} • Mood: {r.mood || "-"} • {new Date(r.created_at).toLocaleDateString("id-ID")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval(r.id, "disetujui")}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => handleApproval(r.id, "ditolak")}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Tolak
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
