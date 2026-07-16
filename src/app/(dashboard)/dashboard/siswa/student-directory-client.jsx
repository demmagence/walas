"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  UserPlus,
  AlertTriangle,
  FileSpreadsheet,
  Download
} from "lucide-react"
import { exportStudentListToExcel } from "@/lib/excel"

export default function StudentDirectoryClient({ role, initialStudents, classes }) {
  const supabase = createClient()
  const [students, setStudents] = useState(initialStudents)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [deletingId, setDeletingId] = useState(null)
  const [deletingName, setDeletingName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter students based on search and selected class
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn?.includes(searchQuery) ||
      student.nis?.includes(searchQuery)

    const matchesClass =
      selectedClass === "all" || student.class_id === selectedClass

    return matchesSearch && matchesClass
  })

  const handleDelete = async (id) => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", id)

      if (error) throw error

      // Update local state
      setStudents(students.filter((s) => s.id !== id))
      setDeletingId(null)
      setDeletingName("")
    } catch (err) {
      alert("Gagal menghapus siswa: " + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = () => {
    let className = "Semua_Kelas"
    if (selectedClass !== "all") {
      const cls = classes.find(c => c.id === selectedClass)
      if (cls) {
        className = `Kelas_${cls.name || cls.grade_level}`
      }
    }
    exportStudentListToExcel(filteredStudents, className)
  }

  const isWaliKelas = role === "wali_kelas"

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama, NISN, atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-10 w-full sm:w-48 pl-9 pr-8 rounded-xl border border-input bg-transparent text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 appearance-none dark:bg-card"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name || `${cls.grade_level}`}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Action buttons (Wali Kelas / General) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredStudents.length === 0}
            className="w-full sm:w-auto h-10 px-4 rounded-xl gap-2 font-semibold"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor Excel</span>
          </Button>

          {isWaliKelas && (
            <>
              <Link href="/dashboard/siswa/import">
                <Button variant="outline" className="w-full sm:w-auto h-10 px-4 rounded-xl gap-2 font-semibold text-primary hover:text-primary-foreground hover:bg-primary border-primary/40">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Impor Excel</span>
                </Button>
              </Link>

              <Link href="/dashboard/siswa/tambah">
                <Button className="w-full sm:w-auto h-10 px-4 rounded-xl gap-2 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm">
                  <Plus className="h-5 w-5" />
                  <span>Tambah Siswa</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Directory Table / Cards */}
      {filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <UserPlus className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Tidak Ada Siswa</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {searchQuery || selectedClass !== "all"
              ? "Tidak ada siswa yang cocok dengan filter pencarian Anda."
              : "Belum ada data siswa terdaftar di kelas Anda."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">NISN / NIS</th>
                  <th className="px-6 py-3.5">Kelas</th>
                  <th className="px-6 py-3.5">Jenis Kelamin</th>
                  <th className="px-6 py-3.5">No. Telepon</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {student.full_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {student.nisn || "-"} / {student.nis || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {student.classes?.name || "Belum ditentukan"}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">
                      {student.gender || "-"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link href={`/dashboard/siswa/${student.id}`}>
                          <Button size="icon-sm" variant="ghost" title="Lihat Detail">
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </Link>
                        {isWaliKelas && (
                          <>
                            <Link href={`/dashboard/siswa/${student.id}/edit`}>
                              <Button size="icon-sm" variant="ghost" title="Edit Biodata">
                                <Edit2 className="h-4 w-4 text-primary hover:text-primary/80" />
                              </Button>
                            </Link>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              title="Hapus Siswa"
                              onClick={() => {
                                setDeletingId(student.id)
                                setDeletingName(student.full_name)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredStudents.map((student) => (
              <div key={student.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">{student.full_name}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      NISN: {student.nisn || "-"} • NIS: {student.nis || "-"}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {student.classes?.name || "Belum ditentukan"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50 text-muted-foreground">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Gender</span>
                    <span className="capitalize font-medium text-foreground">{student.gender || "-"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Telepon</span>
                    <span className="font-medium text-foreground">{student.phone || "-"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/50">
                  <Link href={`/dashboard/siswa/${student.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </Button>
                  </Link>
                  {isWaliKelas && (
                    <>
                      <Link href={`/dashboard/siswa/${student.id}/edit`}>
                        <Button size="icon-sm" variant="outline" title="Edit">
                          <Edit2 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </Link>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        title="Hapus"
                        onClick={() => {
                          setDeletingId(student.id)
                          setDeletingName(student.full_name)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Hapus Data Siswa?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-normal">
              Apakah Anda yakin ingin menghapus data biodata siswa bernama <strong>{deletingName}</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-lg h-9 px-4"
                onClick={() => {
                  setDeletingId(null)
                  setDeletingName("")
                }}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg h-9 px-4"
                onClick={() => handleDelete(deletingId)}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
