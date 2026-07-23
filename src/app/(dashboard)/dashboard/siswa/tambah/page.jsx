import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AddStudentForm from "./add-student-form"

export const metadata = {
  title: "Tambah Siswa - Walas SMK",
  description: "Tambah Data Siswa Baru",
}

export default async function TambahSiswaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user.user_metadata?.role !== "wali_kelas") {
    redirect("/dashboard/siswa")
  }

  // Fetch classes managed by this homeroom teacher
  const { data: managedClasses } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("homeroom_teacher", user.id)

  const classes = managedClasses || []

  // Fetch parent users (profiles with role='orang_tua')
  const { data: parentProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "orang_tua")
    .order("full_name", { ascending: true })

  const parents = parentProfiles || []

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Registrasi Siswa Baru
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lengkapi formulir di bawah ini untuk menambahkan siswa baru ke kelas Anda
        </p>
      </div>

      <AddStudentForm classes={classes} parents={parents} />
    </div>
  )
}
