import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import GradesRekapClient from './grades-rekap-client'

export const metadata = {
  title: 'Rekap Nilai Rapor — Walas SMK',
  description: 'Rekapitulasi nilai mata pelajaran satu kelas binaan',
}

export default async function GradesRekapPage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const semester = resolvedSearchParams.semester ? Number(resolvedSearchParams.semester) : 1
  const classId = resolvedSearchParams.classId
  
  if (!classId) {
    redirect('/dashboard/nilai')
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user.user_metadata?.role !== 'wali_kelas') {
    redirect('/dashboard/nilai')
  }

  // Fetch class details and verify ownership
  const { data: targetClass } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      academic_year_id,
      academic_years (
        name
      )
    `)
    .eq('id', classId)
    .eq('homeroom_teacher', user.id)
    .maybeSingle()

  if (!targetClass) {
    redirect('/dashboard/nilai')
  }

  // Fetch all students in the class
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, nisn, nis')
    .eq('class_id', classId)
    .order('full_name', { ascending: true })

  // Fetch all subjects for the class
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('class_id', classId)
    .order('name', { ascending: true })

  // Fetch grades for these students in this semester and academic year
  let grades = []
  if (students && students.length > 0) {
    const studentIds = students.map(s => s.id)
    const { data: gradesList } = await supabase
      .from('grades')
      .select('student_id, subject_id, score')
      .eq('semester', semester)
      .eq('academic_year_id', targetClass.academic_year_id)
      .in('student_id', studentIds)
      
    grades = gradesList || []
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
      <GradesRekapClient
        className={targetClass.name}
        students={students || []}
        subjects={subjects || []}
        grades={grades}
        semester={semester}
        academicYearName={targetClass.academic_years?.name || 'Belum Diatur'}
      />
    </div>
  )
}
