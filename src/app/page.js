import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to determine role-based redirect
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  // Route by role
  if (profile.role === 'admin') {
    redirect('/admin/kelas')
  }

  // Wali Kelas & Orang Tua → dashboard with bottom nav
  redirect('/dashboard')
}
