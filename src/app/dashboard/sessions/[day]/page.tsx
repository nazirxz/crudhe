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
    supabase.from("program_reflection_questions").select("*").eq("day", Number(day)).order("order").then(({ data }) => setQuestions(data || []));
  }, [day]);

  if (!session) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Memuat...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <a href="/dashboard/sessions" className="text-sm text-gray-600 hover:underline">Sesi Program</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Hari {day}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <span className="inline-block rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">Hari {session.day}</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{session.title}</h1>
        </div>

        <Section title="Konten Edukasi">{session.education_content}</Section>
        <Section title="Afirmasi">{session.affirmation}</Section>

        {session.music_url && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold text-gray-900">Musik</h2>
            <a href={session.music_url} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">{session.music_url}</a>
          </div>
        )}

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-gray-900">Refleksi</h2>
          <p className="mb-3 text-sm text-gray-600">{session.reflection_intro}</p>
          {questions.length > 0 && (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
              {questions.map((q) => <li key={q.id}>{q.question}</li>)}
            </ol>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-2 font-semibold text-gray-900">{title}</h2>
      <p className="whitespace-pre-wrap text-sm text-gray-700">{children}</p>
    </div>
  );
}
