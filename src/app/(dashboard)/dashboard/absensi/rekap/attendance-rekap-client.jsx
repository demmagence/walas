"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Search, 
  Clock, 
  TrendingUp,
  AlertCircle,
  FileText
} from "lucide-react"
import { exportAttendanceRekapPDF } from "@/lib/export-pdf"

export default function AttendanceRekapClient({ role, students, classes }) {
  const router = useRouter()
  const supabase = createClient()

  // Default date ranges
  const getDates = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const format = (d) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }
    return {
      start: format(firstDay),
      end: format(today),
    }
  }

  const defaultDates = getDates()
  const [startDate, setStartDate] = useState(defaultDates.start)
  const [endDate, setEndDate] = useState(defaultDates.end)
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || "all")
  const [searchQuery, setSearchQuery] = useState("")
  const [aggregates, setAggregates] = useState({})
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(null)

  // Filter students based on selected class and search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = selectedClass === "all" || s.class_id === selectedClass
      const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn?.includes(searchQuery) ||
        s.nis?.includes(searchQuery)
      return matchesClass && matchesSearch
    })
  }, [students, selectedClass, searchQuery])

  // Fetch and aggregate attendance logs
  useEffect(() => {
    async function fetchAndAggregate() {
      setFetching(true)
      setError(null)
      try {
        const studentIds = filteredStudents.map((s) => s.id)
        if (studentIds.length === 0) {
          setAggregates({})
          setFetching(false)
          return
        }

        // Fetch logs in date range for filtered students
        const { data, error: fetchError } = await supabase
          .from("attendances")
          .select("student_id, status")
          .in("student_id", studentIds)
          .gte("date", startDate)
          .lte("date", endDate)

        if (fetchError) throw fetchError

        // Initialize empty aggregates
        const newAggs = {}
        filteredStudents.forEach((s) => {
          newAggs[s.id] = { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 }
        })

        // Accumulate statuses
        data?.forEach((log) => {
          if (newAggs[log.student_id]) {
            newAggs[log.student_id][log.status]++
            newAggs[log.student_id].total++
          }
        })

        setAggregates(newAggs)
      } catch (err) {
        setError("Gagal merangkum laporan absensi: " + err.message)
      } finally {
        setFetching(false)
      }
    }

    fetchAndAggregate()
  }, [startDate, endDate, filteredStudents, supabase])

  // Helper to compute percentage
  const calculatePercentage = (stats) => {
    if (!stats || stats.total === 0) return "-"
    const percent = (stats.hadir / stats.total) * 100
    return `${percent.toFixed(1)}%`
  }

  // Get color code for percentage
  const getPercentageColor = (stats) => {
    if (!stats || stats.total === 0) return "text-muted-foreground"
    const percent = (stats.hadir / stats.total) * 100
    if (percent >= 90) return "text-emerald-600 dark:text-emerald-400 font-bold"
    if (percent >= 75) return "text-amber-500 font-bold"
    return "text-destructive font-bold"
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-xl h-10 px-3.5 gap-2 font-semibold"
          onClick={() => router.push("/dashboard/absensi")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>

        <Button
          variant="outline"
          className="rounded-xl h-10 px-3.5 gap-2 font-semibold text-primary hover:bg-primary/5"
          onClick={() => {
            const className = selectedClass === "all" ? "Semua Kelas" : classes.find(c => c.id === selectedClass)?.name || ""
            exportAttendanceRekapPDF({
              className,
              startDate,
              endDate,
              students: filteredStudents,
              aggregates
            })
          }}
          disabled={filteredStudents.length === 0}
        >
          <FileText className="h-4 w-4" />
          <span>Ekspor PDF (Rekap)</span>
        </Button>
      </div>

      {/* Date Range & Filters Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 bg-card rounded-2xl p-4">
        {/* Start Date */}
        <div className="space-y-1.5">
          <Label htmlFor="start-date" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Tanggal Mulai</span>
          </Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-xl"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <Label htmlFor="end-date" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Tanggal Selesai</span>
          </Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-xl"
          />
        </div>

        {/* Class selector */}
        <div className="space-y-1.5">
          <Label htmlFor="class-select" className="text-xs font-semibold text-muted-foreground">Kelas</Label>
          <div className="relative">
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-10 w-full pl-3 pr-8 rounded-xl bg-muted/40 text-sm transition-colors outline-none appearance-none dark:bg-card"
            >
              {role === "wali_kelas" ? (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Kelas {cls.name || `${cls.grade_level}`}
                  </option>
                ))
              ) : (
                <>
                  <option value="all">Semua Kelas Anak</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ▼
            </div>
          </div>
        </div>

        {/* Search Query */}
        <div className="space-y-1.5">
          <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground">Cari Nama / NISN</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rekap List Summary */}
      {fetching ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <Clock className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Menghitung rekapitulasi kehadiran...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Tidak Ada Laporan</h4>
          <p className="mt-1 text-xs text-muted-foreground">Tidak ada siswa yang cocok dengan filter saat ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Report Table */}
          <div className="hidden md:block overflow-hidden rounded-xl bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">NISN / NIS</th>
                  <th className="px-6 py-3.5 text-center bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">Hadir (H)</th>
                  <th className="px-6 py-3.5 text-center bg-amber-500/5 text-amber-600 dark:text-amber-400">Sakit (S)</th>
                  <th className="px-6 py-3.5 text-center bg-blue-500/5 text-blue-600 dark:text-blue-400">Izin (I)</th>
                  <th className="px-6 py-3.5 text-center bg-destructive/5 text-destructive">Alpha (A)</th>
                  <th className="px-6 py-3.5 text-center font-bold text-foreground">Total Hari</th>
                  <th className="px-6 py-3.5 text-right font-bold text-foreground">Persentase H</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const stats = aggregates[student.id] || { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 }
                  return (
                    <tr key={student.id} className="hover:bg-muted/10">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {student.full_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                        {student.nisn || "-"} / {student.nis || "-"}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                        {stats.hadir}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-amber-500">
                        {stats.sakit}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-blue-500">
                        {stats.izin}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-destructive">
                        {stats.alpha}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-foreground">
                        {stats.total}
                      </td>
                      <td className={`px-6 py-4 text-right ${getPercentageColor(stats)}`}>
                        {calculatePercentage(stats)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Report Card List */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredStudents.map((student) => {
              const stats = aggregates[student.id] || { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 }
              return (
                <div key={student.id} className="rounded-xl bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-foreground">{student.full_name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        NISN: {student.nisn || "-"} • NIS: {student.nis || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-muted-foreground/60">Persentase</span>
                      <span className={`text-sm ${getPercentageColor(stats)}`}>{calculatePercentage(stats)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1 py-2 text-center text-xs">
                    <div className="bg-emerald-500/5 py-1 rounded-lg">
                      <span className="block text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">H</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.hadir}</span>
                    </div>
                    <div className="bg-amber-500/5 py-1 rounded-lg">
                      <span className="block text-[9px] uppercase tracking-wider text-amber-500 font-semibold">S</span>
                      <span className="font-bold text-amber-500">{stats.sakit}</span>
                    </div>
                    <div className="bg-blue-500/5 py-1 rounded-lg">
                      <span className="block text-[9px] uppercase tracking-wider text-blue-500 font-semibold">I</span>
                      <span className="font-bold text-blue-500">{stats.izin}</span>
                    </div>
                    <div className="bg-destructive/5 py-1 rounded-lg">
                      <span className="block text-[9px] uppercase tracking-wider text-destructive font-semibold">A</span>
                      <span className="font-bold text-destructive">{stats.alpha}</span>
                    </div>
                    <div className="bg-secondary py-1 rounded-lg">
                      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total</span>
                      <span className="font-bold text-foreground">{stats.total}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
