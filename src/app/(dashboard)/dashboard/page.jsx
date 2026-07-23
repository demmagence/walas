import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Users, 
  ClipboardList, 
  GraduationCap, 
  ArrowRight,
  TrendingUp,
  School,
  CheckCircle,
  Calendar,
  AlertCircle
} from "lucide-react"

export const metadata = {
  title: "Beranda - Walas SMK",
  description: "Halaman beranda dashboard Walas",
}

export default async function BerandaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  const { role, full_name } = profile

  // ==========================================
  // WALI KELAS VIEW LOGIC
  // ==========================================
  if (role === "wali_kelas") {
    const { data: activeClass } = await supabase
      .from("classes")
      .select("id, name, department_id, academic_year_id")
      .eq("homeroom_teacher", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let activeClassName = ""
    let departmentName = ""
    let academicYearName = ""
    let totalStudents = 0
    let attendanceToday = { hadir: 0, sakit: 0, izin: 0, alpha: 0 }
    let classAverage = null

    if (activeClass) {
      activeClassName = activeClass.name

      // Fetch metadata details safely
      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", activeClass.department_id)
        .single()
      if (dept) departmentName = dept.name

      const { data: ay } = await supabase
        .from("academic_years")
        .select("name")
        .eq("id", activeClass.academic_year_id)
        .single()
      if (ay) academicYearName = ay.name

      // Count students in class
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("class_id", activeClass.id)
      totalStudents = count || 0

      // Fetch student IDs
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", activeClass.id)

      const studentIds = students?.map((s) => s.id) || []

      if (studentIds.length > 0) {
        // Today's attendance
        const today = new Date().toISOString().split("T")[0]
        const { data: attendances } = await supabase
          .from("attendances")
          .select("status")
          .in("student_id", studentIds)
          .eq("date", today)

        if (attendances) {
          attendances.forEach((att) => {
            if (att.status in attendanceToday) {
              attendanceToday[att.status]++
            }
          })
        }

        // Class average grade
        const { data: grades } = await supabase
          .from("grades")
          .select("score")
          .in("student_id", studentIds)

        if (grades && grades.length > 0) {
          const sum = grades.reduce((acc, curr) => acc + Number(curr.score), 0)
          classAverage = (sum / grades.length).toFixed(1)
        }
      }
    }

    return (
      <div className="px-4 py-6 md:px-8 md:py-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Selamat Datang, {full_name || "Wali Kelas"}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Role: <span className="font-semibold text-primary">Wali Kelas</span> {activeClass && `- Kelas ${activeClassName} (${departmentName})`}
          </p>
        </div>

        {activeClass ? (
          <>
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-xl bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Total Siswa</span>
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-foreground">{totalStudents}</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">Tahun Ajaran: {academicYearName}</p>
              </div>

              <div className="rounded-xl bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Hadir Hari Ini</span>
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-primary">{attendanceToday.hadir}</p>
                <p className="text-[10px] text-muted-foreground mt-1">S: {attendanceToday.sakit} | I: {attendanceToday.izin} | A: {attendanceToday.alpha}</p>
              </div>

              <div className="rounded-xl bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Rata-rata Nilai</span>
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-foreground">{classAverage || "-"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Akumulasi semua mapel</p>
              </div>

              <div className="rounded-xl bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Tingkat / Kelas</span>
                  <School className="h-5 w-5 text-accent" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-foreground">{activeClassName}</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{departmentName}</p>
              </div>
            </div>

            {/* Quick Navigation / Actions */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Akses Cepat Modul</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/absensi"
                  className="group flex items-center justify-between rounded-xl bg-card p-5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Isi Absensi Harian</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Catat kehadiran siswa hari ini</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/dashboard/siswa"
                  className="group flex items-center justify-between rounded-xl bg-card p-5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Kelola Biodata Siswa</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Lihat biodata lengkap siswa kelas Anda</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card p-8 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold text-foreground">Kelas Belum Ditugaskan</h2>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Akun Anda belum dikaitkan dengan kelas manapun untuk tahun ajaran aktif ini. Silakan hubungi Administrator sekolah.
            </p>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // ORANG TUA VIEW LOGIC
  // ==========================================
  if (role === "orang_tua") {
    // Fetch parent's children
    const { data: children } = await supabase
      .from("students")
      .select("id, full_name, nisn, nis, class_id")
      .eq("parent_user_id", user.id)

    const childrenData = []
    if (children && children.length > 0) {
      for (const child of children) {
        let childClass = null
        let childDept = null

        if (child.class_id) {
          const { data: cl } = await supabase
            .from("classes")
            .select("name, department_id")
            .eq("id", child.class_id)
            .single()
          if (cl) {
            childClass = cl.name
            const { data: dp } = await supabase
              .from("departments")
              .select("name")
              .eq("id", cl.department_id)
              .single()
            if (dp) childDept = dp.name
          }
        }

        // Monthly attendance percentage calculation
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        const startOfMonthStr = startOfMonth.toISOString().split("T")[0]

        const { data: attendances } = await supabase
          .from("attendances")
          .select("status")
          .eq("student_id", child.id)
          .gte("date", startOfMonthStr)

        let totalDays = attendances?.length || 0
        let presentDays = attendances?.filter((a) => a.status === "hadir").length || 0
        let attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : "-"

        // Academic average score
        const { data: grades } = await supabase
          .from("grades")
          .select("score")
          .eq("student_id", child.id)

        let totalSubjects = grades?.length || 0
        let childAverage = null
        if (grades && grades.length > 0) {
          const sum = grades.reduce((acc, curr) => acc + Number(curr.score), 0)
          childAverage = (sum / grades.length).toFixed(1)
        }

        childrenData.push({
          ...child,
          className: childClass || "Belum Masuk Kelas",
          deptName: childDept || "-",
          attendancePercentage,
          totalSubjects,
          childAverage: childAverage || "-",
        })
      }
    }

    return (
      <div className="px-4 py-6 md:px-8 md:py-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Selamat Datang, {full_name || "Orang Tua"}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Role: <span className="font-semibold text-primary">Orang Tua / Wali</span>
          </p>
        </div>

        {childrenData.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">Pemantauan Akademik Anak</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {childrenData.map((child) => (
                <div key={child.id} className="rounded-xl bg-card p-6 space-y-6">
                  {/* Child header */}
                  <div className="pb-4">
                    <h3 className="text-lg font-bold text-foreground">{child.full_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">NISN: {child.nisn || "-"} | NIS: {child.nis || "-"}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                        Kelas {child.className}
                      </span>
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent truncate max-w-[150px]">
                        {child.deptName}
                      </span>
                    </div>
                  </div>

                  {/* Child Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-secondary p-4 text-center">
                      <div className="flex justify-center mb-1 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">Kehadiran Bulan Ini</span>
                      <p className="mt-1 text-2xl font-bold text-foreground">{child.attendancePercentage}%</p>
                    </div>

                    <div className="rounded-lg bg-secondary p-4 text-center">
                      <div className="flex justify-center mb-1 text-accent">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">Rata-rata Nilai</span>
                      <p className="mt-1 text-2xl font-bold text-foreground">{child.childAverage}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{child.totalSubjects} Mata Pelajaran</p>
                    </div>
                  </div>

                  {/* Redirection Links */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Link
                      href="/dashboard/absensi"
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      Detail Absensi
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href="/dashboard/nilai"
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      Detail Nilai
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card p-8 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold text-foreground">Siswa Belum Terhubung</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Belum ada data siswa aktif yang tertaut dengan akun orang tua Anda. Silakan hubungi Administrator sekolah dengan menyerahkan NISN siswa untuk menautkan akun Anda.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Fallback for unauthorized roles
  return redirect("/login")
}
