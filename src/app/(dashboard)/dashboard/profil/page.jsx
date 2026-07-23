import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UserCircle } from "lucide-react"

export const metadata = {
  title: "Profil - Walas SMK",
  description: "Halaman profil pengguna",
}

export default async function ProfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url, created_at")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  const roleLabel =
    profile.role === "wali_kelas" ? "Wali Kelas" : "Orang Tua"

  async function handleSignOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Profil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi akun Anda
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {profile.full_name || "Pengguna"}
            </h2>
            <span className="inline-block mt-1 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium text-foreground">
              {user.email}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
            <span className="text-sm text-muted-foreground">Peran</span>
            <span className="text-sm font-medium text-foreground">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Terdaftar Sejak
            </span>
            <span className="text-sm font-medium text-foreground">
              {new Date(profile.created_at).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Sign Out */}
        <form action={handleSignOut} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] transition-all duration-75"
          >
            Keluar dari Akun
          </button>
        </form>
      </div>
    </div>
  )
}
