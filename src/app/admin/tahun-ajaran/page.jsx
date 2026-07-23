import { createClient } from "@/lib/supabase/server"
import AdminTahunAjaranClient from "./admin-tahun-ajaran-client"

export const metadata = {
  title: "Manajemen Tahun Ajaran — Walas SMK",
  description: "Kelola data tahun ajaran sekolah",
}

export default async function AdminTahunAjaranPage() {
  const supabase = await createClient()


  // Fetch all academic years
  const { data: academicYears } = await supabase
    .from("academic_years")
    .select("*")
    .order("name", { ascending: false })

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Manajemen Tahun Ajaran
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftarkan tahun ajaran baru dan atur status keaktifan periode pengajaran sekolah
        </p>
      </div>

      <AdminTahunAjaranClient initialAcademicYears={academicYears || []} />
    </div>
  )
}
