import { createClient } from "@/lib/supabase/server"
import AdminPenggunaClient from "./admin-pengguna-client"

export const metadata = {
  title: "Manajemen Pengguna - Walas SMK",
  description: "Kelola peran pengguna dan tautkan wali siswa",
}

export default async function AdminPenggunaPage() {
  const supabase = await createClient()


  // Fetch users list via RPC function
  const { data: users, error: rpcError } = await supabase.rpc("get_users_list")
  if (rpcError) {
    console.error("Error executing RPC get_users_list:", rpcError)
  }

  // Fetch students list for parenting links
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, parent_user_id")
    .order("full_name", { ascending: true })

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Manajemen Pengguna
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola peran akses pengguna dan tautkan akun Orang Tua ke data profil siswa
        </p>
      </div>

      <AdminPenggunaClient
        initialUsers={users || []}
        students={students || []}
      />
    </div>
  )
}
