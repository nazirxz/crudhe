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
    supabase.from("patients").select("*").eq("id", id).single().then(({ data }) => {
      setPatient(data);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const { error: updateError } = await supabase
      .from("patients")
      .update({
        username_display: form.get("name") as string,
        age: Number(form.get("age")),
        diagnosis: form.get("diagnosis") as string,
        chemo_cycle: Number(form.get("chemo_cycle")),
        phone: form.get("phone") as string,
        start_date: form.get("start_date") as string,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Update nama di profiles juga
    await supabase
      .from("profiles")
      .update({ name: form.get("name") as string })
      .eq("id", patient!.profile_id);

    router.push("/dashboard/patients");
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <a href="/dashboard/patients" className="text-sm text-gray-600 hover:underline">Pasien</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Edit</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Pasien</h1>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <Field label="Nama Lengkap" name="name" defaultValue={patient.username_display} required />
          <Field label="Usia" name="age" type="number" defaultValue={String(patient.age)} required />
          <Field label="Diagnosis" name="diagnosis" defaultValue={patient.diagnosis} required />
          <Field label="Siklus Kemoterapi" name="chemo_cycle" type="number" defaultValue={String(patient.chemo_cycle)} required />
          <Field label="No. Telepon" name="phone" defaultValue={patient.phone} required />
          <Field label="Tanggal Mulai" name="start_date" type="date" defaultValue={patient.start_date} required />

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
            <a
              href="/dashboard/patients"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Batal
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, name, type = "text", defaultValue, required }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-teal-500 focus:ring-teal-500"
      />
    </div>
  );
}
