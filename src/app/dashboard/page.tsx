"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(data);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">SNEfi Care</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile.name}{" "}
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                {profile.role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        {profile.role === "perawat" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard title="Pasien" description="Kelola data pasien" href="/dashboard/patients" />
            <DashboardCard title="Perawat" description="Kelola data perawat" href="/dashboard/nurses" />
            <DashboardCard title="Approval Sesi" description="Setujui/tolak sesi pasien" href="/dashboard/approvals" />
            <DashboardCard title="Sesi Program" description="Kelola konten 15 sesi" href="/dashboard/sessions" />
            <DashboardCard title="Kuesioner" description="Lihat hasil SMSES-BC" href="/dashboard/questionnaires" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard title="Sesi Harian" description="Lanjutkan sesi edukasi" href="/dashboard/my-sessions" />
            <DashboardCard title="Relaksasi" description="Dengarkan suara relaksasi" href="/dashboard/relaxation" />
            <DashboardCard title="Kuesioner" description="Isi kuesioner SMSES-BC" href="/dashboard/questionnaires" />
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="block rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </a>
  );
}
