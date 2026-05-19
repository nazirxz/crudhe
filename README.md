# SNEfi Care

Sistem Manajemen Edukasi Pasien Kemoterapi — aplikasi web untuk mendampingi pasien kemoterapi melalui 15 sesi edukasi harian dengan fitur relaksasi dan kuesioner self-efficacy (SMSES-BC).

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** (Auth, Database, RLS)
- **Tailwind CSS**

## Fitur

### Perawat
- CRUD Pasien (signup + insert, edit, hapus)
- CRUD Perawat
- Kelola Sesi Program (15 hari, upsert)
- Approval sesi harian pasien
- Lihat hasil kuesioner SMSES-BC

### Pasien
- Sesi harian (edukasi, musik, afirmasi, mood, refleksi)
- Progress tracker (hari 1-15)
- Library suara relaksasi (YouTube, filter kategori)
- Kuesioner SMSES-BC (pre-test & post-test)

## Setup

```bash
# 1. Clone
git clone https://github.com/nazirxz/crudhe.git
cd crudhe

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.local.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 4. Jalankan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur Folder

```
src/
├── app/
│   ├── api/
│   │   ├── patients/[id]/route.ts    # DELETE pasien
│   │   └── nurses/[id]/route.ts      # DELETE perawat (auth)
│   ├── dashboard/
│   │   ├── approvals/                 # Approval sesi
│   │   ├── my-sessions/              # Sesi harian pasien
│   │   ├── nurses/                   # CRUD perawat
│   │   ├── patients/                 # CRUD pasien
│   │   ├── questionnaires/           # Kuesioner SMSES-BC
│   │   ├── relaxation/               # Library relaksasi
│   │   ├── sessions/                 # CRUD sesi program
│   │   └── page.tsx                  # Dashboard utama
│   ├── login/                        # Halaman login
│   └── page.tsx                      # Redirect root
├── lib/
│   ├── supabase.ts                   # Client (anon key)
│   └── supabase-admin.ts            # Server (service role)
└── types/
    └── database.ts                   # TypeScript interfaces
```

## Database

Menggunakan Supabase dengan tabel: `profiles`, `nurses`, `patients`, `session_records`, `reflection_answers`, `questionnaire_submissions`, `program_sessions`, `program_reflection_questions`, `questionnaire_questions`, `relaxation_tracks`.

RLS aktif — pasien hanya akses data sendiri, perawat bisa akses semua pasien.
