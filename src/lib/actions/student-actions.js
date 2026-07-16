'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Server action to bulk import student records into a class.
 * Validates teacher permissions and prevents NISN/NIS duplicates.
 * 
 * @param {Array} students 
 * @param {string} classId 
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function importStudentsAction(students, classId) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' }
    }

    // 2. Validate user profile & role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'wali_kelas') {
      return { success: false, error: 'Akses ditolak. Hanya Wali Kelas yang dapat mengimpor data siswa.' }
    }

    // 3. Verify class ownership (ensure teacher manages target class)
    const { data: targetClass, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', classId)
      .eq('homeroom_teacher', user.id)
      .maybeSingle()

    if (classError || !targetClass) {
      return { success: false, error: 'Akses ditolak. Anda tidak ditugaskan sebagai wali kelas untuk kelas ini.' }
    }

    if (!students || students.length === 0) {
      return { success: false, error: 'Tidak ada data siswa untuk diimpor.' }
    }

    // 4. Validate NISN/NIS uniqueness globally before insert
    const nisns = students.map(s => s.nisn).filter(Boolean)
    const nises = students.map(s => s.nis).filter(Boolean)

    if (nisns.length > 0) {
      const { data: existingNisns } = await supabase
        .from('students')
        .select('nisn, full_name')
        .in('nisn', nisns)

      if (existingNisns && existingNisns.length > 0) {
        const duplicates = existingNisns.map(s => `${s.nisn} (${s.full_name})`).join(', ')
        return { 
          success: false, 
          error: `NISN berikut sudah terdaftar pada siswa lain di sistem: ${duplicates}. Harap periksa kembali.` 
        }
      }
    }

    if (nises.length > 0) {
      const { data: existingNises } = await supabase
        .from('students')
        .select('nis, full_name')
        .in('nis', nises)

      if (existingNises && existingNises.length > 0) {
        const duplicates = existingNises.map(s => `${s.nis} (${s.full_name})`).join(', ')
        return { 
          success: false, 
          error: `NIS berikut sudah terdaftar pada siswa lain di sistem: ${duplicates}. Harap periksa kembali.` 
        }
      }
    }

    // 5. Build payloads
    const payloads = students.map(s => ({
      full_name: s.full_name.trim(),
      nisn: s.nisn ? s.nisn.trim() : null,
      nis: s.nis ? s.nis.trim() : null,
      gender: s.gender,
      birth_place: s.birth_place ? s.birth_place.trim() : null,
      birth_date: s.birth_date || null,
      religion: s.religion ? s.religion.trim() : null,
      phone: s.phone ? s.phone.trim() : null,
      address: s.address ? s.address.trim() : null,
      class_id: classId,
      parent_user_id: null // Linked manually by homeroom teacher later
    }))

    // 6. Perform bulk insert
    const { error: insertError } = await supabase
      .from('students')
      .insert(payloads)

    if (insertError) {
      throw insertError
    }

    return { success: true, count: payloads.length }
  } catch (err) {
    return { success: false, error: err.message || 'Terjadi kesalahan internal saat menyimpan data.' }
  }
}
