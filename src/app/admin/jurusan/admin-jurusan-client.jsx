"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { revalidateCacheAction } from "@/lib/actions/cache-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FolderTree, 
  X, 
  Save, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react"

export default function AdminJurusanClient({ initialDepartments }) {
  const router = useRouter()
  const supabase = createClient()
  const [departments, setDepartments] = useState(initialDepartments)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal / Form States
  const [isOpen, setIsOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Delete State
  const [deletingId, setDeletingId] = useState(null)
  const [deletingName, setDeletingName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Feedback State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const filteredDepts = departments.filter((d) => {
    return d.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const openAddModal = () => {
    setError(null)
    setEditingDept(null)
    setFormData({ name: "", description: "" })
    setIsOpen(true)
  }

  const openEditModal = (dept) => {
    setError(null)
    setEditingDept(dept)
    setFormData({
      name: dept.name || "",
      description: dept.description || "",
    })
    setIsOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError("Nama jurusan wajib diisi.")
      setLoading(false)
      return
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      }

      if (editingDept) {
        // UPDATE
        const { data, error: updateError } = await supabase
          .from("departments")
          .update(payload)
          .eq("id", editingDept.id)
          .select()
          .single()

        if (updateError) throw updateError

        setDepartments(departments.map((d) => (d.id === editingDept.id ? data : d)))
        setSuccessMessage("Jurusan berhasil diperbarui!")
      } else {
        // INSERT
        const { data, error: insertError } = await supabase
          .from("departments")
          .insert(payload)
          .select()
          .single()

        if (insertError) throw insertError

        setDepartments([data, ...departments])
        setSuccessMessage("Jurusan baru berhasil didaftarkan!")
      }

      await revalidateCacheAction('departments', '/admin/jurusan')
      router.refresh()

      setIsOpen(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      if (err.code === "23505" || err.message?.includes("departments_name_key")) {
        setError(`Nama jurusan "${formData.name.trim()}" sudah terdaftar. Silakan gunakan nama jurusan lain.`)
      } else {
        setError(err.message || "Gagal menyimpan informasi jurusan.")
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
        .from("departments")
        .delete()
        .eq("id", id)

      if (deleteError) {
        if (deleteError.code === "23503") {
          throw new Error("Tidak dapat menghapus jurusan ini karena sudah memiliki kelas aktif yang terhubung.")
        }
        throw deleteError
      }

      setDepartments(departments.filter((d) => d.id !== id))
      await revalidateCacheAction('departments', '/admin/jurusan')
      router.refresh()

      setDeletingId(null)
      setDeletingName("")
      setSuccessMessage("Jurusan berhasil dihapus!")
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
          <FolderTree className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama jurusan..."
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
          <span>Tambah Jurusan</span>
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
      {filteredDepts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <FolderTree className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Tidak Ada Jurusan</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {searchQuery
              ? "Tidak ada jurusan yang cocok dengan kata kunci pencarian Anda."
              : "Belum ada jurusan terdaftar dalam basis data."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-3.5 w-64">Nama Jurusan</th>
                  <th className="px-6 py-3.5">Deskripsi / Keterangan</th>
                  <th className="px-6 py-3.5 text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.map((dept) => (
                  <tr key={dept.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4 font-bold text-foreground">
                      {dept.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground leading-relaxed">
                      {dept.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Edit Jurusan"
                          onClick={() => openEditModal(dept)}
                        >
                          <Edit2 className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Hapus Jurusan"
                          onClick={() => {
                            setDeletingId(dept.id)
                            setDeletingName(dept.name)
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
            {filteredDepts.map((dept) => (
              <div key={dept.id} className="rounded-xl bg-card p-4 space-y-3">
                <div>
                  <h4 className="font-bold text-foreground">{dept.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    {dept.description || "Tidak ada deskripsi."}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEditModal(dept)}>
                    <Edit2 className="h-3.5 w-3.5 text-primary" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => {
                      setDeletingId(dept.id)
                      setDeletingName(dept.name)
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
                {editingDept ? "Edit Informasi Jurusan" : "Daftarkan Jurusan Baru"}
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

            {/* Department Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Jurusan *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contoh: Rekayasa Perangkat Lunak (RPL)"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi / Keterangan</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Masukkan deskripsi singkat tentang jurusan..."
                className="w-full px-3 py-2 rounded-xl bg-muted/40 text-sm transition-colors outline-none dark:bg-card"
              />
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
                <span>Simpan Jurusan</span>
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
            <h3 className="text-lg font-bold text-foreground">Hapus Jurusan ini?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-normal">
              Apakah Anda yakin ingin menghapus jurusan <strong>{deletingName}</strong>? Tindakan ini tidak dapat dibatalkan.
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
