import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import AdminNavClient from "./admin-nav-client"
import { Shield, LogOut } from "lucide-react"

export const metadata = {
  title: "Admin Panel — Walas SMK",
  description: "Panel Administrasi Walas SMK",
}

export default async function AdminLayout({ children }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Read role and full name from JWT metadata for optimal performance (eliminates sequential DB query)
  const role = user.user_metadata?.role
  const fullName = user.user_metadata?.full_name

  if (role !== "admin") {
    redirect("/")
  }

  async function handleSignOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Client-side Nav Manager (handles desktop sidebar & mobile responsive nav) */}
      <AdminNavClient />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64">
        <div className="min-h-screen pb-20 md:pb-0 flex flex-col">
          {/* Header Panel */}
          <header className="hidden md:flex items-center justify-between border-b border-border bg-card px-8 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold text-foreground">Mode Administrator</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Halo, <span className="font-semibold text-foreground">{fullName || "Admin"}</span>
              </span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </button>
              </form>
            </div>
          </header>

          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
