"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function EditSessionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const { error: upsertError } = await supabase.from("program_sessions").upsert(
      {
        day: Number(form.get("day")),
        title: form.get("title") as string,
        edukasi_title: form.get("edukasi_title") as string,
        edukasi_content: (form.get("edukasi_content") as string).split("\n\n").filter(Boolean),
        musik_title: form.get("musik_title") as string,
        musik_description: form.get("musik_description") as string,
        afirmasi_main_text: form.get("afirmasi_main_text") as string,
        refleksi_title: form.get("refleksi_title") as string,
      },
      { onConflict: "day" }
    );

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSuccess("Sesi berhasil disimpan!");
      e.currentTarget.reset();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/sessions" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Sesi Program</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Tambah/Edit</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">✏️ Tambah / Edit Sesi</h1>
          <p className="mt-1 text-sm text-gray-500">Jika hari sudah ada, data akan di-update (upsert)</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
          <div>
            <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">Hari (1-15)</label>
            <input id="day" name="day" type="number" min={1} max={15} required className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all" />
          </div>

          <FormField label="Judul Sesi" name="title" />
          <FormField label="Judul Edukasi" name="edukasi_title" />
          <TextArea label="Konten Edukasi (pisahkan paragraf dengan baris kosong)" name="edukasi_content" />
          <FormField label="Judul Musik" name="musik_title" />
          <TextArea label="Deskripsi Musik" name="musik_description" />
          <TextArea label="Afirmasi Utama" name="afirmasi_main_text" />
          <FormField label="Judul Refleksi" name="refleksi_title" />

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {error}</div>}
          {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">✅ {success}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 shadow-md shadow-teal-200 transition-all">
              {loading ? "⏳ Menyimpan..." : "💾 Simpan"}
            </button>
            <Link href="/dashboard/sessions" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Kembali
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormField({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input id={name} name={name} required className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all" />
    </div>
  );
}

function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea id={name} name={name} rows={3} required className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all" />
    </div>
  );
}
