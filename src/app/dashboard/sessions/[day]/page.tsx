"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ProgramSession, ProgramReflectionQuestion } from "@/types/database";

export default function SessionDetailPage() {
  const { day } = useParams<{ day: string }>();
  const [session, setSession] = useState<ProgramSession | null>(null);
  const [questions, setQuestions] = useState<ProgramReflectionQuestion[]>([]);

  useEffect(() => {
    supabase.from("program_sessions").select("*").eq("day", Number(day)).single().then(({ data }) => setSession(data));
    supabase.from("program_reflection_questions").select("*").eq("day", Number(day)).order("sort_order").then(({ data }) => setQuestions(data || []));
  }, [day]);

  if (!session) {
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
          <a href="/dashboard/sessions" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Sesi Program</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Hari {day}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${session.color_from}, ${session.color_to})` }}>
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">Hari {session.day}</span>
          <h1 className="mt-3 text-2xl font-bold">{session.title}</h1>
          <p className="mt-1 text-sm opacity-80">{session.theme}</p>
        </div>

        {/* Edukasi */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📖 {session.edukasi_title}</h2>
          <div className="space-y-3">
            {session.edukasi_content?.map((p, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">{p}</p>
            ))}
          </div>
          {session.edukasi_key_points && (
            <div className="mt-4 rounded-xl bg-teal-50 border border-teal-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-2">Poin Penting</p>
              <ul className="space-y-1">
                {session.edukasi_key_points.map((p, i) => (
                  <li key={i} className="text-sm text-teal-800 flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">•</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Afirmasi */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">💪 {session.afirmasi_title}</h2>
          <blockquote className="border-l-4 border-teal-400 pl-4 italic text-lg text-gray-800">
            &ldquo;{session.afirmasi_main_text}&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-gray-600">{session.afirmasi_support_text}</p>
        </div>

        {/* Musik */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">🎵 {session.musik_title}</h2>
          <p className="text-sm text-gray-600">{session.musik_description}</p>
          <p className="mt-2 text-xs text-gray-400">Durasi: {Math.floor(session.musik_duration / 60)} menit</p>
        </div>

        {/* Refleksi */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🪞 {session.refleksi_title}</h2>
          {questions.length > 0 && (
            <ol className="space-y-3">
              {questions.map((q, i) => (
                <li key={q.id} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{i + 1}</span>
                  <span className="text-sm text-gray-700">{q.label}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </main>
    </div>
  );
}
