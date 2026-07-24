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
  Calendar, 
  X, 
  Save, 
  AlertTriangle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight
} from "lucide-react"

export default function AdminTahunAjaranClient({ initialAcademicYears }) {
  const supabase = createClient()
  const [academicYears, setAcademicYears] = useState(initialAcademicYears)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal / Form States
  const [isOpen, setIsOpen] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
  })

  // Delete State
  const [deletingId, setDeletingId] = useState(null)
  const [deletingName, setDeletingName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Feedback State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const filteredYears = academicYears.filter((y) => {
    return y.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Toggle active status: ensures only one year is active
  const handleToggleActive = async (id, currentStatus) => {
    if (currentStatus) return // Already active, no need to toggle off manually if another must be selected

    try {
      setLoading(true)
      setError(null)

      // 1. Deactivate all years
      const { error: deactivateError } = await supabase
        .from("academic_years")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000") // updates all records

      if (deactivateError) throw deactivateError

      // 2. Activate target year
      const { data, error: activateError } = await supabase
        .from("academic_years")
        .update({ is_active: true })
        .eq("id", id)
        .select()
        .single()

      if (activateError) throw activateError

      // 3. Update local state
      setAcademicYears(
        academicYears.map((y) => {
          if (y.id === id) return data
          return { ...y, is_active: false }
        })
      )

      setSuccessMessage(`Tahun ajaran ${data.name} sekarang aktif!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      alert("Gagal mengaktifkan tahun ajaran: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setError(null)
    setEditingYear(null)
    setFormData({ name: "", start_date: "", end_date: "", is_active: false })
    setIsOpen(true)
  }

  const openEditModal = (year) => {
    setError(null)
    setEditingYear(year)
    setFormData({
      name: year.name || "",
      start_date: year.start_date || "",
      end_date: year.end_date || "",
      is_active: year.is_active || false,
    })
    setIsOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError("Nama tahun ajaran wajib diisi.")
      setLoading(false)
      return
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError("Tanggal selesai harus lebih lambat dari tanggal mulai.")
      setLoading(false)
      return
    }

    try {
      const payload = {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
      }

      // If set to active, deactivate all other years first
      if (formData.is_active) {
        const { error: deactivateError } = await supabase
          .from("academic_years")
          .update({ is_active: false })
          .neq("id", "00000000-0000-0000-0000-000000000000")

        if (deactivateError) throw deactivateError
      }

      if (editingYear) {
        // UPDATE
        const { data, error: updateError } = await supabase
          .from("academic_years")
          .update(payload)
          .eq("id", editingYear.id)
          .select()
          .single()

        if (updateError) throw updateError

        let updatedYears = academicYears.map((y) => (y.id === editingYear.id ? data : y))
        if (formData.is_active) {
          updatedYears = updatedYears.map((y) => (y.id !== editingYear.id ? { ...y, is_active: false } : y))
        }
        setAcademicYears(updatedYears)
        setSuccessMessage("Tahun ajaran berhasil diperbarui!")
      } else {
        // INSERT
        const { data, error: insertError } = await supabase
          .from("academic_years")
          .insert(payload)
          .select()
          .single()

        if (insertError) throw insertError

        let updatedYears = [data, ...academicYears]
        if (formData.is_active) {
          updatedYears = updatedYears.map((y) => (y.id !== data.id ? { ...y, is_active: false } : y))
        }
        setAcademicYears(updatedYears)
        setSuccessMessage("Tahun ajaran baru berhasil didaftarkan!")
      }

      setIsOpen(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      if (err.code === "23505" || err.message?.includes("academic_years_name_key")) {
        setError(`Tahun ajaran "${formData.name.trim()}" sudah terdaftar. Silakan gunakan nama tahun ajaran yang berbeda.`)
      } else {
        setError(err.message || "Gagal menyimpan informasi tahun ajaran.")
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
        .from("academic_years")
        .delete()
        .eq("id", id)

      if (deleteError) {
        if (deleteError.code === "23503") {
          throw new Error("Tidak dapat menghapus tahun ajaran ini karena sudah terhubung ke data kelas atau nilai aktif.")
        }
        throw deleteError
      }

      setAcademicYears(academicYears.filter((y) => y.id !== id))
      setDeletingId(null)
      setDeletingName("")
      setSuccessMessage("Tahun ajaran berhasil dihapus!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Control Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari tahun ajaran..."
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
          <span>Tambah Tahun Ajaran</span>
        </Button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Roster List */}
      {filteredYears.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Tidak Ada Tahun Ajaran</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {searchQuery
              ? "Tidak ada tahun ajaran yang cocok dengan kata kunci pencarian Anda."
              : "Belum ada data tahun ajaran terdaftar dalam basis data."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Tahun Ajaran</th>
                  <th className="px-6 py-3.5">Tanggal Mulai</th>
                  <th className="px-6 py-3.5">Tanggal Selesai</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredYears.map((year) => (
                  <tr key={year.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4 font-bold text-foreground">
                      Tahun Ajaran {year.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(year.start_date)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(year.end_date)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(year.id, year.is_active)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                          year.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${year.is_active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                        <span>{year.is_active ? "Aktif" : "Nonaktif"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Edit"
                          onClick={() => openEditModal(year)}
                        >
                          <Edit2 className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Hapus"
                          onClick={() => {
                            setDeletingId(year.id)
                            setDeletingName(year.name)
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
            {filteredYears.map((year) => (
              <div key={year.id} className="rounded-xl bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">Tahun Ajaran {year.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(year.start_date)} s/d {formatDate(year.end_date)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(year.id, year.is_active)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      year.is_active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <span>{year.is_active ? "Aktif" : "Nonaktif"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEditModal(year)}>
                    <Edit2 className="h-3.5 w-3.5 text-primary" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => {
                      setDeletingId(year.id)
                      setDeletingName(year.name)
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

      {/* CRUD modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-card p-6 animate-in fade-in zoom-in duration-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-bold text-foreground">
                {editingYear ? "Edit Tahun Ajaran" : "Daftarkan Tahun Ajaran Baru"}
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

            {/* Academic Year Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Tahun Ajaran *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contoh: 2025/2026"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Tanggal Mulai *</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={handleInputChange}
                className="h-10 rounded-xl"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label htmlFor="end_date">Tanggal Selesai *</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                required
                value={formData.end_date}
                onChange={handleInputChange}
                className="h-10 rounded-xl"
              />
            </div>

            {/* Is Active Checkbox */}
            <div className="flex items-center gap-2 pt-1.5">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active" className="text-xs cursor-pointer select-none">
                Jadikan Tahun Ajaran Aktif (Menonaktifkan tahun ajaran lainnya)
              </Label>
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
                <span>Simpan Periode</span>
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
            <h3 className="text-lg font-bold text-foreground">Hapus Tahun Ajaran ini?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-normal">
              Apakah Anda yakin ingin menghapus tahun ajaran <strong>{deletingName}</strong>? Tindakan ini tidak dapat dibatalkan.
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
