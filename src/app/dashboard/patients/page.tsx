"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Patient } from "@/types/database";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    setPatients(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus pasien ini?")) return;
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = patients.filter((p) =>
    p.username_display.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">Pasien</span>
          </div>
          <a href="/dashboard/patients/new" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 shadow-md shadow-teal-200 transition-all">
            + Tambah Pasien
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Pasien</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{patients.length}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Aktif (Hari ≤ 15)</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">{patients.filter(p => p.current_day <= 15).length}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Selesai</p>
            <p className="mt-1 text-3xl font-bold text-blue-600">{patients.filter(p => p.current_day > 15).length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari pasien berdasarkan nama atau diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
          <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg">Belum ada data pasien</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">Usia</th>
                    <th className="px-6 py-3">Diagnosis</th>
                    <th className="px-6 py-3">Siklus Kemo</th>
                    <th className="px-6 py-3">Progress</th>
                    <th className="px-6 py-3">Password</th>
                    <th className="px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{p.username_display}</td>
                      <td className="px-6 py-4 text-gray-600">{p.age}</td>
                      <td className="px-6 py-4 text-gray-600">{p.diagnosis}</td>
                      <td className="px-6 py-4 text-gray-600">{p.chemo_cycle}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: `${Math.min((p.current_day - 1) / 15 * 100, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{p.current_day}/15</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.plain_password || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => router.push(`/dashboard/patients/${p.id}/edit`)} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors">
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
