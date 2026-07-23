import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardNav from "@/components/dashboard-nav"

export const metadata = {
  title: "Dashboard - Walas SMK",
  description: "Dashboard Wali Kelas",
}

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Read role from JWT metadata for optimal performance (eliminates sequential DB query)
  const role = user.user_metadata?.role

  if (!role) {
    await supabase.auth.signOut()
    redirect("/login")
  }

  // Admin should not use the dashboard layout
  if (role === "admin") {
    redirect("/admin/kelas")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Navigation (sidebar on desktop, bottom bar on mobile) */}
      <DashboardNav />

      {/* Main content area */}
      <main className="flex-1 md:ml-64">
        <div className="min-h-screen pb-20 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  )
}
