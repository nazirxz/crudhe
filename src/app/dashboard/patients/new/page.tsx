"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, createEphemeralAuthClient } from "@/lib/supabase";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const name = form.get("name") as string;

    // 1. Signup user baru via ephemeral client
    const ephemeral = createEphemeralAuthClient();
    const { data: signUpData, error: signUpError } = await ephemeral.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message || "Gagal membuat akun");
      setLoading(false);
      return;
    }

    const userId = signUpData.user.id;

    // 2. Insert profile
    await supabase.from("profiles").upsert({
      id: userId,
      role: "pasien",
      name,
    });

    // 3. Get current nurse
    const { data: { session } } = await supabase.auth.getSession();
    const { data: nurse } = await supabase
      .from("nurses")
      .select("id")
      .eq("profile_id", session!.user.id)
      .single();

    // 4. Insert patient
    const { error: patientError } = await supabase.from("patients").insert({
      profile_id: userId,
      username_display: name,
      age: Number(form.get("age")),
      diagnosis: form.get("diagnosis") as string,
      chemo_cycle: Number(form.get("chemo_cycle")),
      phone: form.get("phone") as string,
      start_date: form.get("start_date") as string,
      current_day: 1,
      nurse_id: nurse!.id,
    });

    if (patientError) {
      setError(patientError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/patients");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <a href="/dashboard/patients" className="text-sm text-gray-600 hover:underline">Pasien</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Tambah</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Tambah Pasien Baru</h1>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <Field label="Nama Lengkap" name="name" required />
          <Field label="Email (untuk login)" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required />
          <Field label="Usia" name="age" type="number" required />
          <Field label="Diagnosis" name="diagnosis" required />
          <Field label="Siklus Kemoterapi" name="chemo_cycle" type="number" required />
          <Field label="No. Telepon" name="phone" required />
          <Field label="Tanggal Mulai" name="start_date" type="date" required />

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

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-teal-500 focus:ring-teal-500"
      />
    </div>
  );
}
