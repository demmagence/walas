import { createClient } from "@/lib/supabase/server"
import { getCachedDepartments, getCachedAcademicYears } from "@/lib/data-cache"
import AdminKelasClient from "./admin-kelas-client"

export default async function AdminKelasPage() {
  const supabase = await createClient()


  // Fetch classes & teachers in parallel while serving departments & academic years from server memory cache
  const [
    { data: classesList },
    { data: teachers },
    departments,
    academicYears
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
      .from("profiles")
      .select("id, full_name")
      .eq("role", "wali_kelas")
      .order("full_name", { ascending: true }),
    getCachedDepartments(),
    getCachedAcademicYears()
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
