import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import SubjectGradesClient from './subject-grades-client'

export const metadata = {
  title: 'Input Nilai Mapel - Walas SMK',
  description: 'Input Nilai Mata Pelajaran Siswa',
}

export default async function SubjectGradesPage({ params, searchParams }) {
  const { subjectId } = await params
  const resolvedSearchParams = await searchParams
  const semester = resolvedSearchParams.semester ? Number(resolvedSearchParams.semester) : 1
  
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user.user_metadata?.role !== 'wali_kelas') {
    redirect('/dashboard/nilai')
  }

  // Fetch subject details
  const { data: subject } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      class_id,
      classes (
        id,
        name,
        homeroom_teacher
      )
    `)
    .eq('id', subjectId)
    .single()

  if (!subject) {
    notFound()
  }

  // Verify class owner
  if (subject.classes?.homeroom_teacher !== user.id) {
    redirect('/dashboard/nilai')
  }

  // Fetch active academic year
  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('id, name')
    .eq('is_active', true)
    .maybeSingle()

  if (!activeYear) {
    return (
      <div className="px-4 py-8 max-w-xl mx-auto text-center rounded-2xl bg-destructive/10">
        <h3 className="text-lg font-bold text-destructive">Tahun Ajaran Aktif Belum Diatur</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Administrator harus menentukan tahun ajaran aktif terlebih dahulu sebelum pengisian nilai dimulai.
        </p>
      </div>
    )
  }

  // Fetch class student list
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, nisn, nis')
    .eq('class_id', subject.class_id)
    .order('full_name', { ascending: true })

  // Fetch existing grades for this subject and semester
  const { data: initialGrades } = await supabase
    .from('grades')
    .select('id, student_id, score')
    .eq('subject_id', subjectId)
    .eq('semester', semester)
    .eq('academic_year_id', activeYear.id)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
      <SubjectGradesClient
        subject={subject}
        students={students || []}
        initialGrades={initialGrades || []}
        semester={semester}
        activeAcademicYearId={activeYear.id}
      />
    </div>
  )
}
