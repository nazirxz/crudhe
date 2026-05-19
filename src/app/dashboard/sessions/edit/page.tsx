"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditSessionPage() {
  const router = useRouter();
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
        education_content: form.get("education_content") as string,
        music_url: form.get("music_url") as string,
        affirmation: form.get("affirmation") as string,
        reflection_intro: form.get("reflection_intro") as string,
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <a href="/dashboard/sessions" className="text-sm text-gray-600 hover:underline">Sesi Program</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Tambah/Edit</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Tambah / Edit Sesi</h1>
        <p className="mb-4 text-sm text-gray-500">Jika hari sudah ada, data akan di-update (upsert).</p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="day" className="block text-sm font-medium text-gray-700">Hari (1-15)</label>
            <input id="day" name="day" type="number" min={1} max={15} required className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-teal-500 focus:ring-teal-500" />
          </div>
          <Field label="Judul Sesi" name="title" />
          <TextArea label="Konten Edukasi" name="education_content" />
          <Field label="URL Musik" name="music_url" />
          <TextArea label="Afirmasi" name="affirmation" />
          <TextArea label="Intro Refleksi" name="reflection_intro" />

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          {success && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{success}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
            <a href="/dashboard/sessions" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Kembali</a>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input id={name} name={name} required className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-teal-500 focus:ring-teal-500" />
    </div>
  );
}

function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea id={name} name={name} rows={3} required className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-teal-500 focus:ring-teal-500" />
    </div>
  );
}
