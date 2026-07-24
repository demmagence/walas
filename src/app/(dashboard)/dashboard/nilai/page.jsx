import { createClient } from '@/lib/supabase/server'
import { getCachedActiveAcademicYear } from '@/lib/data-cache'
import { redirect } from 'next/navigation'
import GradesClient from './grades-client'

export const metadata = {
  title: 'Data Nilai Rapor - Walas SMK',
  description: 'Pengelolaan nilai mata pelajaran dan rapor siswa',
}

export default async function NilaiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const role = user.user_metadata?.role

  // Fetch active academic year
  const activeYear = await getCachedActiveAcademicYear()
  const activeAcademicYearId = activeYear?.id || ''

  let initialSubjects = []
  let classes = []

  if (role === 'wali_kelas') {
    // Fetch classes managed by this homeroom teacher
    const { data: managedClasses } = await supabase
      .from('classes')
      .select('id, name, grade_level')
      .eq('homeroom_teacher', user.id)

    classes = managedClasses || []

    if (classes.length > 0) {
      const classIds = classes.map(c => c.id)
      // Fetch subjects for these classes
      const { data: subjectsList } = await supabase
        .from('subjects')
        .select('id, name, class_id')
        .in('class_id', classIds)
        .order('name', { ascending: true })

      initialSubjects = subjectsList || []
    }
  } else if (role === 'orang_tua') {
    // Fetch children profiles
    const { data: children } = await supabase
      .from('students')
      .select('id, full_name, class_id')
      .eq('parent_user_id', user.id)

    const childIds = children?.map(c => c.id) || []
    const childClassIds = children?.map(c => c.class_id).filter(Boolean) || []

    if (childClassIds.length > 0) {
      // Fetch classes of children
      const { data: childClasses } = await supabase
        .from('classes')
        .select('id, name, grade_level')
        .in('id', childClassIds)

      classes = childClasses || []

      // Fetch subjects of these classes with grades for the children
      const { data: subjectsList } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          class_id
        `)
        .in('class_id', childClassIds)
        .order('name', { ascending: true })

      // Fetch grades for these children separately to merge safely
      const { data: gradesList } = await supabase
        .from('grades')
        .select('id, student_id, subject_id, semester, academic_year_id, score')
        .in('student_id', childIds)

      initialSubjects = (subjectsList || []).map(subject => {
        // filter grades related to this subject
        const subjectGrades = gradesList?.filter(g => g.subject_id === subject.id) || []
        return {
          ...subject,
          grades: subjectGrades
        }
      })
    }
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Nilai Akademik</h1>
          <p className="text-sm text-muted-foreground">
            {role === 'wali_kelas'
              ? 'Kelola daftar mata pelajaran dan input nilai siswa kelas binaan'
              : 'Pantau nilai akademik rapor per semester untuk anak Anda'}
          </p>
        </div>
      </div>

      <GradesClient
        role={role}
        initialSubjects={initialSubjects}
        classes={classes}
        activeAcademicYearId={activeAcademicYearId}
      />
    </div>
  )
}
