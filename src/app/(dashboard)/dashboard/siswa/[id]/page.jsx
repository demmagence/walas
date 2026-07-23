import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import StudentDetailsClient from "./student-details-client"

export const metadata = {
  title: "Detail Siswa — Walas SMK",
  description: "Informasi lengkap data siswa",
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

  // Fetch parent name if parent_user_id is available
  let parentName = null
  if (student.parent_user_id) {
    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", student.parent_user_id)
      .single()
    
    if (parentProfile) {
      parentName = parentProfile.full_name
    }
  }

  // Fetch attendances
  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .eq("student_id", id)
    .order("date", { ascending: false })

  // Fetch grades
  const { data: grades } = await supabase
    .from("grades")
    .select(`
      *,
      subjects (
        name
      ),
      academic_years (
        name
      )
    `)
    .eq("student_id", id)
    .order("semester", { ascending: true })

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
