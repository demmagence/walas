"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"

export default function AddStudentForm({ classes, parents }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    full_name: "",
    nisn: "",
    nis: "",
    birth_place: "",
    birth_date: "",
    gender: "laki-laki",
    religion: "",
    address: "",
    phone: "",
    class_id: classes[0]?.id || "",
    parent_user_id: "",
  })

  const handleChange = (e) => {
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

    if (!formData.full_name.trim()) {
      setError("Nama lengkap wajib diisi.")
      setLoading(false)
      return
    }

    if (!formData.class_id) {
      setError("Anda harus memilih kelas untuk siswa ini.")
      setLoading(false)
      return
    }

    try {
      const studentPayload = {
        full_name: formData.full_name.trim(),
        nisn: formData.nisn.trim() || null,
        nis: formData.nis.trim() || null,
        birth_place: formData.birth_place.trim() || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        religion: formData.religion.trim() || null,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        class_id: formData.class_id,
        parent_user_id: formData.parent_user_id || null,
      }

      const { error: insertError } = await supabase
        .from("students")
        .insert(studentPayload)

      if (insertError) throw insertError

      router.push("/dashboard/siswa")
      router.refresh()
    } catch (err) {
      setError(err.message || "Gagal mendaftarkan siswa baru.")
    } finally {
      setLoading(false)
    }
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-2xl bg-destructive/10 p-6 text-center space-y-4">
        <div className="flex justify-center text-destructive">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold text-destructive">Akses Terbatas</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Anda belum ditugaskan sebagai Wali Kelas pada kelas aktif manapun. Anda hanya dapat mendaftarkan siswa baru setelah Admin menugaskan Anda ke sebuah kelas.
        </p>
        <Button variant="outline" className="rounded-xl" onClick={() => router.push("/dashboard/siswa")}>
          Kembali ke Daftar Siswa
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl p-6">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Name & Class */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Nama Lengkap *</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            required
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap siswa..."
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="class_id">Kelas *</Label>
          <select
            id="class_id"
            name="class_id"
            required
            value={formData.class_id}
            onChange={handleChange}
            className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none appearance-none dark:bg-card"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Kelas {cls.name || `${cls.grade_level}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: NISN & NIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nisn">NISN</Label>
          <Input
            id="nisn"
            name="nisn"
            type="text"
            value={formData.nisn}
            onChange={handleChange}
            placeholder="Nomor Induk Siswa Nasional (10 digit)..."
            className="h-10 rounded-xl font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nis">NIS</Label>
          <Input
            id="nis"
            name="nis"
            type="text"
            value={formData.nis}
            onChange={handleChange}
            placeholder="Nomor Induk Siswa..."
            className="h-10 rounded-xl font-mono"
          />
        </div>
      </div>

      {/* Row 3: Birth Place & Birth Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="birth_place">Tempat Lahir</Label>
          <Input
            id="birth_place"
            name="birth_place"
            type="text"
            value={formData.birth_place}
            onChange={handleChange}
            placeholder="Contoh: Jakarta"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birth_date">Tanggal Lahir</Label>
          <Input
            id="birth_date"
            name="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={handleChange}
            className="h-10 rounded-xl"
          />
        </div>
      </div>

      {/* Row 4: Gender & Religion */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gender">Jenis Kelamin</Label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none cursor-pointer"
          >
            <option value="laki-laki">Laki-Laki</option>
            <option value="perempuan">Perempuan</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="religion">Agama</Label>
          <select
            id="religion"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none cursor-pointer"
          >
            <option value="">Pilih Agama</option>
            <option value="Islam">Islam</option>
            <option value="Kristen">Kristen</option>
            <option value="Katolik">Katolik</option>
            <option value="Hindu">Hindu</option>
            <option value="Buddha">Buddha</option>
            <option value="Khonghucu">Khonghucu</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Row 5: Phone & Parent User Link */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">No. Telepon</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nomor HP siswa/kontak..."
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="parent_user_id">Hubungkan Wali / Orang Tua</Label>
          <select
            id="parent_user_id"
            name="parent_user_id"
            value={formData.parent_user_id}
            onChange={handleChange}
            className="h-10 w-full px-3 rounded-xl bg-muted/40 text-sm transition-colors outline-none cursor-pointer"
          >
            <option value="">Pilih Orang Tua / Wali</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Address Textarea */}
      <div className="space-y-1.5">
        <Label htmlFor="address">Alamat Lengkap</Label>
        <textarea
          id="address"
          name="address"
          rows={3}
          value={formData.address}
          onChange={handleChange}
          placeholder="Masukkan alamat lengkap siswa..."
          className="w-full px-3 py-2 rounded-xl bg-muted/40 text-sm transition-colors outline-none dark:bg-card"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 rounded-xl gap-2 font-semibold"
          onClick={() => router.push("/dashboard/siswa")}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Batal</span>
        </Button>
        <Button
          type="submit"
          className="h-10 px-4 rounded-xl gap-2 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm"
          disabled={loading}
        >
          <Save className="h-4 w-4" />
          <span>{loading ? "Menyimpan..." : "Simpan Biodata"}</span>
        </Button>
      </div>
    </form>
  )
}
