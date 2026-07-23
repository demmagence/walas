'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Save, 
  Check, 
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { saveGradesAction } from '@/lib/actions/grade-actions'

export default function SubjectGradesClient({ subject, students, initialGrades, semester, activeAcademicYearId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Map initial grades to form state
  const [scores, setScores] = useState(() => {
    const map = {}
    students.forEach(student => {
      const existingGrade = initialGrades.find(g => g.student_id === student.id)
      map[student.id] = {
        id: existingGrade?.id || null,
        score: existingGrade ? String(existingGrade.score) : ''
      }
    })
    return map
  })

  // Handle score input change with boundary checks
  const handleScoreChange = (studentId, value) => {
    // allow empty string or numeric value between 0-100
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
      return
    }
    
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: value
      }
    }))
  }

  // Handle saving grades
  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Build payload array
    const gradesPayload = []
    let hasValidationError = false

    for (const student of students) {
      const state = scores[student.id]
      const scoreStr = state?.score?.trim()
      
      if (!scoreStr) {
        setMessage({ type: 'error', text: `Nilai untuk ${student.full_name} belum diisi.` })
        hasValidationError = true
        break
      }
      
      const scoreNum = Number(scoreStr)
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        setMessage({ type: 'error', text: `Nilai untuk ${student.full_name} harus antara 0 dan 100.` })
        hasValidationError = true
        break
      }

      gradesPayload.push({
        id: state.id,
        student_id: student.id,
        score: scoreNum
      })
    }

    if (hasValidationError) {
      setLoading(false)
      return
    }

    try {
      const res = await saveGradesAction(gradesPayload, subject.id, semester, activeAcademicYearId)
      if (res.success) {
        setMessage({ type: 'success', text: 'Semua nilai berhasil disimpan!' })
        setTimeout(() => {
          router.push('/dashboard/nilai')
          router.refresh()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: res.error || 'Gagal menyimpan nilai.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action and title */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-xl h-10 px-3.5 gap-2 font-semibold"
          onClick={() => router.push('/dashboard/nilai')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Input Nilai: {subject.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Semester {semester} | Kelas {subject.classes?.name}
          </p>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2.5 rounded-xl p-4 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          {message.type === 'success' ? <Check className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Tidak Ada Siswa</h4>
          <p className="mt-1 text-xs text-muted-foreground">Belum ada siswa terdaftar pada kelas mata pelajaran ini.</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">NISN / NIS</th>
                  <th className="px-6 py-3.5 w-48 text-right">Nilai Akhir (0-100)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const state = scores[student.id] || { score: '' }
                  return (
                    <tr key={student.id} className="hover:bg-muted/10">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {student.full_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                        {student.nisn || '-'} / {student.nis || '-'}
                      </td>
                      <td className="px-6 py-4 flex justify-end">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={state.score}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          className="w-24 text-center h-9 font-bold rounded-lg"
                          placeholder="0-100"
                          disabled={loading}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {students.map((student) => {
              const state = scores[student.id] || { score: '' }
              return (
                <div key={student.id} className="rounded-xl bg-card p-4 space-y-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">{student.full_name}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      NISN: {student.nisn || '-'}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={state.score}
                    onChange={(e) => handleScoreChange(student.id, e.target.value)}
                    className="w-20 text-center h-9 font-bold rounded-lg"
                    placeholder="0-100"
                    disabled={loading}
                  />
                </div>
              )
            })}
          </div>

          {/* Save Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-10 px-4 font-semibold"
              onClick={() => router.push('/dashboard/nilai')}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl h-10 px-5 gap-2 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Nilai
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
