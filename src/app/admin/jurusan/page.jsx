import { createClient } from "@/lib/supabase/server"
import AdminJurusanClient from "./admin-jurusan-client"

export const metadata = {
  title: "Manajemen Jurusan - Walas SMK",
  description: "Kelola data jurusan / kompetensi keahlian",
}

export default async function AdminJurusanPage() {
  const supabase = await createClient()


  // Fetch all departments
  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Manajemen Jurusan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftarkan dan kelola jurusan / kompetensi keahlian di sekolah Anda
        </p>
      </div>

      <AdminJurusanClient initialDepartments={departments || []} />
    </div>
  )
}
