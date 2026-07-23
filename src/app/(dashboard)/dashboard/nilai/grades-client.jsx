'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  BookOpen, 
  ArrowRight, 
  AlertCircle,
  FileText,
  Calendar,
  Settings
} from 'lucide-react'
import { addSubjectAction } from '@/lib/actions/grade-actions'

export default function GradesClient({ role, initialSubjects, classes, activeAcademicYearId }) {
  const [subjects, setSubjects] = useState(initialSubjects)
  const [semester, setSemester] = useState('1')
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
  
  // Modal state for adding subject
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isWaliKelas = role === 'wali_kelas'
  const selectedClass = classes.find(c => c.id === selectedClassId)

  // Handle adding new subject
  const handleAddSubject = async (e) => {
    e.preventDefault()
    if (!newSubjectName.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await addSubjectAction(newSubjectName, selectedClassId)
      if (res.success) {
        setSubjects((prev) => [...prev, { ...res.data, gradeVal: null }])
        setNewSubjectName('')
        setIsModalOpen(false)
      } else {
        setError(res.error || 'Gagal menambahkan mata pelajaran.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  // Filter subjects based on selected class (for Wali Kelas) or child class
  const filteredSubjects = subjects.filter(sub => {
    return isWaliKelas ? sub.class_id === selectedClassId : true
  })

  return (
    <div className="space-y-6">
      {/* Filters and Config Card */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between bg-card rounded-2xl p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 flex-1 max-w-2xl">
          {/* Semester Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="semester-select" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Semester
            </Label>
            <select
              id="semester-select"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none appearance-none dark:bg-card"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>

          {/* Class Selector (Wali Kelas only) */}
          {isWaliKelas && (
            <div className="space-y-1.5">
              <Label htmlFor="class-select" className="text-xs font-semibold text-muted-foreground">Kelas Binaan</Label>
              <div className="relative">
                <select
                  id="class-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.name || `${cls.grade_level}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Rekapitulasi Rapor Shortcut Link */}
        {isWaliKelas && selectedClassId && (
          <Link href={`/dashboard/nilai/rekap?semester=${semester}&classId=${selectedClassId}`}>
            <Button variant="outline" className="w-full md:w-auto h-10 px-4 rounded-xl gap-2 font-semibold hover:bg-primary/5 text-primary">
              <FileText className="h-4.5 w-4.5" />
              <span>Lihat Rekap Kelas</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Subjects Section Title & Add Subject Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">
          Daftar Mata Pelajaran ({filteredSubjects.length})
        </h3>
        {isWaliKelas && selectedClassId && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-xl gap-2 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Mapel</span>
          </Button>
        )}
      </div>

      {/* Grid of Subjects */}
      {filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Mata Pelajaran Kosong</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {isWaliKelas 
              ? 'Anda belum menambahkan mata pelajaran di kelas ini.' 
              : 'Belum ada data mata pelajaran terdaftar untuk kelas anak Anda.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => {
            // Find grade value for parent view
            const studentGrade = subject.grades?.find(g => String(g.semester) === semester && g.academic_year_id === activeAcademicYearId)
            const score = studentGrade ? Number(studentGrade.score) : null
            const isPassing = score !== null && score >= 75

            return (
              <div
                key={subject.id}
                className="group flex flex-col justify-between rounded-xl bg-card p-5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {subject.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                      {isWaliKelas ? `Mata Pelajaran Kelas` : `Akademik Anak`}
                    </p>
                  </div>
                </div>

                {isWaliKelas ? (
                  /* Teacher Action to Input Grades */
                  <div className="mt-6 pt-3 flex justify-end">
                    <Link
                      href={`/dashboard/nilai/${subject.id}?semester=${semester}`}
                      className="flex items-center gap-1 text-xs font-bold text-primary group-hover:text-accent transition-colors"
                    >
                      Input / Edit Nilai
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  /* Parent Read-only Grade display */
                  <div className="mt-6 pt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Nilai Akhir:</span>
                    <span className={`text-base font-extrabold ${
                      score === null 
                        ? 'text-muted-foreground' 
                        : isPassing 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-amber-500'
                    }`}>
                      {score !== null ? score : '-'}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Subject Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <form 
            onSubmit={handleAddSubject} 
            className="w-full max-w-sm rounded-2xl bg-card p-6 animate-in fade-in zoom-in duration-200 space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-2">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Tambah Mata Pelajaran</h3>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="subject_name">Nama Mata Pelajaran *</Label>
              <Input
                id="subject_name"
                type="text"
                required
                placeholder="Contoh: Matematika, Bahasa Indonesia..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="h-10 rounded-xl"
                disabled={loading}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg h-9 px-4"
                onClick={() => {
                  setIsModalOpen(false)
                  setNewSubjectName('')
                  setError(null)
                }}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || !newSubjectName.trim()}
                className="rounded-lg h-9 px-4 bg-primary hover:bg-primary/95 text-primary-foreground"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
