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

  useEffect(() => {
    loadNurses();
  }, []);

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
      profile_id: userId,
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

  async function handleDelete(id: string, profileId: string) {
    if (!confirm("Yakin hapus perawat ini?")) return;
    await supabase.from("nurses").delete().eq("id", id);
    await fetch(`/api/nurses/${profileId}`, { method: "DELETE" });
    setNurses((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Perawat</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Perawat</h1>
          <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
            {showForm ? "Tutup Form" : "+ Tambah Perawat"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-6 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama" name="name" />
              <Field label="NIP" name="nip" />
              <Field label="Departemen" name="department" />
              <Field label="Email" name="email" type="email" />
              <Field label="Password" name="password" type="password" />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={saving} className="rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">Memuat...</p>
        ) : nurses.length === 0 ? (
          <p className="text-gray-500">Belum ada data perawat.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">NIP</th>
                  <th className="px-4 py-3">Departemen</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {nurses.map((n) => (
                  <tr key={n.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{n.profiles?.name || "-"}</td>
                    <td className="px-4 py-3">{n.nip}</td>
                    <td className="px-4 py-3">{n.department}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(n.id, n.profile_id)} className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input id={name} name={name} type={type} required className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-teal-500 focus:ring-teal-500" />
    </div>
  );
}
