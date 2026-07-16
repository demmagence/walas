import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminKelasClient from "./admin-kelas-client"

export default async function AdminKelasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Double check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  // Fetch all classes
  const { data: classesList } = await supabase
    .from("classes")
    .select(`
      *,
      departments (
        name
      ),
      academic_years (
        name
      ),
      profiles (
        full_name
      )
    `)
    .order("name", { ascending: true })

  // Fetch departments
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true })

  // Fetch academic years
  const { data: academicYears } = await supabase
    .from("academic_years")
    .select("id, name, is_active")
    .order("name", { ascending: false })

  // Fetch homeroom teachers (profiles with role='wali_kelas')
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "wali_kelas")
    .order("full_name", { ascending: true })

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Manajemen Kelas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tambahkan, perbarui, dan atur penugasan wali kelas untuk seluruh kelas di sekolah
        </p>
      </div>

      <AdminKelasClient
        initialClasses={classesList || []}
        departments={departments || []}
        academicYears={academicYears || []}
        teachers={teachers || []}
      />
    </div>
  )
}
