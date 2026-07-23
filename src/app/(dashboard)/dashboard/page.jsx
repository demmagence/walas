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
  title: "Beranda — Walas SMK",
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

  // Use JWT metadata instead of querying profiles table (layout already verified auth)
  const role = user.user_metadata?.role
  const full_name = user.user_metadata?.full_name

  // ==========================================
  // WALI KELAS VIEW LOGIC
  // ==========================================
  if (role === "wali_kelas") {
    // Use Supabase joins to fetch class + department + academic year in one query
    const { data: activeClass } = await supabase
      .from("classes")
      .select(`
        id, name,
        departments ( name ),
        academic_years ( name )
      `)
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
      departmentName = activeClass.departments?.name || ""
      academicYearName = activeClass.academic_years?.name || ""

      // Fetch students (needed for count + IDs for further queries)
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", activeClass.id)

      totalStudents = students?.length || 0
      const studentIds = students?.map((s) => s.id) || []

      if (studentIds.length > 0) {
        // Fetch attendance and grades in PARALLEL instead of sequential
        const today = new Date().toISOString().split("T")[0]
        const [attendanceResult, gradesResult] = await Promise.all([
          supabase
            .from("attendances")
            .select("status")
            .in("student_id", studentIds)
            .eq("date", today),
          supabase
            .from("grades")
            .select("score")
            .in("student_id", studentIds),
        ])

        const attendances = attendanceResult.data
        if (attendances) {
          attendances.forEach((att) => {
            if (att.status in attendanceToday) {
              attendanceToday[att.status]++
            }
          })
        }

        const grades = gradesResult.data
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
            Role: <span className="font-semibold text-primary">Wali Kelas</span> {activeClass && `— Kelas ${activeClassName} (${departmentName})`}
          </p>
        </div>

        {activeClass ? (
          <>
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Total Siswa</span>
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-foreground">{totalStudents}</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">Tahun Ajaran: {academicYearName}</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Hadir Hari Ini</span>
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-primary">{attendanceToday.hadir}</p>
                <p className="text-[10px] text-muted-foreground mt-1">S: {attendanceToday.sakit} | I: {attendanceToday.izin} | A: {attendanceToday.alpha}</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Rata-rata Nilai</span>
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-foreground">{classAverage || "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Akumulasi semua mapel</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
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
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-all"
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
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:border-accent/40 transition-all"
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold text-foreground">Kelas Belum Ditugaskan</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Akun Anda belum terdaftar sebagai wali kelas aktif pada semester ini. Silakan hubungi Administrator untuk memperbarui kelas binaan Anda.
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

    // Fetch all children data in PARALLEL instead of sequential loop
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0]
    const childIds = children?.map((c) => c.id) || []

    // Batch fetch classes (with department join), attendances, and grades for ALL children
    const classIds = [...new Set(children?.map((c) => c.class_id).filter(Boolean) || [])]
    const [classesResult, attendancesResult, gradesResult] = await Promise.all([
      classIds.length > 0
        ? supabase
            .from("classes")
            .select("id, name, departments ( name )")
            .in("id", classIds)
        : { data: [] },
      childIds.length > 0
        ? supabase
            .from("attendances")
            .select("student_id, status")
            .in("student_id", childIds)
            .gte("date", startOfMonthStr)
        : { data: [] },
      childIds.length > 0
        ? supabase
            .from("grades")
            .select("student_id, score")
            .in("student_id", childIds)
        : { data: [] },
    ])

    // Build lookup maps
    const classMap = new Map()
    classesResult.data?.forEach((cl) => classMap.set(cl.id, cl))

    const childrenData = (children || []).map((child) => {
      const cl = classMap.get(child.class_id)
      const childClass = cl?.name || null
      const childDept = cl?.departments?.name || null

      const childAttendances = attendancesResult.data?.filter((a) => a.student_id === child.id) || []
      const totalDays = childAttendances.length
      const presentDays = childAttendances.filter((a) => a.status === "hadir").length
      const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : "—"

      const childGrades = gradesResult.data?.filter((g) => g.student_id === child.id) || []
      const totalSubjects = childGrades.length
      let childAverage = null
      if (childGrades.length > 0) {
        const sum = childGrades.reduce((acc, curr) => acc + Number(curr.score), 0)
        childAverage = (sum / childGrades.length).toFixed(1)
      }

      return {
        ...child,
        className: childClass || "Belum Masuk Kelas",
        deptName: childDept || "—",
        attendancePercentage,
        totalSubjects,
        childAverage: childAverage || "—",
      }
    })

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
                <div key={child.id} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
                  {/* Child header */}
                  <div className="border-b border-border/50 pb-4">
                    <h3 className="text-lg font-bold text-foreground">{child.full_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">NISN: {child.nisn || "—"} | NIS: {child.nis || "—"}</p>
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
                    <div className="rounded-lg bg-secondary p-4 text-center border border-border/50">
                      <div className="flex justify-center mb-1 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">Kehadiran Bulan Ini</span>
                      <p className="mt-1 text-2xl font-bold text-foreground">{child.attendancePercentage}%</p>
                    </div>

                    <div className="rounded-lg bg-secondary p-4 text-center border border-border/50">
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
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      Detail Absensi
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href="/dashboard/nilai"
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 py-16 text-center">
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
