import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AttendanceLoggingClient from "./attendance-logging-client"

export const metadata = {
  title: "Absensi — Walas SMK",
  description: "Pencatatan dan pengelolaan absensi siswa harian",
}

export default async function AbsensiPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = user.user_metadata?.role

  let students = []
  let classes = []

  if (role === "wali_kelas") {
    // Fetch classes managed by this homeroom teacher
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
        .select("id, full_name, nisn, nis, class_id")
        .in("class_id", classIds)
        .order("full_name", { ascending: true })

      students = studentsList || []
    }
  } else if (role === "orang_tua") {
    // Fetch children linked to this parent
    const { data: children } = await supabase
      .from("students")
      .select("id, full_name, nisn, nis, class_id")
      .eq("parent_user_id", user.id)
      .order("full_name", { ascending: true })

    students = children || []

    // Distinct classes
    const distinctClassMap = new Map()
    students.forEach((student) => {
      if (student.class_id) {
        distinctClassMap.set(student.class_id, {
          id: student.class_id,
          name: "Kelas Anak",
        })
      }
    })
    classes = Array.from(distinctClassMap.values())
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Pencatatan Kehadiran
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "wali_kelas"
              ? "Kelola absensi harian siswa di kelas Anda"
              : "Pantau kehadiran harian anak Anda"}
          </p>
        </div>
      </div>

      <AttendanceLoggingClient
        role={role}
        students={students}
        classes={classes}
      />
    </div>
  )
}
