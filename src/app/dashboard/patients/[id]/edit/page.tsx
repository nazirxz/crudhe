"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Patient, SessionRecord } from "@/types/database";

export default function EditPatientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase.from("patients").select("*").eq("id", id).single().then(({ data }) => setPatient(data));
    supabase.from("session_records").select("*").eq("patient_id", id).order("day").then(({ data }) => setRecords(data || []));
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const newDay = Number(form.get("current_day"));

    const { error: updateError } = await supabase.from("patients").update({
      username_display: form.get("name") as string,
      age: Number(form.get("age")),
      diagnosis: form.get("diagnosis") as string,
      chemo_cycle: form.get("chemo_cycle") as string,
      phone: form.get("phone") as string,
      start_date: form.get("start_date") as string,
      current_day: newDay,
    }).eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.from("profiles").update({ name: form.get("name") as string }).eq("id", id);
    setPatient((p) => p ? { ...p, current_day: newDay } : p);
    setSuccess("Data berhasil disimpan!");
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function toggleSession(day: number) {
    const existing = records.find((r) => r.day === day);
    if (existing) {
      // Remove session record
      await supabase.from("session_records").delete().eq("id", existing.id);
      setRecords(records.filter((r) => r.id !== existing.id));
    } else {
      // Create session record as completed & approved
      const { data } = await supabase.from("session_records").insert({
        patient_id: id,
        day,
        status: "selesai",
        approval_status: "disetujui",
        mood: 3,
        completed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      }).select().single();
      if (data) setRecords([...records, data].sort((a, b) => a.day - b.day));
    }
  }

  async function bulkSetSessions(upToDay: number) {
    // Delete all existing records
    await supabase.from("session_records").delete().eq("patient_id", id);

    // Create records for day 1 to upToDay
    if (upToDay > 0) {
      const inserts = Array.from({ length: upToDay }, (_, i) => ({
        patient_id: id,
        day: i + 1,
        status: "selesai" as const,
        approval_status: "disetujui" as const,
        mood: 3,
        completed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      }));
      const { data } = await supabase.from("session_records").insert(inserts).select();
      setRecords(data || []);
    } else {
      setRecords([]);
    }

    // Update current_day
    const newDay = upToDay + 1;
    await supabase.from("patients").update({ current_day: newDay }).eq("id", id);
    setPatient((p) => p ? { ...p, current_day: newDay } : p);
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  const completedDays = records.map((r) => r.day);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/patients" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Pasien</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Edit</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Data Pasien */}
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">📋 Data Pasien</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama Lengkap" name="name" defaultValue={patient.username_display} required />
            <FormField label="Usia" name="age" type="number" defaultValue={String(patient.age)} required />
            <FormField label="Diagnosis" name="diagnosis" defaultValue={patient.diagnosis} required />
            <FormField label="Siklus Kemoterapi" name="chemo_cycle" defaultValue={patient.chemo_cycle} required />
            <FormField label="No. Telepon" name="phone" defaultValue={patient.phone} required />
            <FormField label="Tanggal Mulai" name="start_date" type="date" defaultValue={patient.start_date} required />
            <div>
              <label htmlFor="current_day" className="block text-sm font-medium text-gray-700 mb-1">Hari Saat Ini (1-16)</label>
              <input
                id="current_day"
                name="current_day"
                type="number"
                min={1}
                max={16}
                defaultValue={patient.current_day}
                required
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
              />
              <p className="mt-1 text-xs text-gray-400">16 = sudah selesai semua sesi</p>
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {error}</div>}
          {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">✅ {success}</div>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 shadow-md shadow-teal-200 transition-all">
              {loading ? "⏳ Menyimpan..." : "💾 Simpan Data"}
            </button>
            <Link href="/dashboard/patients" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Kembali
            </Link>
          </div>
        </form>

        {/* Session Checklist */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">✅ Checklist Sesi</h2>
              <p className="text-sm text-gray-500">Centang sesi yang sudah dikerjakan pasien ({completedDays.length}/15 selesai)</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => bulkSetSessions(0)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors">
              Reset Semua
            </button>
            <button onClick={() => bulkSetSessions(5)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
              Set s/d Hari 5
            </button>
            <button onClick={() => bulkSetSessions(10)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
              Set s/d Hari 10
            </button>
            <button onClick={() => bulkSetSessions(15)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
              Set Semua Selesai
            </button>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300" style={{ width: `${(completedDays.length / 15) * 100}%` }} />
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => {
              const done = completedDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleSession(day)}
                  className={`relative rounded-xl p-3 text-center transition-all border-2 ${done ? "border-teal-500 bg-teal-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <span className={`text-lg font-bold ${done ? "text-teal-700" : "text-gray-400"}`}>
                    {day}
                  </span>
                  <p className="text-[10px] mt-0.5 text-gray-500">Hari {day}</p>
                  {done && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] text-white">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Questionnaire Simulation */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">📊 Kuesioner</h2>
          <p className="text-sm text-gray-500 mb-4">Kelola pre-test dan post-test untuk pasien ini</p>
          <Link
            href={`/dashboard/questionnaires?patient=${id}`}
            className="inline-flex rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white hover:bg-rose-700 shadow-md shadow-rose-200 transition-all"
          >
            📝 Buka Kuesioner untuk Pasien Ini
          </Link>
        </div>
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
