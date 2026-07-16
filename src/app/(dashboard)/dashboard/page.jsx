import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Beranda — Walas SMK",
  description: "Halaman beranda dashboard Walas",
}

export default async function BerandaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  const roleLabel =
    profile.role === "wali_kelas" ? "Wali Kelas" : "Orang Tua"

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Selamat Datang, {profile.full_name || "Pengguna"}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anda masuk sebagai{" "}
          <span className="font-semibold text-primary">{roleLabel}</span>
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total Siswa
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">—</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Hadir Hari Ini</p>
          <p className="mt-1 text-2xl font-bold text-primary">—</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Rata-rata Nilai
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">—</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Kelas</p>
          <p className="mt-1 text-2xl font-bold text-accent">—</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="mt-6 rounded-xl border border-border/50 bg-secondary p-5">
        <h2 className="text-sm font-semibold text-secondary-foreground mb-2">
          Status Sistem
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Infrastruktur autentikasi dan basis data telah aktif. Modul
          fungsionalitas absensi dan nilai kelas sedang disiapkan dalam
          pengembangan.
        </p>
      </div>
    </div>
  )
}
