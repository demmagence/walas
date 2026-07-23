'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  TrendingUp,
  Award,
  FileText
} from 'lucide-react'
import { exportClassRaporRekapPDF } from '@/lib/export-pdf'

export default function GradesRekapClient({ className, students, subjects, grades, semester, academicYearName }) {
  const router = useRouter()
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true)
      await exportClassRaporRekapPDF({
        className,
        academicYearName,
        semester,
        students,
        subjects,
        matrix: gradesMatrix
      })
    } catch (err) {
      console.error("Gagal mendownload PDF Rekap:", err)
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Build matrix mapping student grades
  const gradesMatrix = students.map((student) => {
    let sum = 0
    let count = 0
    const subjectScores = {}

    subjects.forEach((subject) => {
      const match = grades.find(
        (g) => g.student_id === student.id && g.subject_id === subject.id
      )
      const score = match ? Number(match.score) : null
      subjectScores[subject.id] = score
      
      if (score !== null) {
        sum += score
        count++
      }
    })

    const average = count > 0 ? (sum / count).toFixed(1) : '-'

    return {
      id: student.id,
      full_name: student.full_name,
      nisn: student.nisn || '-',
      nis: student.nis || '-',
      scores: subjectScores,
      average,
      averageNum: count > 0 ? sum / count : null
    }
  })

  // Calculate subject averages
  const subjectAverages = subjects.reduce((acc, subject) => {
    let sum = 0
    let count = 0
    
    students.forEach((student) => {
      const match = grades.find(
        (g) => g.student_id === student.id && g.subject_id === subject.id
      )
      if (match) {
        sum += Number(match.score)
        count++
      }
    })

    acc[subject.id] = count > 0 ? (sum / count).toFixed(1) : '-'
    return acc
  }, {})

  // Calculate class general average
  const validAverages = gradesMatrix.map(m => m.averageNum).filter(val => val !== null)
  const classGeneralAverage = validAverages.length > 0 
    ? (validAverages.reduce((acc, curr) => acc + curr, 0) / validAverages.length).toFixed(1)
    : '-'

  // Excel exporter
  const handleExportExcel = async () => {
    const XLSX = await import('xlsx')
    // 1. Prepare worksheet metadata header
    const metadata = [
      ['LAPORAN REKAPITULASI NILAI AKADEMIK'],
      [`Kelas: ${className}`],
      [`Semester: Semester ${semester}`],
      [`Tahun Ajaran: ${academicYearName}`],
      [] // Spacer row
    ]

    // 2. Prepare table headers
    const tableHeaders = ['No', 'Nama Lengkap', 'NISN', 'NIS', ...subjects.map(s => s.name), 'Rata-rata']

    // 3. Prepare data rows
    const dataRows = gradesMatrix.map((m, idx) => {
      const row = [
        idx + 1,
        m.full_name,
        m.nisn,
        m.nis
      ]
      subjects.forEach(sub => {
        row.push(m.scores[sub.id] !== null ? m.scores[sub.id] : '-')
      })
      row.push(m.average)
      return row
    })

    // 4. Prepare footer rows
    const footerRow = [
      'Rata-rata Kelas',
      '',
      '',
      ''
    ]
    subjects.forEach(sub => {
      footerRow.push(subjectAverages[sub.id])
    })
    footerRow.push(classGeneralAverage)

    // Assemble workbook rows
    const allRows = [...metadata, tableHeaders, ...dataRows, footerRow]

    // Create Sheet
    const worksheet = XLSX.utils.aoa_to_sheet(allRows)

    // Apply header style merge
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // LAPORAN REKAP
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai')

    // Trigger download
    const filename = `rekap_nilai_${className.replace(/\s+/g, '_').toLowerCase()}_sem_${semester}.xlsx`
    XLSX.writeFile(workbook, filename)
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

        {students.length > 0 && subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              variant="outline"
              className="h-10 px-4 rounded-xl gap-2 font-semibold hover:bg-primary/5 text-primary"
            >
              <FileText className="h-4.5 w-4.5" />
              <span>{isExportingPDF ? "Mengunduh PDF..." : "Ekspor Rekap PDF (Rapor)"}</span>
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="h-10 px-4 rounded-xl gap-2 font-semibold hover:bg-primary/5 text-primary"
            >
              <Download className="h-4.5 w-4.5" />
              <span>Ekspor Excel</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Rekap Nilai Rapor Kelas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelas {className} | Semester {semester} | TA {academicYearName}
          </p>
        </div>
      </div>

      {students.length === 0 || subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card/50 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Award className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Data Nilai Belum Lengkap</h4>
          <p className="mt-1 text-xs text-muted-foreground">Pastikan daftar siswa dan mata pelajaran kelas binaan Anda tidak kosong.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Averages Overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div className="rounded-xl bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Rata-rata Nilai Kelas</span>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-foreground">{classGeneralAverage}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Akumulasi seluruh siswa & mapel</p>
            </div>
            <div className="rounded-xl bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Mata Pelajaran Aktif</span>
                <Award className="h-5 w-5 text-accent" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-foreground">{subjects.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Digunakan sebagai parameter KKM (75)</p>
            </div>
          </div>

          {/* Matrix Report Table - Desktop */}
          <div className="hidden md:block overflow-hidden rounded-xl bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-muted text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">NISN</th>
                    {subjects.map((sub) => (
                      <th key={sub.id} className="px-4 py-3 text-center truncate max-w-[120px]" title={sub.name}>
                        {sub.name}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-bold text-foreground bg-muted/60">
                      Rata-rata
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Student Rows */}
                  {gradesMatrix.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/10">
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {m.full_name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                        {m.nisn}
                      </td>
                      {subjects.map((sub) => {
                        const val = m.scores[sub.id]
                        return (
                          <td key={sub.id} className="px-4 py-3.5 text-center font-bold">
                            {val !== null ? (
                              <span className={val >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                                {val}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal">-</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3.5 text-right font-extrabold text-foreground bg-muted/30">
                        {m.average}
                      </td>
                    </tr>
                  ))}

                  {/* Summary/Subject Averages Footer Row */}
                  <tr className="bg-muted/40 font-bold">
                    <td colSpan={2} className="px-4 py-3.5 text-foreground text-xs uppercase tracking-wider">
                      Rata-rata Kelas
                    </td>
                    {subjects.map((sub) => {
                      const val = subjectAverages[sub.id]
                      return (
                        <td key={sub.id} className="px-4 py-3.5 text-center font-extrabold text-primary">
                          {val}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3.5 text-right font-extrabold text-accent bg-muted/60">
                      {classGeneralAverage}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Matrix Report Cards - Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {gradesMatrix.map((m) => (
              <div key={m.id} className="rounded-xl bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">{m.full_name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">NISN: {m.nisn}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] uppercase font-bold text-muted-foreground/60">Rata-rata</span>
                    <span className="text-sm font-extrabold text-primary">{m.average}</span>
                  </div>
                </div>

                {/* Score listing per subject */}
                <div className="pt-2 space-y-1.5 text-xs">
                  {subjects.map((sub) => {
                    const score = m.scores[sub.id]
                    return (
                      <div key={sub.id} className="flex justify-between items-center py-0.5">
                        <span className="text-muted-foreground">{sub.name}</span>
                        <span className={`font-bold ${
                          score === null 
                            ? 'text-muted-foreground/60' 
                            : score >= 75 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-amber-500'
                        }`}>
                          {score !== null ? score : '-'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
