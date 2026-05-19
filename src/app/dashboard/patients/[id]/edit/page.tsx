"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Patient } from "@/types/database";

export default function EditPatientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("patients").select("*").eq("id", id).single().then(({ data }) => setPatient(data));
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const { error: updateError } = await supabase.from("patients").update({
      username_display: form.get("name") as string,
      age: Number(form.get("age")),
      diagnosis: form.get("diagnosis") as string,
      chemo_cycle: form.get("chemo_cycle") as string,
      phone: form.get("phone") as string,
      start_date: form.get("start_date") as string,
    }).eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.from("profiles").update({ name: form.get("name") as string }).eq("id", id);
    router.push("/dashboard/patients");
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <a href="/dashboard/patients" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Pasien</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Edit</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Pasien</h1>
          <p className="mt-1 text-sm text-gray-500">Perbarui data {patient.username_display}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama Lengkap" name="name" defaultValue={patient.username_display} required />
            <FormField label="Usia" name="age" type="number" defaultValue={String(patient.age)} required />
            <FormField label="Diagnosis" name="diagnosis" defaultValue={patient.diagnosis} required />
            <FormField label="Siklus Kemoterapi" name="chemo_cycle" defaultValue={patient.chemo_cycle} required />
            <FormField label="No. Telepon" name="phone" defaultValue={patient.phone} required />
            <FormField label="Tanggal Mulai" name="start_date" type="date" defaultValue={patient.start_date} required />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 shadow-md shadow-teal-200 transition-all">
              {loading ? "⏳ Menyimpan..." : "💾 Simpan"}
            </button>
            <a href="/dashboard/patients" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Batal
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormField({ label, name, type = "text", defaultValue, required }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
      />
    </div>
  );
}
