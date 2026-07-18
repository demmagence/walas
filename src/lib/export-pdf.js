
/**
 * Formats a date into a localized Indonesian date string.
 * @param {string|Date} dateVal 
 */
function formatIndonesianDate(dateVal) {
  const d = dateVal ? new Date(dateVal) : new Date()
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Draws a professional Kop Surat (School Header) on the PDF.
 * @param {jsPDF} doc 
 * @param {number} startY 
 */
function drawSchoolHeader(doc, startY = 15) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA", 105, startY, { align: "center" })
  
  doc.setFontSize(12)
  doc.text("SEKOLAH MENENGAH KEJURUAN (SMK) WALAS", 105, startY + 6, { align: "center" })
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Jl. Pendidikan Raya No. 45, Jakarta Timur • Telp: (021) 87654321 • Email: info@smkwalas.sch.id", 105, startY + 11, { align: "center" })
  
  // Double horizontal line divider
  doc.setLineWidth(1)
  doc.line(15, startY + 14, 195, startY + 14)
  doc.setLineWidth(0.5)
  doc.line(15, startY + 15.5, 195, startY + 15.5)
  
  return startY + 22
}

/**
 * Draws the signature section at the bottom of the PDF.
 * @param {jsPDF} doc 
 * @param {number} startY 
 * @param {string} teacherName 
 * @param {boolean} includeParentSignature 
 */
function drawSignatureSection(doc, startY, teacherName = "Wali Kelas", includeParentSignature = false) {
  const todayStr = formatIndonesianDate(new Date())
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  
  // Place date on the right
  doc.text(`Jakarta, ${todayStr}`, 155, startY, { align: "center" })
  
  if (includeParentSignature) {
    // Orang Tua/Wali (Left)
    doc.text("Mengetahui,", 45, startY + 5, { align: "center" })
    doc.text("Orang Tua / Wali Siswa,", 45, startY + 10, { align: "center" })
    doc.text("_________________________", 45, startY + 32, { align: "center" })
    
    // Wali Kelas (Right)
    doc.text("Wali Kelas,", 155, startY + 10, { align: "center" })
    doc.setFont("helvetica", "bold")
    doc.text(teacherName, 155, startY + 30, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text("NIP. ___________________", 155, startY + 34, { align: "center" })
  } else {
    // Single teacher signature (Right)
    doc.text("Wali Kelas,", 155, startY + 5, { align: "center" })
    doc.setFont("helvetica", "bold")
    doc.text(teacherName, 155, startY + 25, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text("NIP. ___________________", 155, startY + 29, { align: "center" })
  }
}

/**
 * Exports the Student Grade Report (Rapor) to PDF.
 */
export async function exportStudentRaporPDF({ student, grades }) {
  const { jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  })

  // 1. Kop Surat
  let currentY = drawSchoolHeader(doc, 15)

  // 2. Title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("LAPORAN HASIL BELAJAR SISWA (RAPOR)", 105, currentY, { align: "center" })
  currentY += 8

  // 3. Student Details Block
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  
  // Left Details Column
  doc.text(`Nama Lengkap  :  ${student.full_name}`, 15, currentY)
  doc.text(`NISN / NIS      :  ${student.nisn || "-"} / ${student.nis || "-"}`, 15, currentY + 5)
  doc.text(`Kelas              :  ${student.classes?.name || "Belum ditentukan"}`, 15, currentY + 10)
  
  // Right Details Column
  const academicYearName = grades[0]?.academic_years?.name || "Tahun Ajaran Aktif"
  doc.text(`Tahun Ajaran  :  ${academicYearName}`, 120, currentY)
  doc.text(`Semester       :  Semester ${grades[0]?.semester || "1"}`, 120, currentY + 5)
  
  currentY += 18

  // 4. Grades Table
  const tableData = grades.map((g, idx) => {
    const score = parseFloat(g.score)
    const gradeLetter = score >= 85 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D"
    const status = score >= 75 ? "TUNTAS" : "BELUM TUNTAS"
    return [
      idx + 1,
      g.subjects?.name || "Mata Pelajaran",
      g.score,
      gradeLetter,
      status
    ]
  })

  doc.autoTable({
    startY: currentY,
    head: [["No", "Mata Pelajaran", "Nilai", "Predikat", "Keterangan Kelulusan"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [16, 185, 129], // Emerald green primary color
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 45, halign: "center" }
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    didDrawPage: (data) => {
      currentY = data.cursor.y
    }
  })

  // Compute average score
  if (grades.length > 0) {
    const total = grades.reduce((sum, g) => sum + parseFloat(g.score), 0)
    const avg = (total / grades.length).toFixed(2)
    
    currentY += 6
    doc.setFont("helvetica", "bold")
    doc.text(`Rata-rata Nilai: ${avg}`, 15, currentY)
  }

  // 5. Signatures
  currentY += 15
  // Prevent overflow to next page for signatures if close to bottom
  if (currentY > 240) {
    doc.addPage()
    currentY = 25
  }
  
  drawSignatureSection(doc, currentY, "Wali Kelas", true)

  // Save the PDF
  doc.save(`Rapor_${student.full_name.replace(/\s+/g, "_")}.pdf`)
}

export async function exportAttendanceRekapPDF({ className, startDate, endDate, students, aggregates }) {
  const { jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  })

  // 1. Kop Surat
  let currentY = drawSchoolHeader(doc, 15)

  // 2. Title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("LAPORAN REKAPITULASI KEHADIRAN SISWA", 105, currentY, { align: "center" })
  currentY += 8

  // 3. Report Details Block
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Kelas          :  ${className === "all" ? "Semua Kelas" : className}`, 15, currentY)
  doc.text(`Periode      :  ${formatIndonesianDate(startDate)} s/d ${formatIndonesianDate(endDate)}`, 15, currentY + 5)
  
  currentY += 13

  // 4. Attendance Table
  const tableData = students.map((s, idx) => {
    const stats = aggregates[s.id] || { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 }
    const percentage = stats.total > 0 ? `${((stats.hadir / stats.total) * 100).toFixed(1)}%` : "-"
    return [
      idx + 1,
      s.full_name,
      s.nisn || "-",
      stats.hadir,
      stats.sakit,
      stats.izin,
      stats.alpha,
      stats.total,
      percentage
    ]
  })

  doc.autoTable({
    startY: currentY,
    head: [["No", "Nama Lengkap", "NISN", "H", "S", "I", "A", "Total", "Persentase H"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [16, 185, 129], // Emerald green
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 65 },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 12, halign: "center" },
      6: { cellWidth: 12, halign: "center" },
      7: { cellWidth: 15, halign: "center" },
      8: { cellWidth: 25, halign: "center" }
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5
    },
    didDrawPage: (data) => {
      currentY = data.cursor.y
    }
  })

  // 5. Signatures
  currentY += 18
  if (currentY > 240) {
    doc.addPage()
    currentY = 25
  }
  
  drawSignatureSection(doc, currentY, "Wali Kelas", false)

  doc.save(`Rekap_Kehadiran_Kelas_${className.replace(/\s+/g, "_")}.pdf`)
}
