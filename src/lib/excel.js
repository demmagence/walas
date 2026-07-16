import * as XLSX from 'xlsx'

// Columns layout structure for student import template
export const IMPORT_COLUMNS = [
  { header: 'Nama Lengkap', key: 'full_name', required: true, example: 'Ahmad Fauzi' },
  { header: 'NISN', key: 'nisn', required: false, example: '0081234567' },
  { header: 'NIS', key: 'nis', required: false, example: '21221015' },
  { header: 'Jenis Kelamin', key: 'gender', required: true, example: 'laki-laki' },
  { header: 'Tempat Lahir', key: 'birth_place', required: false, example: 'Bandung' },
  { header: 'Tanggal Lahir', key: 'birth_date', required: false, example: '2008-05-15' },
  { header: 'Agama', key: 'religion', required: false, example: 'Islam' },
  { header: 'No. Telepon', key: 'phone', required: false, example: '081234567890' },
  { header: 'Alamat', key: 'address', required: false, example: 'Jl. Merdeka No. 10, Bandung' }
]

/**
 * Downloads a template Excel file for importing students into a specific class.
 * @param {string} className 
 */
export function downloadImportTemplate(className) {
  const headers = IMPORT_COLUMNS.map(col => col.header)
  const exampleRow = IMPORT_COLUMNS.reduce((acc, col) => {
    acc[col.header] = col.example
    return acc
  }, {})

  const worksheet = XLSX.utils.json_to_sheet([exampleRow], { header: headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa')

  // Generate and download
  const filename = `template_import_siswa_${className.replace(/\s+/g, '_').toLowerCase()}.xlsx`
  XLSX.writeFile(workbook, filename)
}

/**
 * Parses uploaded Excel file to JSON and maps it to target fields.
 * Performs basic local format validation.
 * @param {File} file 
 * @returns {Promise<{data: Array, errors: Array}>}
 */
export function parseImportExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert sheet to JSON array
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        
        const parsedData = []
        const validationErrors = []

        rawRows.forEach((row, index) => {
          const rowNum = index + 2 // Row 1 is header
          const mappedRecord = {}
          const rowErrors = []

          IMPORT_COLUMNS.forEach(col => {
            // Find key by matching header name in row
            const rawValue = row[col.header] !== undefined ? String(row[col.header]).trim() : ''
            
            // Validation: Required check
            if (col.required && !rawValue) {
              rowErrors.push(`Kolom "${col.header}" wajib diisi.`)
            }

            // Validation: Gender check
            if (col.key === 'gender' && rawValue) {
              const cleanGender = rawValue.toLowerCase()
              if (cleanGender !== 'laki-laki' && cleanGender !== 'perempuan') {
                rowErrors.push(`Gender "${rawValue}" tidak valid (gunakan "laki-laki" atau "perempuan").`)
              }
              mappedRecord[col.key] = cleanGender
            } 
            // Validation: NISN length check
            else if (col.key === 'nisn' && rawValue) {
              if (!/^\d{10}$/.test(rawValue)) {
                rowErrors.push(`NISN "${rawValue}" tidak valid (harus 10 digit angka).`)
              }
              mappedRecord[col.key] = rawValue
            }
            // Validation: NIS check (numeric check)
            else if (col.key === 'nis' && rawValue) {
              if (!/^\d+$/.test(rawValue)) {
                rowErrors.push(`NIS "${rawValue}" tidak valid (harus berisi angka).`)
              }
              mappedRecord[col.key] = rawValue
            }
            // Validation: Date format check (YYYY-MM-DD)
            else if (col.key === 'birth_date' && rawValue) {
              // Try parsing or match regex YYYY-MM-DD
              const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
              if (!isIsoDate) {
                rowErrors.push(`Format Tanggal Lahir "${rawValue}" salah (gunakan YYYY-MM-DD).`)
              }
              mappedRecord[col.key] = rawValue
            } else {
              mappedRecord[col.key] = rawValue || null
            }
          })

          if (rowErrors.length > 0) {
            validationErrors.push({ row: rowNum, studentName: row['Nama Lengkap'] || `Baris ${rowNum}`, errors: rowErrors })
          }

          parsedData.push({
            rowNum,
            ...mappedRecord,
            isValid: rowErrors.length === 0
          })
        })

        resolve({ data: parsedData, errors: validationErrors })
      } catch (err) {
        reject(new Error('Gagal membaca berkas Excel: ' + err.message))
      }
    }

    reader.onerror = () => {
      reject(new Error('Gagal membaca file.'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Exports current student directory list to Excel.
 * @param {Array} students 
 * @param {string} className 
 */
export function exportStudentListToExcel(students, className) {
  const dataToExport = students.map((s, idx) => ({
    'No': idx + 1,
    'Nama Lengkap': s.full_name,
    'NISN': s.nisn || '-',
    'NIS': s.nis || '-',
    'Jenis Kelamin': s.gender || '-',
    'No. HP': s.phone || '-',
    'Alamat': s.address || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Siswa')

  // Auto-fit column widths
  const maxProps = [{ wch: 4 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }]
  worksheet['!cols'] = maxProps

  const filename = `data_siswa_${className.replace(/\s+/g, '_').toLowerCase()}.xlsx`
  XLSX.writeFile(workbook, filename)
}
