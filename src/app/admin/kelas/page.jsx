import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  School, 
  Calendar, 
  ArrowRight, 
  PlusCircle, 
  Settings, 
  LogOut,
  Shield
} from 'lucide-react'

export const metadata = {
  title: "Dashboard Admin — Walas SMK",
  description: "Panel kontrol administrator sekolah",
}

export default async function AdminKelasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // System-wide counts queries
  const { count: totalClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })

  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  const { count: totalTeachers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'wali_kelas')

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('name')
    .eq('is_active', true)
    .maybeSingle()

  async function handleSignOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const shortcuts = [
    { title: 'Kelola Kelas', href: '/admin/kelas', desc: 'Atur kelas, wali kelas, tingkat, dan jurusan.' },
    { title: 'Kelola Jurusan', href: '/admin/jurusan', desc: 'Atur data jurusan/kompetensi keahlian.' },
    { title: 'Tahun Ajaran', href: '/admin/tahun-ajaran', desc: 'Atur periode aktif tahun ajaran.' },
    { title: 'Kelola Pengguna', href: '/admin/pengguna', desc: 'Atur akun wali kelas dan orang tua.' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header Panel */}
      <header className="border-b border-border bg-card px-6 py-4 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Panel Administrator</h1>
              <p className="text-xs text-muted-foreground">Sistem Manajemen Sekolah & Walas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {profile.full_name || 'Admin'}
            </span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Selamat Datang, {profile.full_name || 'Admin'}!</h2>
          <p className="text-sm text-muted-foreground mt-1">Berikut adalah ringkasan data operasional sekolah hari ini.</p>
        </div>

        {/* System metrics */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Kelas</span>
              <School className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{totalClasses ?? 0}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Siswa</span>
              <Users className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{totalStudents ?? 0}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Wali Kelas</span>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{totalTeachers ?? 0}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Tahun Ajaran Aktif</span>
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-2 text-base font-bold text-foreground truncate">
              {activeYear?.name || 'Belum Diatur'}
            </p>
          </div>
        </div>

        {/* Shortcuts / Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Menu Navigasi Administrator</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.title}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:border-accent/40 transition-all"
              >
                <div>
                  <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {shortcut.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {shortcut.desc}
                  </p>
                </div>
                <div className="mt-4 pt-2 flex justify-end">
                  <Link
                    href={shortcut.href}
                    className="flex items-center gap-1 text-xs font-bold text-primary group-hover:text-accent transition-colors"
                  >
                    Buka Panel
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Settings Status */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-bold text-foreground">Konfigurasi Pengembang</h3>
          </div>
          <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>1. Skema basis data terpusat dan kebijakan Row Level Security (RLS) telah diaktifkan di Supabase.</p>
            <p>2. Hubungan relasi data dan pemicu sinkronisasi akun pengguna baru (auth.users ke profiles) berjalan secara otomatis.</p>
            <p>3. Pengembangan selanjutnya akan mencakup form input data kelas, jurusan, tahun ajaran baru, dan pengelolaan izin wali kelas.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
