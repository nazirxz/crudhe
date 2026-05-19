"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { QuestionnaireQuestion, QuestionnaireSubmission } from "@/types/database";

interface PatientOption {
  id: string;
  username_display: string;
}

export default function QuestionnairesPage() {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [submissions, setSubmissions] = useState<QuestionnaireSubmission[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get("patient") || "");
  const [selectedPhase, setSelectedPhase] = useState<"pre" | "post">("pre");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!!searchParams.get("patient"));

  useEffect(() => {
    async function load() {
      const { data: pts } = await supabase.from("patients").select("id, username_display").order("username_display");
      setPatients(pts || []);
      const { data: subs } = await supabase.from("questionnaire_submissions").select("*").order("submitted_at", { ascending: false });
      setSubmissions(subs || []);
      const { data: qs } = await supabase.from("questionnaire_questions").select("*").eq("is_active", true).order("item_no");
      setQuestions(qs || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedPatient || editingId) return;
    const existing = submissions.find((s) => s.patient_id === selectedPatient && s.phase === selectedPhase);
    if (existing) {
      setEditingId(existing.id);
      const ans: Record<string, number> = {};
      questions.forEach((q, i) => { if (existing.scores?.[i] != null) ans[q.id] = existing.scores[i]; });
      setAnswers(ans);
    } else {
      setEditingId(null);
      setAnswers({});
    }
  }, [selectedPatient, selectedPhase, submissions, questions]);

  function handleEdit(sub: QuestionnaireSubmission) {
    setSelectedPatient(sub.patient_id);
    setSelectedPhase(sub.phase);
    setEditingId(sub.id);
    const ans: Record<string, number> = {};
    questions.forEach((q, i) => { if (sub.scores?.[i] != null) ans[q.id] = sub.scores[i]; });
    setAnswers(ans);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    setEditingId(null);
    setAnswers({});
    setSelectedPatient("");
    setSelectedPhase("pre");
  }

  async function handleSubmit() {
    if (!selectedPatient) return;
    setSaving(true);
    const scores = questions.map((q) => answers[q.id] || 0);

    if (editingId) {
      const { data } = await supabase.from("questionnaire_submissions")
        .update({ patient_id: selectedPatient, phase: selectedPhase, scores })
        .eq("id", editingId).select().single();
      if (data) setSubmissions(submissions.map((s) => s.id === editingId ? data : s));
    } else {
      const { data } = await supabase.from("questionnaire_submissions").insert({
        patient_id: selectedPatient, phase: selectedPhase, scores, submitted_at: new Date().toISOString(),
      }).select().single();
      if (data) setSubmissions([data, ...submissions]);
    }
    handleReset();
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus submission ini?")) return;
    await supabase.from("questionnaire_submissions").delete().eq("id", id);
    setSubmissions(submissions.filter((s) => s.id !== id));
  }

  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.username_display || "-";
  const answeredCount = Object.keys(answers).length;
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const maxScore = questions.length * 5;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">Kuesioner SMSES-BC</span>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) handleReset(); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${showForm ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-200"}`}
          >
            {showForm ? "✕ Tutup Form" : "+ Tambah / Edit Kuesioner"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Submissions</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{submissions.length}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pre-Test</p>
            <p className="mt-1 text-3xl font-bold text-blue-600">{submissions.filter(s => s.phase === "pre").length}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Post-Test</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">{submissions.filter(s => s.phase === "post").length}</p>
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100 animate-in slide-in-from-top">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "✏️ Edit Kuesioner" : "📝 Tambah Kuesioner Baru"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingId ? "Data yang sudah ada akan diperbarui" : "Pilih pasien dan fase, lalu isi skor"}
                </p>
              </div>
              {selectedPatient && questions.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Skor sementara</p>
                  <p className="text-2xl font-bold text-teal-700">{totalScore}<span className="text-sm text-gray-400">/{maxScore}</span></p>
                </div>
              )}
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pasien</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => { setEditingId(null); setSelectedPatient(e.target.value); }}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
                >
                  <option value="">-- Pilih Pasien --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.username_display}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingId(null); setSelectedPhase("pre"); }}
                    className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${selectedPhase === "pre" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Pre-Test
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setSelectedPhase("post"); }}
                    className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${selectedPhase === "post" ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Post-Test
                  </button>
                </div>
              </div>
            </div>

            {selectedPatient && questions.length > 0 && (
              <>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{answeredCount}/{questions.length} terjawab</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {editingId && (
                  <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
                    ⚡ Mode edit — data sebelumnya sudah terisi otomatis
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {questions.map((q) => (
                    <div key={q.id} className={`rounded-xl border p-4 transition-all ${answers[q.id] != null ? "border-teal-200 bg-teal-50/50" : "border-gray-100 bg-gray-50/50 hover:border-gray-200"}`}>
                      <p className="text-sm font-medium text-gray-800 mb-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 mr-1">{q.item_no}</span>
                        {q.prompt}
                      </p>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            onClick={() => setAnswers({ ...answers, [q.id]: v })}
                            className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all ${answers[q.id] === v ? "bg-teal-600 text-white scale-110 shadow-md shadow-teal-200" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-700"}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3 pt-4 border-t">
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !selectedPatient}
                    className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 shadow-md shadow-teal-200 transition-all hover:shadow-lg"
                  >
                    {saving ? "⏳ Menyimpan..." : editingId ? "💾 Update" : "💾 Simpan"}
                  </button>
                  {editingId && (
                    <button onClick={handleReset} className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                      Batal Edit
                    </button>
                  )}
                  <span className="ml-auto text-sm text-gray-400">
                    Total: <strong className="text-teal-700">{totalScore}</strong> / {maxScore}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Submissions Table */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">📊 Hasil Kuesioner</h2>
            <p className="text-sm text-gray-500">Daftar semua submission pre-test dan post-test</p>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg">Belum ada data kuesioner</p>
              <p className="text-sm text-gray-400 mt-1">Klik tombol "Tambah" untuk memulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Pasien</th>
                    <th className="px-6 py-3">Fase</th>
                    <th className="px-6 py-3">Skor Total</th>
                    <th className="px-6 py-3">Rata-rata</th>
                    <th className="px-6 py-3">Tanggal</th>
                    <th className="px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((s) => {
                    const total = s.scores?.reduce((a, b) => a + b, 0) || 0;
                    const avg = s.scores?.length ? (total / s.scores.length).toFixed(1) : "0";
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{getPatientName(s.patient_id)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.phase === "pre" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {s.phase}-test
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{total}</span>
                          <span className="text-gray-400">/{maxScore}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{avg}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(s)} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors">
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
