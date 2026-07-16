import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminKelasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  async function handleSignOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Halaman Dashboard Admin</h1>
          <p className="text-muted-foreground text-sm">
            Selamat datang, {profile.full_name || 'Admin'}! Anda masuk sebagai <span className="font-semibold text-accent">Administrator</span>.
          </p>
        </div>
        
        <div className="rounded-md bg-secondary p-4 text-left border border-border/50">
          <h2 className="text-sm font-semibold text-secondary-foreground mb-1">Status Panel Admin:</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Infrastruktur autentikasi dan basis data telah aktif. Halaman administrasi data kelas dan mata pelajaran sedang disiapkan dalam pengembangan.
          </p>
        </div>

        <form action={handleSignOut} className="pt-2">
          <button
            type="submit"
            className="w-full rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 shadow active:scale-[0.98] transition-transform duration-75"
          >
            Keluar dari Akun
          </button>
        </form>
      </div>
    </div>
  )
}
