"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { QuestionnaireQuestion, QuestionnaireSubmission } from "@/types/database";

export default function QuestionnairesPage() {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [submissions, setSubmissions] = useState<QuestionnaireSubmission[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [patient, setPatient] = useState<{ id: string; current_day: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      setRole(profile?.role || "");

      if (profile?.role === "pasien") {
        const { data: p } = await supabase.from("patients").select("id, current_day").eq("profile_id", session.user.id).single();
        setPatient(p);
        if (p) {
          const { data: subs } = await supabase.from("questionnaire_submissions").select("*").eq("patient_id", p.id);
          setSubmissions(subs || []);
        }
      } else {
        // Perawat: lihat semua submissions
        const { data: subs } = await supabase.from("questionnaire_submissions").select("*").order("submitted_at", { ascending: false });
        setSubmissions(subs || []);
      }

      const { data: qs } = await supabase.from("questionnaire_questions").select("*").order("number");
      setQuestions(qs || []);
    }
    load();
  }, []);

  const preSubmitted = submissions.some((s) => s.phase === "pre");
  const postSubmitted = submissions.some((s) => s.phase === "post");
  const canSubmitPre = role === "pasien" && !preSubmitted;
  const canSubmitPost = role === "pasien" && patient && patient.current_day > 15 && !postSubmitted;

  async function handleSubmit(phase: "pre" | "post") {
    if (!patient) return;
    setSaving(true);

    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);

    const { data } = await supabase.from("questionnaire_submissions").insert({
      patient_id: patient.id,
      phase,
      answers,
      total_score: totalScore,
      submitted_at: new Date().toISOString(),
    }).select().single();

    if (data) setSubmissions([...submissions, data]);
    setAnswers({});
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Kuesioner SMSES-BC</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Kuesioner SMSES-BC</h1>

        {/* Hasil submissions */}
        {submissions.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Hasil</h2>
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
                <span className="text-sm font-medium capitalize text-gray-700">{s.phase}-test</span>
                <span className="font-semibold text-teal-700">Skor: {s.total_score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Form kuesioner */}
        {(canSubmitPre || canSubmitPost) && questions.length > 0 && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">
              {canSubmitPre ? "Pre-Test" : "Post-Test"}
            </h2>
            <p className="mb-4 text-sm text-gray-500">Pilih skala 1-5 untuk setiap pernyataan (1 = Sangat Tidak Setuju, 5 = Sangat Setuju)</p>

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-gray-700">{q.number}. {q.question}</p>
                  <div className="mt-1 flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAnswers({ ...answers, [q.id]: v })}
                        className={`h-8 w-8 rounded-full text-sm font-medium ${answers[q.id] === v ? "bg-teal-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubmit(canSubmitPre ? "pre" : "post")}
              disabled={saving || Object.keys(answers).length < questions.length}
              className="mt-6 w-full rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Kirim"}
            </button>
          </div>
        )}

        {role === "pasien" && !canSubmitPre && !canSubmitPost && submissions.length > 0 && (
          <p className="rounded-xl border bg-blue-50 p-4 text-center text-sm text-blue-700">
            {postSubmitted ? "Anda sudah menyelesaikan pre-test dan post-test." : "Post-test akan tersedia setelah menyelesaikan 15 sesi."}
          </p>
        )}
      </main>
    </div>
  );
}
