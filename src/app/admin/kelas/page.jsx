import { createClient } from "@/lib/supabase/server"
import AdminKelasClient from "./admin-kelas-client"

export default async function AdminKelasPage() {
  const supabase = await createClient()


  // Fetch all required data in parallel for optimal database query performance
  const [
    { data: classesList },
    { data: departments },
    { data: academicYears },
    { data: teachers }
  ] = await Promise.all([
    supabase
      .from("classes")
      .select(`
        *,
        departments ( name ),
        academic_years ( name ),
        profiles ( full_name )
      `)
      .order("name", { ascending: true }),
    supabase
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("academic_years")
      .select("id, name, is_active")
      .order("name", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "wali_kelas")
      .order("full_name", { ascending: true })
  ])

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
