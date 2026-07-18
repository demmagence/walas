"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  School,
  FolderTree,
  Calendar,
  Users,
  ShieldAlert,
  LogOut
} from "lucide-react"
import { signOut } from "@/lib/auth"

const adminNavItems = [
  {
    label: "Kelas",
    href: "/admin/kelas",
    icon: School,
  },
  {
    label: "Jurusan",
    href: "/admin/jurusan",
    icon: FolderTree,
  },
  {
    label: "Tahun Ajaran",
    href: "/admin/tahun-ajaran",
    icon: Calendar,
  },
  {
    label: "Pengguna",
    href: "/admin/pengguna",
    icon: Users,
  },
]

export default function AdminNavClient() {
  const pathname = usePathname()

  const handleClientSignOut = async () => {
    await signOut()
    window.location.href = "/login"
  }

  return (
    <>
      {/* ===== MOBILE BOTTOM NAV (< md) ===== */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "border-t border-border bg-card/95 backdrop-blur-lg",
          "pb-[env(safe-area-inset-bottom)]"
        )}
        role="navigation"
        aria-label="Menu navigasi admin mobile"
      >
        <ul className="flex items-center justify-around px-1 pt-1.5 pb-1.5">
          {adminNavItems.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 rounded-xl px-1.5 min-[360px]:px-2.5 min-[400px]:px-3.5 py-1.5 text-[11px] font-medium transition-all duration-200",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full p-1.5 transition-all duration-200",
                      active
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-inherit"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        active && "scale-110"
                      )}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </span>
                  <span
                    className={cn(
                      "transition-all duration-200 text-[10px] min-[360px]:text-[11px] whitespace-nowrap",
                      active && "font-semibold"
                    )}
                  >
                    {item.label === "Tahun Ajaran" ? "T. Ajaran" : item.label}
                  </span>
                </Link>
              </li>
            )
          })}
          {/* Mobile Log Out */}
          <li>
            <button
              onClick={handleClientSignOut}
              className="flex flex-col items-center gap-0.5 rounded-xl px-1.5 min-[360px]:px-2.5 min-[400px]:px-3.5 py-1.5 text-[11px] font-medium text-destructive transition-all duration-200"
            >
              <span className="flex items-center justify-center rounded-full p-1.5">
                <LogOut className="h-5 w-5" />
              </span>
              <span className="text-[10px] min-[360px]:text-[11px] whitespace-nowrap">Keluar</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* ===== DESKTOP SIDEBAR (>= md) ===== */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col",
          "fixed top-0 left-0 bottom-0 z-40 w-64",
          "border-r border-sidebar-border bg-sidebar"
        )}
        role="navigation"
        aria-label="Menu navigasi admin samping"
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">
              Walas Admin
            </h1>
            <p className="text-[11px] text-muted-foreground leading-none">
              Panel Pengelola Sistem
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {adminNavItems.map((item) => {
              const active = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-primary/10 text-primary shadow-sm border border-primary/15"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon
                      className="h-[18px] w-[18px] flex-shrink-0"
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-accent shadow-sm" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-[10px] text-muted-foreground text-center">
            © 2026 Walas Admin
          </p>
        </div>
      </aside>
    </>
  )
}
