"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Calendar as CalendarIcon, 
  FileSpreadsheet, 
  Save, 
  Check, 
  AlertCircle,
  Clock
} from "lucide-react"

export default function AttendanceLoggingClient({ role, students, classes }) {
  const supabase = createClient()

  // Get local today date string (YYYY-MM-DD)
  const getTodayString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const [date, setDate] = useState(getTodayString())
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || "all")
  const [attendanceMap, setAttendanceMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState(null)

  const isWaliKelas = role === "wali_kelas"

  // Filter students by selected class
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      return selectedClass === "all" || s.class_id === selectedClass
    })
  }, [students, selectedClass])

  // Fetch attendance records when date or class changes
  useEffect(() => {
    async function fetchAttendance() {
      setFetching(true)
      setMessage(null)
      try {
        const studentIds = filteredStudents.map((s) => s.id)
        if (studentIds.length === 0) {
          setAttendanceMap({})
          setFetching(false)
          return
        }

        const { data, error } = await supabase
          .from("attendances")
          .select("id, student_id, status, note")
          .eq("date", date)
          .in("student_id", studentIds)

        if (error) throw error

        // Map fetched records
        const newMap = {}
        // Initialize all with default (hadir)
        filteredStudents.forEach((student) => {
          newMap[student.id] = {
            id: null,
            status: "hadir",
            note: "",
          }
        })

        // Overlay with actual records
        data?.forEach((record) => {
          newMap[record.student_id] = {
            id: record.id,
            status: record.status,
            note: record.note || "",
          }
        })

        setAttendanceMap(newMap)
      } catch (err) {
        setMessage({ type: "error", text: "Gagal mengambil data absensi: " + err.message })
      } finally {
        setFetching(false)
      }
    }

    fetchAttendance()
  }, [date, filteredStudents, supabase])

  // Handle status toggle change
  const handleStatusChange = (studentId, status) => {
    if (!isWaliKelas) return // Read-only for parents
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }))
  }

  // Handle note input change
  const handleNoteChange = (studentId, note) => {
    if (!isWaliKelas) return
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }))
  }

  // Submit and save/upsert attendance records
  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const recordsToUpsert = filteredStudents.map((student) => {
        const state = attendanceMap[student.id]
        return {
          id: state?.id || undefined, // undefined let's Supabase handle primary key generation if new
          student_id: student.id,
          date: date,
          status: state?.status || "hadir",
          note: state?.note?.trim() || null,
        }
      })

      const { data, error } = await supabase
        .from("attendances")
        .upsert(recordsToUpsert, { onConflict: "student_id,date" })
        .select()

      if (error) throw error

      // Update mapped IDs from response to prevent duplicate entries on immediate double-saves
      const updatedMap = { ...attendanceMap }
      data?.forEach((record) => {
        if (updatedMap[record.student_id]) {
          updatedMap[record.student_id].id = record.id
        }
      })
      setAttendanceMap(updatedMap)

      setMessage({ type: "success", text: "Data absensi berhasil disimpan!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: "error", text: "Gagal menyimpan absensi: " + err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Navigation Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 flex-1 max-w-xl">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <Label htmlFor="date-picker" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Tanggal Absensi</span>
            </Label>
            <Input
              id="date-picker"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Class Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="class-select" className="text-xs font-semibold text-muted-foreground">Kelas</Label>
            <div className="relative">
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-10 w-full pl-3 pr-8 rounded-xl border border-input bg-transparent text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 appearance-none dark:bg-card"
              >
                {isWaliKelas ? (
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Go to Rekap Report Button */}
        <Link href="/dashboard/absensi/rekap" className="sm:self-end">
          <Button variant="outline" className="w-full h-10 px-4 rounded-xl gap-2 font-semibold border-primary/20 hover:bg-primary/5 text-primary">
            <FileSpreadsheet className="h-4.5 w-4.5" />
            <span>Rekap Absensi</span>
          </Button>
        </Link>
      </div>

      {/* Response Message alerts */}
      {message && (
        <div className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
          message.type === "success" 
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
            : "border-destructive/20 bg-destructive/10 text-destructive"
        }`}>
          {message.type === "success" ? <Check className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* List Header & Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">
          Daftar Siswa ({filteredStudents.length})
        </h3>
        {isWaliKelas && filteredStudents.length > 0 && (
          <Button
            onClick={handleSave}
            disabled={loading || fetching}
            className="h-10 px-4 rounded-xl gap-2 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? "Menyimpan..." : "Simpan Absensi"}</span>
          </Button>
        )}
      </div>

      {/* Students Roster Renders */}
      {fetching ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <Clock className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Memuat catatan absensi...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Tidak Ada Siswa</h4>
          <p className="mt-1 text-xs text-muted-foreground">Tidak ada siswa yang terdaftar di kelas yang dipilih.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">NISN / NIS</th>
                  <th className="px-6 py-3.5 text-center">Status Kehadiran</th>
                  <th className="px-6 py-3.5 w-80">Catatan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => {
                  const state = attendanceMap[student.id] || { status: "hadir", note: "" }
                  return (
                    <tr key={student.id} className="hover:bg-muted/10">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {student.full_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                        {student.nisn || "-"} / {student.nis || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {["hadir", "sakit", "izin", "alpha"].map((status) => {
                            const active = state.status === status
                            const labels = { hadir: "H", sakit: "S", izin: "I", alpha: "A" }
                            const bgColors = {
                              hadir: "bg-emerald-500 hover:bg-emerald-600 text-white",
                              sakit: "bg-amber-500 hover:bg-amber-600 text-white",
                              izin: "bg-blue-500 hover:bg-blue-600 text-white",
                              alpha: "bg-destructive hover:bg-destructive/90 text-white",
                            }
                            return (
                              <button
                                key={status}
                                type="button"
                                disabled={!isWaliKelas}
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`h-8 w-8 rounded-full text-xs font-bold transition-all ${
                                  active 
                                    ? `${bgColors[status]} scale-110 shadow-sm ring-2 ring-background` 
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-60"
                                }`}
                                title={status.toUpperCase()}
                              >
                                {labels[status]}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="text"
                          placeholder="Tambahkan keterangan..."
                          value={state.note}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          disabled={!isWaliKelas}
                          className="h-8 text-xs rounded-lg"
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
            {filteredStudents.map((student) => {
              const state = attendanceMap[student.id] || { status: "hadir", note: "" }
              return (
                <div key={student.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                  <div>
                    <h4 className="font-bold text-foreground">{student.full_name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      NISN: {student.nisn || "-"} • NIS: {student.nis || "-"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-1.5 border-t border-b border-border/50">
                    <span className="text-xs font-medium text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-1.5">
                      {["hadir", "sakit", "izin", "alpha"].map((status) => {
                        const active = state.status === status
                        const labels = { hadir: "H", sakit: "S", izin: "I", alpha: "A" }
                        const bgColors = {
                          hadir: "bg-emerald-500 text-white",
                          sakit: "bg-amber-500 text-white",
                          izin: "bg-blue-500 text-white",
                          alpha: "bg-destructive text-white",
                        }
                        return (
                          <button
                            key={status}
                            type="button"
                            disabled={!isWaliKelas}
                            onClick={() => handleStatusChange(student.id, status)}
                            className={`h-8 w-8 rounded-full text-xs font-bold transition-all ${
                              active 
                                ? `${bgColors[status]} scale-110 shadow-sm ring-2 ring-background` 
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {labels[status]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Keterangan</span>
                    <Input
                      type="text"
                      placeholder="Tambahkan keterangan..."
                      value={state.note}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      disabled={!isWaliKelas}
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Save Action for Mobile */}
          {isWaliKelas && (
            <div className="flex justify-end pt-3 md:hidden">
              <Button
                onClick={handleSave}
                disabled={loading || fetching}
                className="w-full h-11 rounded-xl gap-2 font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? "Menyimpan..." : "Simpan Absensi"}</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
