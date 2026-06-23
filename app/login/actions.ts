"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export interface LoginState {
  error: string | null
}

function loginErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes("invalid login credentials")) {
    return "Correo o contrasena incorrectos."
  }

  if (normalized.includes("email not confirmed")) {
    return "El correo todavia no ha sido confirmado en Supabase Auth."
  }

  if (normalized.includes("too many requests")) {
    return "Demasiados intentos. Espera un momento antes de volver a intentar."
  }

  return "No fue posible iniciar sesion. Verifica tus datos e intenta de nuevo."
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Correo y contrasena son obligatorios." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error("Supabase Auth error al iniciar sesion", error)
    return { error: loginErrorMessage(error.message) }
  }

  redirect("/")
}
