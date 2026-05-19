"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Patient } from "@/types/database";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    setPatients(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus pasien ini?")) return;
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <PageShell><p className="text-gray-500">Memuat...</p></PageShell>;
  }

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Pasien</h1>
        <a
          href="/dashboard/patients/new"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          + Tambah Pasien
        </a>
      </div>

      {patients.length === 0 ? (
        <p className="text-gray-500">Belum ada data pasien.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Usia</th>
                <th className="px-4 py-3">Diagnosis</th>
                <th className="px-4 py-3">Siklus Kemo</th>
                <th className="px-4 py-3">Hari Ke-</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.username_display}</td>
                  <td className="px-4 py-3">{p.age}</td>
                  <td className="px-4 py-3">{p.diagnosis}</td>
                  <td className="px-4 py-3">{p.chemo_cycle}</td>
                  <td className="px-4 py-3">{p.current_day}/15</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/patients/${p.id}/edit`)}
                        className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
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
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Pasien</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
