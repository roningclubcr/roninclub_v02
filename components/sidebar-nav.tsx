"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LogOut, Menu, X } from "lucide-react"
import { logout } from "@/app/(app)/actions"
import { navItems } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Navegacion principal">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-6 py-5">
      <div className="flex size-9 items-center justify-center rounded-md bg-primary font-mono text-lg font-bold text-primary-foreground">
        浪
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-sidebar-foreground">
          Ronin Club
        </p>
        <p className="text-xs text-muted-foreground">Sales Manager</p>
      </div>
    </div>
  )
}

function AccountArea({ userEmail }: { userEmail?: string }) {
  return (
    <div className="border-t border-sidebar-border p-3">
      {userEmail && (
        <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
          {userEmail}
        </p>
      )}
      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70"
        >
          <LogOut className="size-4" />
          Cerrar sesion
        </Button>
      </form>
    </div>
  )
}

export function SidebarNav({ userEmail }: { userEmail?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
        <Brand />
        <div className="flex-1 overflow-y-auto pb-6">
          <NavLinks />
        </div>
        <AccountArea userEmail={userEmail} />
      </aside>

      <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary font-mono text-base font-bold text-primary-foreground">
            浪
          </div>
          <span className="text-sm font-semibold">Ronin Club</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Cerrar menu" : "Abrir menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
            <Brand />
            <div className="flex-1 overflow-y-auto pb-6">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <AccountArea userEmail={userEmail} />
          </div>
        </div>
      )}
    </>
  )
}
