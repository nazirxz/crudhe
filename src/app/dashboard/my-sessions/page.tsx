"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SessionRecord, ProgramSession, ProgramReflectionQuestion } from "@/types/database";

export default function MySessionsPage() {
  const [patient, setPatient] = useState<{ id: string; current_day: number } | null>(null);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [activeSession, setActiveSession] = useState<ProgramSession | null>(null);
  const [questions, setQuestions] = useState<ProgramReflectionQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: p } = await supabase.from("patients").select("id, current_day").eq("id", session.user.id).single();
      if (!p) return;
      setPatient(p);

      const { data: recs } = await supabase.from("session_records").select("*").eq("patient_id", p.id).order("day");
      setRecords(recs || []);

      const { data: ps } = await supabase.from("program_sessions").select("*").eq("day", p.current_day).single();
      setActiveSession(ps);

      const { data: qs } = await supabase.from("program_reflection_questions").select("*").eq("day", p.current_day).order("sort_order");
      setQuestions(qs || []);
    }
    load();
  }, []);

  async function handleComplete() {
    if (!patient || !activeSession) return;
    setSaving(true);

    const { data: record } = await supabase.from("session_records").insert({
      patient_id: patient.id,
      day: patient.current_day,
      status: "selesai",
      approval_status: "menunggu",
      mood,
      modules_completed: ["edukasi", "musik", "afirmasi", "refleksi"],
    }).select().single();

    if (record && questions.length > 0) {
      const answerRows = questions.map((q) => ({
        session_record_id: record.id,
        question_id: q.id,
        answer: answers[q.id] || "",
      }));
      await supabase.from("reflection_answers").insert(answerRows);
    }

    await supabase.from("patients").update({ current_day: patient.current_day + 1 }).eq("id", patient.id);
    setPatient({ ...patient, current_day: patient.current_day + 1 });
    setRecords([...records, record!]);
    setSaving(false);
    setMood("");
    setAnswers({});
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  const todayDone = records.some((r) => r.day === patient.current_day);
  const progressPct = Math.min((patient.current_day - 1) / 15 * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Sesi Harian</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Progress Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Progress Sesi</h2>
            <span className="text-sm font-semibold text-teal-700">Hari {Math.min(patient.current_day, 15)} / 15</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>Mulai</span>
            <span>{Math.round(progressPct)}% selesai</span>
            <span>Selesai</span>
          </div>
        </div>

        {patient.current_day > 15 ? (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center text-white shadow-lg">
            <p className="text-4xl mb-2">🎉</p>
            <h2 className="text-xl font-bold">Selamat!</h2>
            <p className="mt-1 opacity-90">Anda telah menyelesaikan semua 15 sesi edukasi.</p>
          </div>
        ) : todayDone ? (
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6 text-center">
            <p className="text-2xl mb-2">⏳</p>
            <p className="font-semibold text-blue-700">Sesi hari ini sudah selesai</p>
            <p className="text-sm text-blue-600 mt-1">Menunggu persetujuan perawat untuk melanjutkan.</p>
          </div>
        ) : activeSession ? (
          <div className="space-y-4">
            {/* Session Header */}
            <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${activeSession.color_from}, ${activeSession.color_to})` }}>
              <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">Hari {activeSession.day}</span>
              <h2 className="mt-2 text-xl font-bold">{activeSession.title}</h2>
              <p className="mt-1 text-sm opacity-80">{activeSession.theme}</p>
            </div>

            {/* Edukasi */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">📖 {activeSession.edukasi_title}</h3>
              <div className="space-y-2 text-sm text-gray-700">
                {activeSession.edukasi_content?.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>

            {/* Afirmasi */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">💪 Afirmasi</h3>
              <blockquote className="border-l-4 border-teal-400 pl-4 italic text-lg text-gray-800">
                &ldquo;{activeSession.afirmasi_main_text}&rdquo;
              </blockquote>
            </div>

            {/* Musik */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">🎵 {activeSession.musik_title}</h3>
              <p className="text-sm text-gray-600">{activeSession.musik_description}</p>
            </div>

            {/* Mood */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">Bagaimana perasaan Anda hari ini?</h3>
              <div className="flex gap-3">
                {["😊", "😐", "😢", "😤", "😴"].map((m) => (
                  <button key={m} onClick={() => setMood(m)} className={`rounded-xl border-2 px-4 py-3 text-2xl transition-all ${mood === m ? "border-teal-500 bg-teal-50 scale-110 shadow-md" : "border-gray-200 hover:border-gray-300"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Refleksi */}
            {questions.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">🪞 Refleksi</h3>
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{q.label}</label>
                      <textarea
                        rows={2}
                        placeholder={q.placeholder}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleComplete}
              disabled={saving || !mood}
              className="w-full rounded-xl bg-teal-600 px-6 py-4 text-lg font-bold text-white hover:bg-teal-700 disabled:opacity-50 shadow-lg shadow-teal-200 transition-all"
            >
              {saving ? "⏳ Menyimpan..." : "✅ Selesaikan Sesi Hari Ini"}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400">Konten sesi belum tersedia untuk hari ini.</p>
          </div>
        )}

        {/* Riwayat */}
        {records.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/50">
              <h2 className="font-bold text-gray-900">📋 Riwayat Sesi</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {records.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm font-medium text-gray-700">Hari {r.day}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.approval_status === "disetujui" ? "bg-green-100 text-green-700" : r.approval_status === "ditolak" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {r.approval_status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
