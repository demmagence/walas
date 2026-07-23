import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StudentDirectoryClient from "./student-directory-client"

export const metadata = {
  title: "Data Siswa - Walas SMK",
  description: "Daftar siswa dan biodata",
}

export default async function SiswaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = user.user_metadata?.role

  let initialStudents = []
  let classes = []

  if (role === "wali_kelas") {
    // Fetch classes managed by this wali kelas
    const { data: managedClasses } = await supabase
      .from("classes")
      .select("id, name, grade_level")
      .eq("homeroom_teacher", user.id)

    classes = managedClasses || []

    if (classes.length > 0) {
      const classIds = classes.map((c) => c.id)
      // Fetch students in those classes
      const { data: studentsList } = await supabase
        .from("students")
        .select(`
          id,
          full_name,
          nisn,
          nis,
          gender,
          phone,
          class_id,
          classes (
            name
          )
        `)
        .in("class_id", classIds)
        .order("full_name", { ascending: true })

      initialStudents = studentsList || []
    }
  } else if (role === "orang_tua") {
    // Fetch children linked to this parent
    const { data: children } = await supabase
      .from("students")
      .select(`
        id,
        full_name,
        nisn,
        nis,
        gender,
        phone,
        class_id,
        classes (
          name
        )
      `)
      .eq("parent_user_id", user.id)
      .order("full_name", { ascending: true })

    initialStudents = children || []

    // Distinct classes for filter dropdown
    const distinctClassMap = new Map()
    initialStudents.forEach((student) => {
      if (student.class_id && student.classes) {
        distinctClassMap.set(student.class_id, {
          id: student.class_id,
          name: student.classes.name,
        })
      }
    })
    classes = Array.from(distinctClassMap.values())
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Data Siswa
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "wali_kelas"
              ? "Kelola biodata, kehadiran, dan nilai siswa di kelas Anda"
              : "Daftar informasi akademik dan biodata anak Anda"}
          </p>
        </div>
      </div>

      <StudentDirectoryClient
        role={role}
        initialStudents={initialStudents}
        classes={classes}
      />
    </div>
  )
}
