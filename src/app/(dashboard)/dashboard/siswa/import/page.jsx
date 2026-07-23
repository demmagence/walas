import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ImportClient from './import-client'

export const metadata = {
  title: 'Impor Masuk Siswa - Walas SMK',
  description: 'Impor data siswa secara massal menggunakan file Excel',
}

export default async function ImportSiswaPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'wali_kelas') {
    redirect('/dashboard/siswa')
  }

  // Fetch classes managed by this homeroom teacher
  const { data: managedClasses } = await supabase
    .from('classes')
    .select('id, name, grade_level')
    .eq('homeroom_teacher', user.id)
    .order('created_at', { ascending: false })

  const classes = managedClasses || []

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto">
      <ImportClient classes={classes} />
    </div>
  )
}
