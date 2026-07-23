import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

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
export function exportStudentRaporPDF({ student = {}, grades = [] }) {
  try {
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
    doc.text(`Nama Lengkap  :  ${student.full_name || "-"}`, 15, currentY)
    doc.text(`NISN / NIS      :  ${student.nisn || "-"} / ${student.nis || "-"}`, 15, currentY + 5)
    doc.text(`Kelas              :  ${student.classes?.name || "Belum ditentukan"}`, 15, currentY + 10)
    
    // Right Details Column
    const academicYearName = grades[0]?.academic_years?.name || "Tahun Ajaran Aktif"
    doc.text(`Tahun Ajaran  :  ${academicYearName}`, 120, currentY)
    doc.text(`Semester       :  Semester ${grades[0]?.semester || "1"}`, 120, currentY + 5)
    
    currentY += 18

    // 4. Grades Table
    const tableData = grades.map((g, idx) => {
      const scoreNum = parseFloat(g.score)
      const scoreStr = (g.score !== null && g.score !== undefined) ? String(g.score) : "-"
      const gradeLetter = !isNaN(scoreNum) ? (scoreNum >= 85 ? "A" : scoreNum >= 75 ? "B" : scoreNum >= 60 ? "C" : "D") : "-"
      const status = !isNaN(scoreNum) ? (scoreNum >= 75 ? "TUNTAS" : "BELUM TUNTAS") : "-"
      return [
        String(idx + 1),
        String(g.subjects?.name || "Mata Pelajaran"),
        scoreStr,
        gradeLetter,
        status
      ]
    })

    autoTable(doc, {
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
      const validGrades = grades.filter(g => g.score !== null && g.score !== undefined && !isNaN(parseFloat(g.score)))
      if (validGrades.length > 0) {
        const total = validGrades.reduce((sum, g) => sum + parseFloat(g.score), 0)
        const avg = (total / validGrades.length).toFixed(2)
        
        currentY += 6
        doc.setFont("helvetica", "bold")
        doc.text(`Rata-rata Nilai: ${avg}`, 15, currentY)
      }
    }

    // 5. Signatures
    currentY += 15
    if (currentY > 240) {
      doc.addPage()
      currentY = 25
    }
    
    drawSignatureSection(doc, currentY, "Wali Kelas", true)

    // Save the PDF
    const studentName = String(student.full_name || "Siswa").replace(/\s+/g, "_")
    doc.save(`Rapor_${studentName}.pdf`)
  } catch (error) {
    console.error("Error generating Rapor PDF:", error)
    alert("Terjadi kesalahan saat membuat berkas PDF Rapor: " + error.message)
  }
}

export function exportAttendanceRekapPDF({ className = "Kelas", startDate, endDate, students = [], aggregates = {} }) {
  try {
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
        String(idx + 1),
        String(s.full_name || "Siswa"),
        String(s.nisn || "-"),
        String(stats.hadir || 0),
        String(stats.sakit || 0),
        String(stats.izin || 0),
        String(stats.alpha || 0),
        String(stats.total || 0),
        percentage
      ]
    })

    autoTable(doc, {
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

    const safeClassName = String(className || "Kelas").replace(/\s+/g, "_")
    doc.save(`Rekap_Kehadiran_Kelas_${safeClassName}.pdf`)
  } catch (error) {
    console.error("Error generating Attendance PDF:", error)
    alert("Terjadi kesalahan saat membuat berkas PDF Rekap Kehadiran: " + error.message)
  }
}

export function exportClassRaporRekapPDF({ className = "Kelas", academicYearName = "Tahun Ajaran", semester = "1", students = [], subjects = [], matrix = [] }) {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    })

    // 1. Kop Surat
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA", 148, 15, { align: "center" })
    doc.setFontSize(12)
    doc.text("SEKOLAH MENENGAH KEJURUAN (SMK) WALAS", 148, 21, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text("Jl. Pendidikan Raya No. 45, Jakarta Timur • Telp: (021) 87654321 • Email: info@smkwalas.sch.id", 148, 26, { align: "center" })
    
    doc.setLineWidth(1)
    doc.line(15, 29, 282, 29)
    doc.setLineWidth(0.5)
    doc.line(15, 30.5, 282, 30.5)

    let currentY = 37

    // 2. Title
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("REKAPITULASI NILAI RAPOR KELAS", 148, currentY, { align: "center" })
    currentY += 8

    // 3. Details
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Kelas          :  Kelas ${className || "-"}`, 15, currentY)
    doc.text(`Tahun Ajaran  :  ${academicYearName || "-"} | Semester ${semester || "1"}`, 15, currentY + 5)
    currentY += 12

    // 4. Matrix Table
    const tableHead = [
      ["No", "Nama Siswa", "NISN", ...subjects.map(s => String(s.name || "Mata Pelajaran")), "Rata-Rata", "Status"]
    ]

    const tableBody = matrix.map((m, idx) => {
      const studentName = String(m?.student?.full_name || "Siswa")
      const studentNisn = String(m?.student?.nisn || "-")
      const subjectScores = subjects.map(s => {
        const val = m?.scores ? m.scores[s.id] : null
        return (val !== null && val !== undefined) ? String(val) : "-"
      })
      const avgVal = (m?.average !== undefined && m?.average !== null) ? String(m.average) : "-"
      const numAvg = parseFloat(avgVal)
      const status = (!isNaN(numAvg) && numAvg >= 75) ? "TUNTAS" : (avgVal === "-" ? "-" : "BELUM TUNTAS")

      return [
        String(idx + 1),
        studentName,
        studentNisn,
        ...subjectScores,
        avgVal,
        status
      ]
    })

    autoTable(doc, {
      startY: currentY,
      head: tableHead,
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center"
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: "center"
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 45, halign: "left" },
        2: { cellWidth: 25 }
      },
      didDrawPage: (data) => {
        currentY = data.cursor.y
      }
    })

    // 5. Signatures
    currentY += 15
    if (currentY > 170) {
      doc.addPage()
      currentY = 25
    }

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Jakarta, ${formatIndonesianDate(new Date())}`, 240, currentY, { align: "center" })
    doc.text("Wali Kelas,", 240, currentY + 6, { align: "center" })
    doc.setFont("helvetica", "bold")
    doc.text("Wali Kelas", 240, currentY + 24, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text("NIP. ___________________", 240, currentY + 28, { align: "center" })

    const safeClassName = String(className || "Kelas").replace(/\s+/g, "_")
    doc.save(`Rekap_Nilai_Rapor_Kelas_${safeClassName}.pdf`)
  } catch (error) {
    console.error("Error generating Class Rapor PDF:", error)
    alert("Terjadi kesalahan saat membuat berkas PDF Rekap Nilai: " + error.message)
  }
}
