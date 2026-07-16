'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Server action to add a new subject for a class.
 * @param {string} name 
 * @param {string} classId 
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function addSubjectAction(name, classId) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' }
    }

    // 2. Validate role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'wali_kelas') {
      return { success: false, error: 'Akses ditolak. Hanya Wali Kelas yang dapat mengelola mata pelajaran.' }
    }

    // 3. Verify class ownership
    const { data: targetClass } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('homeroom_teacher', user.id)
      .maybeSingle()

    if (!targetClass) {
      return { success: false, error: 'Akses ditolak. Anda bukan wali kelas untuk kelas ini.' }
    }

    if (!name || !name.trim()) {
      return { success: false, error: 'Nama mata pelajaran wajib diisi.' }
    }

    // 4. Check for duplicate subject in this class
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', name.trim())
      .eq('class_id', classId)
      .maybeSingle()

    if (existingSubject) {
      return { success: false, error: `Mata pelajaran "${name.trim()}" sudah terdaftar di kelas ini.` }
    }

    // 5. Insert subject
    const { data, error: insertError } = await supabase
      .from('subjects')
      .insert({
        name: name.trim(),
        class_id: classId
      })
      .select()
      .single()

    if (insertError) throw insertError

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message || 'Gagal menambahkan mata pelajaran.' }
  }
}

/**
 * Server action to bulk upsert student scores for a subject and semester.
 * @param {Array} grades 
 * @param {string} subjectId 
 * @param {number} semester 
 * @param {string} academicYearId 
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveGradesAction(grades, subjectId, semester, academicYearId) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' }
    }

    // 2. Validate role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'wali_kelas') {
      return { success: false, error: 'Akses ditolak. Hanya Wali Kelas yang dapat menginput nilai.' }
    }

    // 3. Verify subject and class ownership
    const { data: subject } = await supabase
      .from('subjects')
      .select('class_id')
      .eq('id', subjectId)
      .single()

    if (!subject) {
      return { success: false, error: 'Mata pelajaran tidak ditemukan.' }
    }

    const { data: targetClass } = await supabase
      .from('classes')
      .select('id')
      .eq('id', subject.class_id)
      .eq('homeroom_teacher', user.id)
      .maybeSingle()

    if (!targetClass) {
      return { success: false, error: 'Akses ditolak. Anda bukan wali kelas untuk kelas pengampu mata pelajaran ini.' }
    }

    if (!grades || grades.length === 0) {
      return { success: false, error: 'Tidak ada data nilai untuk disimpan.' }
    }

    // 4. Validate scores (must be between 0 and 100)
    for (const record of grades) {
      const score = Number(record.score)
      if (isNaN(score) || score < 0 || score > 100) {
        return { success: false, error: 'Nilai harus berupa angka di antara 0 dan 100.' }
      }
    }

    // 5. Build upsert payloads
    const payloads = grades.map(g => ({
      id: g.id || undefined, // undefined will let Supabase insert a new row if it doesn't exist
      student_id: g.student_id,
      subject_id: subjectId,
      semester: Number(semester),
      academic_year_id: academicYearId,
      score: Number(g.score)
    }))

    // 6. Perform bulk upsert
    const { error: upsertError } = await supabase
      .from('grades')
      .upsert(payloads, { onConflict: 'student_id,subject_id,semester,academic_year_id' })

    if (upsertError) throw upsertError

    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || 'Gagal menyimpan nilai.' }
  }
}
