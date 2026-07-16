"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  ClipboardList,
  GraduationCap,
  UserCircle,
} from "lucide-react"

const navItems = [
  {
    label: "Beranda",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Siswa",
    href: "/dashboard/siswa",
    icon: Users,
  },
  {
    label: "Absensi",
    href: "/dashboard/absensi",
    icon: ClipboardList,
  },
  {
    label: "Nilai",
    href: "/dashboard/nilai",
    icon: GraduationCap,
  },
  {
    label: "Profil",
    href: "/dashboard/profil",
    icon: UserCircle,
  },
]

function isActive(pathname, href) {
  if (href === "/dashboard") {
    return pathname === "/dashboard"
  }
  return pathname.startsWith(href)
}

export default function DashboardNav() {
  const pathname = usePathname()

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
        aria-label="Menu navigasi utama"
      >
        <ul className="flex items-center justify-around px-1 pt-1.5 pb-1.5">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
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
                      "transition-all duration-200",
                      active && "font-semibold"
                    )}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute -top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </Link>
              </li>
            )
          })}
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
        aria-label="Menu navigasi samping"
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">
              Walas
            </h1>
            <p className="text-[11px] text-muted-foreground leading-none">
              Manajemen Wali Kelas
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href)
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
            © 2026 Walas SMK
          </p>
        </div>
      </aside>
    </>
  )
}
