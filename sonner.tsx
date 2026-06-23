"use client"

import { useActionState } from "react"
import { LogIn } from "lucide-react"
import { login, type LoginState } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: LoginState = { error: null }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <form action={formAction} className="grid gap-4">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@roninclub.com"
          disabled={pending}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Contrasena</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={pending}
          required
        />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        <LogIn className="size-4" />
        {pending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  )
}
