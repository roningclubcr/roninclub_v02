import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect("/login")
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : undefined

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SidebarNav userEmail={email} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
