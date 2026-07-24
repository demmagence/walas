"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Edit2, 
  Trash2, 
  School, 
  X, 
  Save, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react"

export default function AdminKelasClient({ initialClasses, departments, academicYears, teachers }) {
  const supabase = createClient()
  const [classes, setClasses] = useState(initialClasses)
  const [searchQuery, setSearchQuery] = useState("")

  // Form / Modal States
  const [isOpen, setIsOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    grade_level: 10,
    department_id: departments[0]?.id || "",
    academic_year_id: academicYears.find(y => y.is_active)?.id || academicYears[0]?.id || "",
    homeroom_teacher: "",
  })

  // Delete State
  const [deletingId, setDeletingId] = useState(null)
  const [deletingName, setDeletingName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Feedback State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filter classes by name search
  const filteredClasses = classes.filter((cls) => {
    return cls.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const openAddModal = () => {
    setError(null)
    setEditingClass(null)
    setFormData({
      name: "",
      grade_level: 10,
      department_id: departments[0]?.id || "",
      academic_year_id: academicYears.find(y => y.is_active)?.id || academicYears[0]?.id || "",
      homeroom_teacher: "",
    })
    setIsOpen(true)
  }

  const openEditModal = (cls) => {
    setError(null)
    setEditingClass(cls)
    setFormData({
      name: cls.name || "",
      grade_level: cls.grade_level || 10,
      department_id: cls.department_id || "",
      academic_year_id: cls.academic_year_id || "",
      homeroom_teacher: cls.homeroom_teacher || "",
    })
    setIsOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "grade_level" ? parseInt(value) || 10 : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError("Nama kelas wajib diisi.")
      setLoading(false)
      return
    }

    try {
      const payload = {
        name: formData.name.trim(),
        grade_level: formData.grade_level,
        department_id: formData.department_id,
        academic_year_id: formData.academic_year_id,
        homeroom_teacher: formData.homeroom_teacher || null,
      }

      if (editingClass) {
        // UPDATE Class
        const { data, error: updateError } = await supabase
          .from("classes")
          .update(payload)
          .eq("id", editingClass.id)
          .select(`
            *,
            departments ( name ),
            academic_years ( name ),
            profiles ( full_name )
          `)
          .single()

        if (updateError) throw updateError

        setClasses(classes.map((c) => (c.id === editingClass.id ? data : c)))
        setSuccessMessage("Kelas berhasil diperbarui!")
      } else {
        // INSERT Class
        const { data, error: insertError } = await supabase
          .from("classes")
          .insert(payload)
          .select(`
            *,
            departments ( name ),
            academic_years ( name ),
            profiles ( full_name )
          `)
          .single()

        if (insertError) throw insertError

        setClasses([data, ...classes])
        setSuccessMessage("Kelas baru berhasil didaftarkan!")
      }

      setIsOpen(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      if (err.code === "23505" || err.message?.includes("classes_name_academic_year_id_key")) {
        setError(`Kelas "${formData.name.trim()}" sudah terdaftar pada tahun ajaran yang dipilih.`)
      } else {
        setError(err.message || "Gagal menyimpan informasi kelas.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setIsDeleting(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from("classes")
        .delete()
        .eq("id", id)

      if (deleteError) {
        // If foreign key violation
        if (deleteError.code === "23503") {
          throw new Error("Tidak dapat menghapus kelas karena masih memiliki data siswa atau mata pelajaran terkait.")
        }
        throw deleteError
      }

      setClasses(classes.filter((c) => c.id !== id))
      setDeletingId(null)
      setDeletingName("")
      setSuccessMessage("Kelas berhasil dihapus!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Control Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <School className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <Button
          onClick={openAddModal}
          className="h-10 px-4 rounded-xl gap-2 font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm"
        >
          <Plus className="h-5 w-5" />
          <span>Tambah Kelas</span>
        </Button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Classes Roster List */}
      {filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <School className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Tidak Ada Kelas</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {searchQuery
              ? "Tidak ada kelas yang cocok dengan kata kunci pencarian Anda."
              : "Belum ada kelas terdaftar dalam basis data."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Nama Kelas</th>
                  <th className="px-6 py-3.5">Tingkat</th>
                  <th className="px-6 py-3.5">Jurusan</th>
                  <th className="px-6 py-3.5">Tahun Ajaran</th>
                  <th className="px-6 py-3.5">Wali Kelas (Homeroom Teacher)</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4 font-bold text-foreground">
                      Kelas {cls.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      Tingkat {cls.grade_level}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {cls.departments?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {cls.academic_years?.name || "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {cls.profiles?.full_name || (
                        <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded font-semibold">
                          Belum ditugaskan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Edit Kelas"
                          onClick={() => openEditModal(cls)}
                        >
                          <Edit2 className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Hapus Kelas"
                          onClick={() => {
                            setDeletingId(cls.id)
                            setDeletingName(cls.name)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredClasses.map((cls) => (
              <div key={cls.id} className="rounded-xl bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">Kelas {cls.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tingkat {cls.grade_level} • {cls.academic_years?.name}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    {cls.departments?.name || "-"}
                  </span>
                </div>

                <div className="py-2 text-xs text-muted-foreground">
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Wali Kelas</span>
                  <span className="font-semibold text-foreground">
                    {cls.profiles?.full_name || <span className="text-destructive">Belum ditugaskan</span>}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEditModal(cls)}>
                    <Edit2 className="h-3.5 w-3.5 text-primary" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => {
                      setDeletingId(cls.id)
                      setDeletingName(cls.name)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CRUD modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-card p-6 animate-in fade-in zoom-in duration-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-bold text-foreground">
                {editingClass ? "Edit Informasi Kelas" : "Daftarkan Kelas Baru"}
              </h3>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Class Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Kelas *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contoh: XII RPL 1"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Grade Level */}
            <div className="space-y-1.5">
              <Label htmlFor="grade_level">Tingkat Kelas *</Label>
              <select
                id="grade_level"
                name="grade_level"
                required
                value={formData.grade_level}
                onChange={handleInputChange}
                className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none appearance-none dark:bg-card"
              >
                <option value={10}>Tingkat 10 (Sepuluh)</option>
                <option value={11}>Tingkat 11 (Sebelas)</option>
                <option value={12}>Tingkat 12 (Dua Belas)</option>
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="department_id">Jurusan *</Label>
              <select
                id="department_id"
                name="department_id"
                required
                value={formData.department_id}
                onChange={handleInputChange}
                className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none appearance-none dark:bg-card"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <Label htmlFor="academic_year_id">Tahun Ajaran *</Label>
              <select
                id="academic_year_id"
                name="academic_year_id"
                required
                value={formData.academic_year_id}
                onChange={handleInputChange}
                className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none appearance-none dark:bg-card"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.is_active ? "(Aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Homeroom Teacher */}
            <div className="space-y-1.5">
              <Label htmlFor="homeroom_teacher">Wali Kelas (Homeroom Teacher)</Label>
              <select
                id="homeroom_teacher"
                name="homeroom_teacher"
                value={formData.homeroom_teacher}
                onChange={handleInputChange}
                className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none cursor-pointer"
              >
                <option value="">Pilih Wali Kelas</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-4 rounded-xl gap-2 font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? "Menyimpan..." : "Simpan Kelas"}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Hapus Kelas ini?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-normal">
              Apakah Anda yakin ingin menghapus kelas <strong>Kelas {deletingName}</strong>? Tindakan ini tidak dapat dibatalkan.
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
