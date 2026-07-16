"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  X, 
  Save, 
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Link as LinkIcon,
  Search,
  Filter
} from "lucide-react"

export default function AdminPenggunaClient({ initialUsers, students }) {
  const supabase = createClient()
  const [users, setUsers] = useState(initialUsers)
  const [studentList, setStudentList] = useState(students)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  // Modal / Edit States
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    role: "orang_tua",
  })

  // Modal / Link State
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [linkingParent, setLinkingParent] = useState(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState([])

  // Feedback State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filter users by search and role filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || u.role === roleFilter

    return matchesSearch && matchesRole
  })

  const openEditModal = (user) => {
    setError(null)
    setEditingUser(user)
    setEditFormData({
      full_name: user.full_name || "",
      role: user.role || "orang_tua",
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!editFormData.full_name.trim()) {
      setError("Nama lengkap wajib diisi.")
      setLoading(false)
      return
    }

    try {
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: editFormData.full_name.trim(),
          role: editFormData.role,
        })
        .eq("id", editingUser.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === editingUser.id
            ? { ...u, full_name: data.full_name, role: data.role }
            : u
        )
      )

      setSuccessMessage("Pengguna berhasil diperbarui!")
      setIsEditOpen(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || "Gagal memperbarui pengguna.")
    } finally {
      setLoading(false)
    }
  }

  const openLinkModal = (parent) => {
    setError(null)
    setLinkingParent(parent)
    // Find students currently linked to this parent
    const linkedIds = studentList
      .filter((s) => s.parent_user_id === parent.id)
      .map((s) => s.id)
    setSelectedStudentIds(linkedIds)
    setIsLinkOpen(true)
  }

  const handleCheckboxChange = (studentId) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const handleLinkSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Get currently linked student IDs for this parent
      const currentlyLinked = studentList
        .filter((s) => s.parent_user_id === linkingParent.id)
        .map((s) => s.id)

      // 2. Determine which ones to unlink (currently linked but not in new selection)
      const toUnlink = currentlyLinked.filter((id) => !selectedStudentIds.includes(id))

      // 3. Determine which ones to link (in new selection but not currently linked)
      const toLink = selectedStudentIds.filter((id) => !currentlyLinked.includes(id))

      // 4. Update Supabase
      if (toUnlink.length > 0) {
        const { error: unlinkError } = await supabase
          .from("students")
          .update({ parent_user_id: null })
          .in("id", toUnlink)

        if (unlinkError) throw unlinkError
      }

      if (toLink.length > 0) {
        const { error: linkError } = await supabase
          .from("students")
          .update({ parent_user_id: linkingParent.id })
          .in("id", toLink)

        if (linkError) throw linkError
      }

      // 5. Update local studentList state
      setStudentList(
        studentList.map((s) => {
          if (toUnlink.includes(s.id)) {
            return { ...s, parent_user_id: null }
          }
          if (toLink.includes(s.id)) {
            return { ...s, parent_user_id: linkingParent.id }
          }
          return s
        })
      )

      setSuccessMessage(`Koneksi siswa untuk Orang Tua ${linkingParent.full_name} berhasil disimpan!`)
      setIsLinkOpen(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || "Gagal menghubungkan data wali siswa.")
    } finally {
      setLoading(false)
    }
  }

  // Format role label
  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return "bg-accent/15 text-accent border border-accent/20 font-bold"
      case "wali_kelas":
        return "bg-primary/15 text-primary border border-primary/20 font-semibold"
      default:
        return "bg-secondary text-secondary-foreground border border-border"
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin": return "Admin"
      case "wali_kelas": return "Wali Kelas"
      case "orang_tua": return "Orang Tua / Wali"
      default: return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Search, Filter, Actions Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 w-full sm:w-48 pl-9 pr-8 rounded-xl border border-input bg-transparent text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 appearance-none dark:bg-card"
          >
            <option value="all">Semua Peran</option>
            <option value="admin">Admin</option>
            <option value="wali_kelas">Wali Kelas</option>
            <option value="orang_tua">Orang Tua / Wali</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Roster List */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Tidak Ada Pengguna</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {searchQuery || roleFilter !== "all"
              ? "Tidak ada pengguna yang cocok dengan filter pencarian Anda."
              : "Belum ada data pengguna terdaftar."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Nama Pengguna</th>
                  <th className="px-6 py-3.5">Alamat Email</th>
                  <th className="px-6 py-3.5 text-center">Peran</th>
                  <th className="px-6 py-3.5">Terdaftar Pada</th>
                  <th className="px-6 py-3.5 text-right w-44">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const childrenNames = studentList
                    .filter((s) => s.parent_user_id === user.id)
                    .map((s) => s.full_name)
                    .join(", ")

                  return (
                    <tr key={user.id} className="hover:bg-muted/10">
                      <td className="px-6 py-4 font-bold text-foreground">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadge(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {user.role === "orang_tua" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-xs gap-1 py-1 h-7 border-primary/20 text-primary hover:bg-primary/5"
                              onClick={() => openLinkModal(user)}
                              title={childrenNames ? `Tersambung: ${childrenNames}` : "Hubungkan ke Siswa"}
                            >
                              <LinkIcon className="h-3.5 w-3.5" />
                              <span>Tautkan</span>
                            </Button>
                          )}
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Edit Pengguna"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredUsers.map((user) => {
              const childrenNames = studentList
                .filter((s) => s.parent_user_id === user.id)
                .map((s) => s.full_name)
                .join(", ")

              return (
                <div key={user.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-foreground">{user.full_name}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.email}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>

                  {user.role === "orang_tua" && (
                    <div className="py-2 border-t border-border/50 text-xs">
                      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Siswa Terkoneksi</span>
                      <span className="font-medium text-foreground">{childrenNames || "Belum ada siswa yang ditautkan."}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/50">
                    {user.role === "orang_tua" && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-primary" onClick={() => openLinkModal(user)}>
                        <LinkIcon className="h-3.5 w-3.5" />
                        Tautkan Siswa
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openEditModal(user)}>
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Peran
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Edit User Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in duration-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Edit Profil Pengguna</h3>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => setIsEditOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <Label>Alamat Email</Label>
              <div className="h-10 px-3 flex items-center rounded-xl bg-secondary border border-border/50 text-sm font-mono text-muted-foreground w-full">
                {editingUser.email}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                type="text"
                required
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                placeholder="Masukkan nama lengkap..."
                className="h-10 rounded-xl"
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="role">Peran Akses (Role) *</Label>
              <select
                id="role"
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="h-10 w-full px-3 rounded-xl border border-input bg-transparent text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-card"
              >
                <option value="admin">Administrator</option>
                <option value="wali_kelas">Wali Kelas (Teacher)</option>
                <option value="orang_tua">Orang Tua / Wali (Parent)</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => setIsEditOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-4 rounded-xl gap-2 font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Parent Student Linkage Modal */}
      {isLinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <form
            onSubmit={handleLinkSubmit}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in duration-200 space-y-4 flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-foreground">Hubungkan Wali Siswa</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Wali: {linkingParent.full_name}</p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => setIsLinkOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex-shrink-0">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Checkbox List of Students */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Pilih Siswa</Label>
              {studentList.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Tidak ada data siswa terdaftar.</p>
              ) : (
                <div className="divide-y divide-border/40 border border-border rounded-xl bg-secondary/20 p-2 max-h-[40vh] overflow-y-auto">
                  {studentList.map((student) => {
                    const isChecked = selectedStudentIds.includes(student.id)
                    return (
                      <label
                        key={student.id}
                        className="flex items-center justify-between py-2.5 px-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground">{student.full_name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheckboxChange(student.id)}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => setIsLinkOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-4 rounded-xl gap-2 font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Tautan</span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
