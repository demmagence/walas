import { GraduationCap } from "lucide-react"

export const metadata = {
  title: "Nilai — Walas SMK",
  description: "Halaman pengelolaan nilai siswa",
}

export default function NilaiPage() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Nilai
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola dan lihat nilai siswa per mata pelajaran
        </p>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Segera Hadir
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Fitur pengelolaan nilai sedang dalam pengembangan. Anda akan
          dapat menginput dan melihat nilai siswa per mata pelajaran.
        </p>
      </div>
    </div>
  )
}
