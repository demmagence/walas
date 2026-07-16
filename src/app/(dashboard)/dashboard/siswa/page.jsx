import { Users } from "lucide-react"

export const metadata = {
  title: "Siswa — Walas SMK",
  description: "Halaman daftar siswa",
}

export default function SiswaPage() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Data Siswa
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola data siswa di kelas Anda
        </p>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Users className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Segera Hadir
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Fitur pengelolaan data siswa sedang dalam pengembangan. Anda akan
          dapat melihat, menambah, dan mengedit data siswa di sini.
        </p>
      </div>
    </div>
  )
}
