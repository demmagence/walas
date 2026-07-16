'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  HelpCircle
} from 'lucide-react'
import { downloadImportTemplate, parseImportExcel } from '@/lib/excel'
import { importStudentsAction } from '@/lib/actions/student-actions'

export default function ImportClient({ classes }) {
  const router = useRouter()
  const fileInputRef = useRef(null)
  
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
  const [file, setFile] = useState(null)
  const [parsedStudents, setParsedStudents] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedClassName = selectedClass ? `Kelas ${selectedClass.name || selectedClass.grade_level}` : ''

  // Template download handler
  const handleDownloadTemplate = () => {
    if (!selectedClassId) {
      alert('Pilih kelas terlebih dahulu.')
      return
    }
    downloadImportTemplate(selectedClassName)
  }

  // Handle Drag-and-Drop
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const fileExt = droppedFile.name.split('.').pop().toLowerCase()
      if (fileExt !== 'xlsx' && fileExt !== 'xls') {
        setError('Format file tidak didukung. Harap unggah berkas Excel (.xlsx atau .xls).')
        return
      }
      await processFile(droppedFile)
    }
  }

  // File picker handler
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0])
    }
  }

  // Parse and validate Excel file content
  const processFile = async (selectedFile) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setFile(selectedFile)

    try {
      const { data, errors } = await parseImportExcel(selectedFile)
      setParsedStudents(data)
      setValidationErrors(errors)
    } catch (err) {
      setError(err.message || 'Gagal membaca berkas Excel. Pastikan struktur berkas benar.')
      setFile(null)
      setParsedStudents([])
      setValidationErrors([])
    } finally {
      setLoading(false)
    }
  }

  // Remove uploaded file and reset preview state
  const handleReset = () => {
    setFile(null)
    setParsedStudents([])
    setValidationErrors([])
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Trigger server action for bulk insert
  const handleImportSubmit = async () => {
    if (!selectedClassId) {
      setError('Harap pilih kelas tujuan terlebih dahulu.')
      return
    }

    if (parsedStudents.length === 0) {
      setError('Tidak ada data siswa untuk diimpor.')
      return
    }

    const invalidCount = parsedStudents.filter(s => !s.isValid).length
    if (invalidCount > 0) {
      setError('Beberapa baris data tidak valid. Harap perbaiki kesalahan di bawah sebelum mengimpor.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const res = await importStudentsAction(parsedStudents, selectedClassId)
      if (res.success) {
        setSuccess(`Berhasil mengimpor ${res.count} data siswa baru ke dalam ${selectedClassName}.`)
        setParsedStudents([])
        setFile(null)
        // Redirect to student directory after brief delay
        setTimeout(() => {
          router.push('/dashboard/siswa')
          router.refresh()
        }, 2000)
      } else {
        setError(res.error || 'Gagal mengimpor siswa.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  const hasErrors = validationErrors.length > 0

  return (
    <div className="space-y-6">
      {/* Top action and title */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-xl h-10 px-3.5 gap-2 font-semibold"
          onClick={() => router.push('/dashboard/siswa')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Impor Data Siswa</h1>
        <p className="text-sm text-muted-foreground">
          Unggah berkas Excel (.xlsx) untuk menambahkan data siswa secara massal ke kelas Anda.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center space-y-4">
          <div className="flex justify-center text-destructive">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-destructive">Akses Terbatas</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Anda belum ditugaskan sebagai Wali Kelas pada kelas aktif manapun. Anda dapat mengimpor data siswa setelah Admin menugaskan Anda ke kelas binaan.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Settings and Instruction Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Konfigurasi Impor</h3>
              
              {/* Select target class */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Kelas Tujuan</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value)
                    handleReset() // Reset file if target class changes
                  }}
                  disabled={loading || file !== null}
                  className="h-10 w-full px-3 rounded-xl border border-input bg-transparent text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 appearance-none dark:bg-card"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.name || `${cls.grade_level}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Download Option */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Pastikan kolom dan header data Excel sesuai dengan template yang ditentukan. Unduh template di bawah:
                </p>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  className="w-full rounded-xl gap-2 font-semibold text-xs h-9 text-primary hover:text-primary-foreground hover:bg-primary border-primary/40"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Template Excel
                </Button>
              </div>
            </div>

            {/* Formatting Guidance */}
            <div className="rounded-2xl border border-border/50 bg-secondary p-5 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
                <HelpCircle className="h-4 w-4 text-primary" />
                Pedoman Format
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                <li><strong className="text-foreground">Nama Lengkap</strong>: Wajib diisi (teks).</li>
                <li><strong className="text-foreground">Jenis Kelamin</strong>: Wajib diisi (<code className="bg-muted px-1 rounded text-primary">laki-laki</code> atau <code className="bg-muted px-1 rounded text-primary">perempuan</code>).</li>
                <li><strong className="text-foreground">NISN</strong>: Harus berisi tepat 10 digit angka jika diisi.</li>
                <li><strong className="text-foreground">NIS</strong>: Harus berisi angka jika diisi.</li>
                <li><strong className="text-foreground">Tanggal Lahir</strong>: Gunakan format standar <code className="bg-muted px-1 rounded text-primary">YYYY-MM-DD</code> (contoh: 2008-05-15).</li>
              </ul>
            </div>
          </div>

          {/* Upload and Preview Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Status Messages */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Gagal Mengimpor</p>
                  <p className="text-xs leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Impor Berhasil</p>
                  <p className="text-xs leading-relaxed">{success}</p>
                </div>
              </div>
            )}

            {/* Drag & Drop Area */}
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 py-16 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                
                <h3 className="font-bold text-base text-foreground">
                  {loading ? 'Membaca Berkas...' : 'Unggah File Excel'}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Tarik dan lepas berkas Excel Anda di sini, atau <span className="text-primary font-semibold underline">pilih berkas</span> dari komputer.
                </p>
                <span className="mt-3 text-[10px] text-muted-foreground/60">Hanya format .xlsx atau .xls yang didukung.</span>
              </div>
            ) : (
              /* Selected file summary card */
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm truncate max-w-[240px] sm:max-w-[400px]">
                        {file.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB • {parsedStudents.length} baris terbaca
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleReset}
                    disabled={loading}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                    title="Ganti Berkas"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Validation summary bar */}
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    {parsedStudents.filter(s => s.isValid).length} Baris Valid
                  </div>
                  {hasErrors && (
                    <div className="flex items-center gap-1.5 text-destructive font-semibold">
                      <AlertCircle className="h-4 w-4" />
                      {parsedStudents.filter(s => !s.isValid).length} Baris Bermasalah
                    </div>
                  )}
                </div>

                {/* Preview Table */}
                {parsedStudents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Pratinjau Data Siswa</h5>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-border max-h-72 overflow-y-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-muted text-muted-foreground font-semibold border-b border-border sticky top-0">
                          <tr>
                            <th className="px-4 py-2">Baris</th>
                            <th className="px-4 py-2">Nama Lengkap</th>
                            <th className="px-4 py-2">NISN / NIS</th>
                            <th className="px-4 py-2">Gender</th>
                            <th className="px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {parsedStudents.map((student, idx) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="px-4 py-2 font-mono text-muted-foreground">
                                {student.rowNum}
                              </td>
                              <td className="px-4 py-2 font-semibold text-foreground">
                                {student.full_name || '-'}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground font-mono">
                                {student.nisn || '-'} / {student.nis || '-'}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">
                                {student.gender || '-'}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  student.isValid 
                                    ? 'bg-emerald-500/10 text-emerald-600' 
                                    : 'bg-destructive/10 text-destructive'
                                }`}>
                                  {student.isValid ? 'Valid' : 'Error'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Validation errors detail */}
                {hasErrors && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                      <AlertCircle className="h-4 w-4" />
                      Detail Kesalahan Validasi File:
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs">
                      {validationErrors.map((err, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          <span className="font-semibold text-foreground">Baris {err.row} ({err.studentName})</span>:
                          <ul className="list-disc list-inside ml-2 mt-0.5 space-y-0.5 text-destructive">
                            {err.errors.map((item, id) => <li key={id}>{item}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import Submission Control */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl h-10 px-4 font-semibold"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImportSubmit}
                    disabled={loading || hasErrors}
                    className="rounded-xl h-10 px-5 gap-2 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Mengimpor...
                      </>
                    ) : (
                      'Simpan Ke Database'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
