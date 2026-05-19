"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

    const ephemeral = createEphemeralAuthClient();
    const { data: signUpData, error: signUpError } = await ephemeral.auth.signUp({ email, password });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message || "Gagal membuat akun");
      setLoading(false);
      return;
    }

    const userId = signUpData.user.id;
    await supabase.from("profiles").upsert({ id: userId, role: "pasien", name });

    const { data: { session } } = await supabase.auth.getSession();

    const { error: patientError } = await supabase.from("patients").insert({
      id: userId,
      username_display: name,
      age: Number(form.get("age")),
      diagnosis: form.get("diagnosis") as string,
      chemo_cycle: form.get("chemo_cycle") as string,
      phone: form.get("phone") as string,
      start_date: form.get("start_date") as string,
      current_day: 1,
      nurse_id: session!.user.id,
      plain_password: password,
    });

    if (patientError) {
      setError(patientError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/patients");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/patients" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Pasien</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Tambah</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pasien Baru</h1>
          <p className="mt-1 text-sm text-gray-500">Isi data pasien dan buat akun login</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama Lengkap" name="name" required />
            <FormField label="Email (untuk login)" name="email" type="email" required />
            <FormField label="Password" name="password" type="password" required />
            <FormField label="Usia" name="age" type="number" required />
            <FormField label="Diagnosis" name="diagnosis" required />
            <FormField label="Siklus Kemoterapi" name="chemo_cycle" required />
            <FormField label="No. Telepon" name="phone" required />
            <FormField label="Tanggal Mulai" name="start_date" type="date" required />
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
            <Link href="/dashboard/patients" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Batal
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormField({ label, name, type = "text", required, defaultValue }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
      />
    </div>
  );
}
