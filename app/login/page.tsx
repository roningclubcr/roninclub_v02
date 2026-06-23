import { redirect } from "next/navigation"
import { LoginForm } from "@/app/login/login-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function LoginPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (data?.claims) {
    redirect("/")
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-primary font-mono text-xl font-bold text-primary-foreground">
            浪
          </div>
          <div>
            <p className="text-lg font-semibold">Ronin Club</p>
            <p className="text-sm text-muted-foreground">Sales Manager</p>
          </div>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Acceso administrativo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ingresa con el usuario creado en Supabase Auth.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
