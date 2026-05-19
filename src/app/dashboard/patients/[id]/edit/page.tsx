"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Patient, SessionRecord, ProgramReflectionQuestion } from "@/types/database";

interface ReflectionAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_text: string;
}

export default function EditPatientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [reflections, setReflections] = useState<ReflectionAnswer[]>([]);
  const [allQuestions, setAllQuestions] = useState<ProgramReflectionQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("patients").select("*").eq("id", id).single().then(({ data }) => setPatient(data));
    supabase.from("session_records").select("*").eq("patient_id", id).order("day").then(({ data }) => setRecords(data || []));
    supabase.from("program_reflection_questions").select("*").order("day,sort_order").then(({ data }) => setAllQuestions(data || []));
    // Load all reflection answers for this patient's sessions
    supabase.from("session_records").select("id").eq("patient_id", id).then(async ({ data: recs }) => {
      if (recs && recs.length > 0) {
        const ids = recs.map(r => r.id);
        const { data: answers } = await supabase.from("reflection_answers").select("*").in("session_id", ids);
        setReflections(answers || []);
      }
    });
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

    if (updateError) { setError(updateError.message); setLoading(false); return; }
    await supabase.from("profiles").update({ name: form.get("name") as string }).eq("id", id);
    setPatient((p) => p ? { ...p, current_day: newDay } : p);
    setSuccess("Data berhasil disimpan!");
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function toggleSession(day: number) {
    const existing = records.find((r) => r.day === day);
    if (existing) {
      await supabase.from("reflection_answers").delete().eq("session_id", existing.id);
      await supabase.from("session_records").delete().eq("id", existing.id);
      setReflections(reflections.filter(r => r.session_id !== existing.id));
      setRecords(records.filter((r) => r.id !== existing.id));
    } else {
      const { data } = await supabase.from("session_records").insert({
        patient_id: id, day, status: "selesai", approval_status: "disetujui",
        mood: 3, completed_at: new Date().toISOString(), approved_at: new Date().toISOString(),
      }).select().single();
      if (data) setRecords([...records, data].sort((a, b) => a.day - b.day));
    }
  }

  async function bulkSetSessions(upToDay: number) {
    // Delete existing
    const existingIds = records.map(r => r.id);
    if (existingIds.length > 0) {
      await supabase.from("reflection_answers").delete().in("session_id", existingIds);
    }
    await supabase.from("session_records").delete().eq("patient_id", id);
    setReflections([]);

    if (upToDay > 0) {
      const inserts = Array.from({ length: upToDay }, (_, i) => ({
        patient_id: id, day: i + 1, status: "selesai" as const, approval_status: "disetujui" as const,
        mood: 3, completed_at: new Date().toISOString(), approved_at: new Date().toISOString(),
      }));
      const { data } = await supabase.from("session_records").insert(inserts).select();
      setRecords(data || []);
    } else {
      setRecords([]);
    }
    const newDay = upToDay + 1;
    await supabase.from("patients").update({ current_day: newDay }).eq("id", id);
    setPatient((p) => p ? { ...p, current_day: newDay } : p);
  }

  async function updateSessionDetail(recordId: string, field: string, value: unknown) {
    await supabase.from("session_records").update({ [field]: value }).eq("id", recordId);
    setRecords(records.map(r => r.id === recordId ? { ...r, [field]: value } : r));
  }

  async function saveReflection(sessionId: string, questionId: string, text: string) {
    const existing = reflections.find(r => r.session_id === sessionId && r.question_id === questionId);
    if (existing) {
      await supabase.from("reflection_answers").update({ answer_text: text }).eq("id", existing.id);
      setReflections(reflections.map(r => r.id === existing.id ? { ...r, answer_text: text } : r));
    } else {
      const { data } = await supabase.from("reflection_answers").insert({
        session_id: sessionId, question_id: questionId, answer_text: text,
      }).select().single();
      if (data) setReflections([...reflections, data]);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/mp4" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => { setAudioChunks(chunks); stream.getTracks().forEach(t => t.stop()); };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      setError("Tidak dapat mengakses mikrofon. Pastikan izin diberikan.");
    }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  }

  async function uploadRecording(recordId: string, day: number) {
    if (audioChunks.length === 0) return;
    const blob = new Blob(audioChunks, { type: "audio/mp4" });
    const path = `${id}/day-${day}-${Date.now()}.m4a`;

    const { error: uploadError } = await supabase.storage.from("affirmation-recordings").upload(path, blob, { contentType: "audio/mp4" });
    if (uploadError) { setError(uploadError.message); return; }

    await supabase.from("session_records").update({ affirmation_audio_path: path }).eq("id", recordId);
    setRecords(records.map(r => r.id === recordId ? { ...r, affirmation_audio_path: path } : r));
    setAudioChunks([]);
    setSuccess("Rekaman berhasil disimpan!");
    setTimeout(() => setSuccess(""), 3000);
  }

  function getAudioUrl(path: string) {
    return supabase.storage.from("affirmation-recordings").getPublicUrl(path).data.publicUrl;
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  const completedDays = records.map((r) => r.day);
  const moods = ["😢", "😟", "😐", "🙂", "😊"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/patients" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Pasien</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Edit & Simulasi</span>
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
              <input id="current_day" name="current_day" type="number" min={1} max={16} defaultValue={patient.current_day} required className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all" />
            </div>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {error}</div>}
          {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">✅ {success}</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 shadow-md shadow-teal-200 transition-all">
              {loading ? "⏳ Menyimpan..." : "💾 Simpan Data"}
            </button>
            <Link href="/dashboard/patients" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Kembali</Link>
          </div>
        </form>

        {/* Session Checklist & Simulation */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">✅ Simulasi Sesi Harian</h2>
              <p className="text-sm text-gray-500">Klik hari untuk centang, klik lagi untuk expand & isi detail ({completedDays.length}/15)</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => bulkSetSessions(0)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors">Reset Semua</button>
            <button onClick={() => bulkSetSessions(5)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">Set s/d Hari 5</button>
            <button onClick={() => bulkSetSessions(10)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">Set s/d Hari 10</button>
            <button onClick={() => bulkSetSessions(15)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">Set Semua Selesai</button>
          </div>

          <div className="mb-4 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300" style={{ width: `${(completedDays.length / 15) * 100}%` }} />
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => {
              const done = completedDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => {
                    if (!done) { toggleSession(day); setExpandedDay(day); }
                    else { setExpandedDay(expandedDay === day ? null : day); }
                  }}
                  className={`relative rounded-xl p-3 text-center transition-all border-2 ${done ? (expandedDay === day ? "border-teal-600 bg-teal-100 shadow-md" : "border-teal-500 bg-teal-50") : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <span className={`text-lg font-bold ${done ? "text-teal-700" : "text-gray-400"}`}>{day}</span>
                  <p className="text-[10px] mt-0.5 text-gray-500">{done ? "✓ Selesai" : "Belum"}</p>
                  {done && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] text-white">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Expanded Session Detail */}
          {expandedDay && (() => {
            const record = records.find(r => r.day === expandedDay);
            if (!record) return null;
            const dayQuestions = allQuestions.filter(q => q.day === expandedDay);

            return (
              <div className="rounded-xl border-2 border-teal-200 bg-teal-50/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">📝 Detail Hari {expandedDay}</h3>
                  <button onClick={() => toggleSession(expandedDay)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                    🗑️ Hapus Sesi Ini
                  </button>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mood Pasien</label>
                  <div className="flex gap-2">
                    {moods.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => updateSessionDetail(record.id, "mood", i)}
                        className={`rounded-xl border-2 px-3 py-2 text-xl transition-all ${record.mood === i ? "border-teal-500 bg-teal-50 scale-110 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Affirmation Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Afirmasi</label>
                  <textarea
                    rows={2}
                    defaultValue={record.affirmation_note || ""}
                    onBlur={(e) => updateSessionDetail(record.id, "affirmation_note", e.target.value)}
                    placeholder="Tuliskan afirmasi atau catatan pasien..."
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                </div>

                {/* Audio Recording */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎙️ Rekaman Afirmasi</label>
                  <div className="flex flex-wrap items-center gap-3">
                    {!recording ? (
                      <button type="button" onClick={startRecording} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 shadow-md shadow-red-200 transition-all flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-white animate-pulse" /> Mulai Rekam
                      </button>
                    ) : (
                      <button type="button" onClick={stopRecording} className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 shadow-md transition-all flex items-center gap-2">
                        ⏹ Stop Rekam
                      </button>
                    )}
                    {audioChunks.length > 0 && !recording && (
                      <>
                        <audio controls src={URL.createObjectURL(new Blob(audioChunks, { type: "audio/mp4" }))} className="h-10" />
                        <button type="button" onClick={() => uploadRecording(record.id, expandedDay!)} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 shadow-md shadow-teal-200 transition-all">
                          💾 Simpan Rekaman
                        </button>
                      </>
                    )}
                    {record.affirmation_audio_path && (
                      <div className="w-full mt-2">
                        <p className="text-xs text-gray-500 mb-1">Rekaman tersimpan:</p>
                        <audio controls src={getAudioUrl(record.affirmation_audio_path)} className="w-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                  <input
                    type="number"
                    defaultValue={record.duration_minutes || 30}
                    onBlur={(e) => updateSessionDetail(record.id, "duration_minutes", Number(e.target.value))}
                    className="block w-32 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                </div>

                {/* Reflection Answers */}
                {dayQuestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jawaban Refleksi</label>
                    <div className="space-y-3">
                      {dayQuestions.map((q) => {
                        const existing = reflections.find(r => r.session_id === record.id && r.question_id === q.question_id);
                        return (
                          <div key={q.id}>
                            <p className="text-xs font-medium text-gray-600 mb-1">{q.label}</p>
                            <textarea
                              rows={2}
                              defaultValue={existing?.answer_text || ""}
                              onBlur={(e) => saveReflection(record.id, q.question_id, e.target.value)}
                              placeholder={q.placeholder}
                              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Questionnaire */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">📊 Kuesioner SMSES-BC</h2>
          <p className="text-sm text-gray-500 mb-4">Isi pre-test dan post-test untuk pasien ini</p>
          <Link
            href={`/dashboard/questionnaires?patient=${id}`}
            className="inline-flex rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white hover:bg-rose-700 shadow-md shadow-rose-200 transition-all"
          >
            📝 Buka Kuesioner
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
      <input id={name} name={name} type={type} defaultValue={defaultValue} required={required} className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all" />
    </div>
  );
}
