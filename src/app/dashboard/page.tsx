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
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  const nurseMenus = [
    { title: "Pasien", description: "Kelola data pasien kemoterapi", href: "/dashboard/patients", icon: "👥", color: "from-blue-500 to-blue-600" },
    { title: "Perawat", description: "Kelola data tenaga kesehatan", href: "/dashboard/nurses", icon: "🏥", color: "from-purple-500 to-purple-600" },
    { title: "Approval Sesi", description: "Setujui/tolak sesi harian pasien", href: "/dashboard/approvals", icon: "✅", color: "from-emerald-500 to-emerald-600" },
    { title: "Sesi Program", description: "Kelola konten 15 sesi edukasi", href: "/dashboard/sessions", icon: "📚", color: "from-amber-500 to-amber-600" },
    { title: "Kuesioner", description: "Kelola hasil SMSES-BC", href: "/dashboard/questionnaires", icon: "📊", color: "from-rose-500 to-rose-600" },
    { title: "Relaksasi", description: "Library suara relaksasi", href: "/dashboard/relaxation", icon: "🎵", color: "from-cyan-500 to-cyan-600" },
  ];

  const patientMenus = [
    { title: "Sesi Harian", description: "Lanjutkan sesi edukasi harian", href: "/dashboard/my-sessions", icon: "📖", color: "from-teal-500 to-teal-600" },
    { title: "Relaksasi", description: "Dengarkan suara relaksasi", href: "/dashboard/relaxation", icon: "🎵", color: "from-cyan-500 to-cyan-600" },
    { title: "Kuesioner", description: "Isi kuesioner SMSES-BC", href: "/dashboard/questionnaires", icon: "📊", color: "from-rose-500 to-rose-600" },
  ];

  const menus = profile.role === "perawat" ? nurseMenus : patientMenus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">SNEfi Care</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Selamat datang, {profile.name} 👋</h2>
          <p className="mt-1 text-gray-500">Pilih menu untuk memulai</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((m) => (
            <a
              key={m.href}
              href={m.href}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <span className="text-3xl">{m.icon}</span>
              <h3 className="mt-3 text-lg font-bold text-gray-900">{m.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{m.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-teal-600 group-hover:text-teal-700">
                Buka →
              </span>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
