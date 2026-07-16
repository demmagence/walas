"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Edit2, 
  User, 
  Calendar, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Hash, 
  BookOpen,
  CheckCircle,
  FileText
} from "lucide-react"

export default function StudentDetailsClient({ role, student, attendances, grades }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("biodata")

  const isWaliKelas = role === "wali_kelas"

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Attendance status styles helper
  const getAttendanceStatusBadge = (status) => {
    switch (status) {
      case "hadir":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      case "sakit":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      case "izin":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "alpha":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-xl h-10 px-3.5 gap-2 font-semibold"
          onClick={() => router.push("/dashboard/siswa")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>

        {isWaliKelas && (
          <Link href={`/dashboard/siswa/${student.id}/edit`}>
            <Button className="rounded-xl h-10 px-4 gap-2 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm">
              <Edit2 className="h-4 w-4" />
              <span>Edit Biodata</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Profile Header Summary */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
          <User className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">{student.full_name}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>NISN: <span className="font-mono font-medium">{student.nisn || "-"}</span></span>
            <span>•</span>
            <span>NIS: <span className="font-mono font-medium">{student.nis || "-"}</span></span>
            <span>•</span>
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {student.classes?.name || "Belum ditentukan"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab("biodata")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "biodata"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Biodata</span>
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "attendance"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Kehadiran ({attendances.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("grades")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "grades"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Nilai ({grades.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* BIODATA TAB */}
        {activeTab === "biodata" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Personal Details */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border/50 pb-2">
                Data Pribadi
              </h3>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Nama Lengkap</span>
                    <span className="text-sm font-medium text-foreground">{student.full_name}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Jenis Kelamin</span>
                    <span className="text-sm font-medium text-foreground capitalize">{student.gender || "-"}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Tempat, Tanggal Lahir</span>
                    <span className="text-sm font-medium text-foreground">
                      {student.birth_place || "-"}, {formatDate(student.birth_date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Agama</span>
                    <span className="text-sm font-medium text-foreground">{student.religion || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* School & Contact Details */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border/50 pb-2">
                Akademik & Kontak
              </h3>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Kelas</span>
                    <span className="text-sm font-medium text-foreground">{student.classes?.name || "Belum ditentukan"}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Orang Tua / Wali</span>
                    <span className="text-sm font-medium text-foreground">{student.parentName || "-"}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">No. Telepon / Kontak</span>
                    <span className="text-sm font-medium text-foreground">{student.phone || "-"}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Alamat Rumah</span>
                    <span className="text-sm font-medium text-foreground block leading-relaxed">{student.address || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {attendances.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <Calendar className="h-6 w-6" />
                </div>
                <h4 className="text-base font-semibold text-foreground">Tidak Ada Catatan Absensi</h4>
                <p className="mt-1 text-xs text-muted-foreground">Belum ada pencatatan kehadiran yang terekam untuk siswa ini.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-6 py-3">Tanggal</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Keterangan / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-muted/10">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {new Date(att.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold capitalize ${getAttendanceStatusBadge(att.status)}`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {att.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* GRADES TAB */}
        {activeTab === "grades" && (
          <div className="space-y-6">
            {grades.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3 mx-auto">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h4 className="text-base font-semibold text-foreground">Tidak Ada Catatan Nilai</h4>
                <p className="mt-1 text-xs text-muted-foreground">Belum ada input nilai rapor atau pelajaran untuk siswa ini.</p>
              </div>
            ) : (
              // Group grades by semester
              [1, 2].map((semesterNum) => {
                const semesterGrades = grades.filter((g) => g.semester === semesterNum)
                if (semesterGrades.length === 0) return null

                // Compute semester average
                const totalScore = semesterGrades.reduce((sum, g) => sum + parseFloat(g.score), 0)
                const average = (totalScore / semesterGrades.length).toFixed(2)

                return (
                  <div key={semesterNum} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden space-y-4">
                    <div className="bg-muted px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border">
                      <div>
                        <h4 className="font-bold text-foreground">Semester {semesterNum}</h4>
                        <p className="text-xs text-muted-foreground">Tahun Ajaran: {semesterGrades[0]?.academic_years?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rata-rata Semester:</span>
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {average}
                        </span>
                      </div>
                    </div>

                    <div className="px-6 pb-6">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                            <th className="py-2.5">Mata Pelajaran</th>
                            <th className="py-2.5 text-right">Nilai</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {semesterGrades.map((grade) => (
                            <tr key={grade.id} className="hover:bg-muted/5">
                              <td className="py-3 font-medium text-foreground">
                                {grade.subjects?.name || "Mata Pelajaran"}
                              </td>
                              <td className="py-3 text-right font-bold text-foreground">
                                <span className={parseFloat(grade.score) >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}>
                                  {grade.score}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
