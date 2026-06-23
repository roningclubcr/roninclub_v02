import { supabase } from "@/lib/supabase/client"
import type { Client, ClientInput } from "@/lib/types"

function handleSupabaseError(action: string, error: { message: string }): never {
  console.error(`Supabase error al ${action} clientes`, error)
  throw new Error(error.message)
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) handleSupabaseError("cargar", error)
  return (data ?? []) as Client[]
}

export async function fetchClientsCount(): Promise<number> {
  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })

  if (error) handleSupabaseError("contar", error)
  return count ?? 0
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert(input)
    .select()
    .single()

  if (error) handleSupabaseError("crear", error)
  return data as Client
}

export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) handleSupabaseError("actualizar", error)
  return data as Client
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", error)
}
