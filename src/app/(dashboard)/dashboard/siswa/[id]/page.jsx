import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import StudentDetailsClient from "./student-details-client"

export const metadata = {
  title: "Detail Siswa - Walas SMK",
  description: "Detail Biodata Siswa",
}

export default async function StudentDetailPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = { role: user.user_metadata?.role }

  // Fetch student details
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select(`
      *,
      classes (
        name
      )
    `)
    .eq("id", id)
    .single()

  if (studentError || !student) {
    notFound()
  }

  // Fetch parent name, attendances, and grades in PARALLEL
  const [
    parentResult,
    attendancesResult,
    gradesResult
  ] = await Promise.all([
    student.parent_user_id
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", student.parent_user_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("attendances")
      .select("id, date, status, note")
      .eq("student_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("grades")
      .select(`
        id,
        score,
        semester,
        subjects ( name ),
        academic_years ( name )
      `)
      .eq("student_id", id)
      .order("semester", { ascending: true })
  ])

  const parentName = parentResult.data?.full_name || null
  const attendances = attendancesResult.data || []
  const grades = gradesResult.data || []

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
      <StudentDetailsClient
        role={profile.role}
        student={{ ...student, parentName }}
        attendances={attendances || []}
        grades={grades || []}
      />
    </div>
  )
}
