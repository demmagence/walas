'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signIn, getProfile } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await signIn(email, password)

      if (signInError) {
        throw signInError
      }

      if (data?.user) {
        // Successfully authenticated, refresh to update proxy state and redirect
        router.refresh()
        router.push('/')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat masuk.')
      setLoading(false)
    }
  }

  return (
    <Card className="border-border shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border bg-background shadow-sm">
            <Image
              src="/images/walas.png"
              alt="Logo Walas"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Walas SMK
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Aplikasi Manajemen Wali Kelas, Absensi, dan Nilai Siswa
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@sekolah.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground font-semibold">
                Kata Sandi
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-md active:scale-[0.98] transition-transform duration-75"
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Masuk'}
          </Button>
          <div className="text-center text-xs text-muted-foreground">
            Hubungi Admin sekolah jika Anda belum memiliki akun atau lupa kata sandi.
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
