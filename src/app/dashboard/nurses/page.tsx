"use client";

import { useEffect, useState } from "react";
import { supabase, createEphemeralAuthClient } from "@/lib/supabase";
import type { Nurse } from "@/types/database";

interface NurseWithName extends Nurse {
  profiles?: { name: string } | null;
}

export default function NursesPage() {
  const [nurses, setNurses] = useState<NurseWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadNurses(); }, []);

  async function loadNurses() {
    const { data } = await supabase.from("nurses").select("*, profiles(name)").order("nip");
    setNurses((data as unknown as NurseWithName[]) || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const name = form.get("name") as string;

    const ephemeral = createEphemeralAuthClient();
    const { data: signUpData, error: signUpError } = await ephemeral.auth.signUp({ email, password });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message || "Gagal membuat akun");
      setSaving(false);
      return;
    }

    const userId = signUpData.user.id;
    await supabase.from("profiles").upsert({ id: userId, role: "perawat", name });

    const { error: nurseError } = await supabase.from("nurses").insert({
      id: userId,
      nip: form.get("nip") as string,
      department: form.get("department") as string,
    });

    if (nurseError) {
      setError(nurseError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    loadNurses();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus perawat ini?")) return;
    await supabase.from("nurses").delete().eq("id", id);
    await fetch(`/api/nurses/${id}`, { method: "DELETE" });
    setNurses((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">Perawat</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${showForm ? "bg-gray-200 text-gray-700" : "bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-200"}`}
          >
            {showForm ? "✕ Tutup Form" : "+ Tambah Perawat"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Perawat</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{nurses.length}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Departemen</p>
            <p className="mt-1 text-3xl font-bold text-purple-600">{[...new Set(nurses.map(n => n.department))].length}</p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleAdd} className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">📝 Tambah Perawat Baru</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nama" name="name" />
              <FormField label="NIP" name="nip" />
              <FormField label="Departemen" name="department" />
              <FormField label="Email" name="email" type="email" />
              <FormField label="Password" name="password" type="password" />
            </div>
            {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {error}</div>}
            <button type="submit" disabled={saving} className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 shadow-md shadow-teal-200 transition-all">
              {saving ? "⏳ Menyimpan..." : "💾 Simpan"}
            </button>
          </form>
        )}

        {/* Table */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">🏥 Daftar Perawat</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
            </div>
          ) : nurses.length === 0 ? (
            <div className="p-12 text-center"><p className="text-gray-400">Belum ada data perawat</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">NIP</th>
                    <th className="px-6 py-3">Departemen</th>
                    <th className="px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {nurses.map((n) => (
                    <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{n.profiles?.name || "-"}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{n.nip}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">{n.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDelete(n.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors">
                          Hapus
                        </button>
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

function FormField({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input id={name} name={name} type={type} required className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all" />
    </div>
  );
}
