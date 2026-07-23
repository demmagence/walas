import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import EditStudentForm from "./edit-student-form"

export const metadata = {
  title: "Edit Siswa - Walas SMK",
  description: "Edit Data Siswa Walas",
}

export default async function EditSiswaPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user.user_metadata?.role !== "wali_kelas") {
    redirect("/dashboard/siswa")
  }

  // Fetch student data by id
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single()

  if (!student) {
    notFound()
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
          Edit Biodata Siswa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perbarui informasi profil dan data diri dari <strong>{student.full_name}</strong>
        </p>
      </div>

      <EditStudentForm student={student} classes={classes} parents={parents} />
    </div>
  )
}
