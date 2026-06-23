import { supabase } from "@/lib/supabase/client"
import type {
  Character,
  CharacterInput,
  Color,
  ColorInput,
  Design,
  DesignInput,
  Size,
  SizeInput,
} from "@/lib/types"

function handleSupabaseError(action: string, table: string, error: { message: string }): never {
  console.error(`Supabase error al ${action} ${table}`, error)
  throw new Error(error.message)
}

export async function fetchCharacters(): Promise<Character[]> {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) handleSupabaseError("cargar", "characters", error)
  return (data ?? []) as Character[]
}

export async function createCharacter(input: CharacterInput): Promise<Character> {
  const { data, error } = await supabase
    .from("characters")
    .insert(input)
    .select()
    .single()

  if (error) handleSupabaseError("crear", "characters", error)
  return data as Character
}

export async function updateCharacter(
  id: string,
  input: CharacterInput,
): Promise<Character> {
  const { data, error } = await supabase
    .from("characters")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) handleSupabaseError("actualizar", "characters", error)
  return data as Character
}

export async function deleteCharacter(id: string): Promise<void> {
  const { error } = await supabase.from("characters").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", "characters", error)
}

export async function fetchDesigns(): Promise<Design[]> {
  const { data, error } = await supabase
    .from("designs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) handleSupabaseError("cargar", "designs", error)
  return (data ?? []) as Design[]
}

export async function createDesign(input: DesignInput): Promise<Design> {
  const { data, error } = await supabase
    .from("designs")
    .insert(input)
    .select()
    .single()

  if (error) handleSupabaseError("crear", "designs", error)
  return data as Design
}

export async function updateDesign(
  id: string,
  input: DesignInput,
): Promise<Design> {
  const { data, error } = await supabase
    .from("designs")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) handleSupabaseError("actualizar", "designs", error)
  return data as Design
}

export async function deleteDesign(id: string): Promise<void> {
  const { error } = await supabase.from("designs").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", "designs", error)
}

export async function fetchColors(): Promise<Color[]> {
  const { data, error } = await supabase
    .from("colors")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) handleSupabaseError("cargar", "colors", error)
  return (data ?? []) as Color[]
}

export async function createColor(input: ColorInput): Promise<Color> {
  const { data, error } = await supabase
    .from("colors")
    .insert(input)
    .select()
    .single()

  if (error) handleSupabaseError("crear", "colors", error)
  return data as Color
}

export async function updateColor(id: string, input: ColorInput): Promise<Color> {
  const { data, error } = await supabase
    .from("colors")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) handleSupabaseError("actualizar", "colors", error)
  return data as Color
}

export async function deleteColor(id: string): Promise<void> {
  const { error } = await supabase.from("colors").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", "colors", error)
}

export async function fetchSizes(): Promise<Size[]> {
  const { data, error } = await supabase
    .from("sizes")
    .select("*")
    .order("name", { ascending: true })

  if (error) handleSupabaseError("cargar", "sizes", error)
  return (data ?? []) as Size[]
}

export async function createSize(input: SizeInput): Promise<Size> {
  const { data, error } = await supabase
    .from("sizes")
    .insert(input)
    .select()
    .single()

  if (error) handleSupabaseError("crear", "sizes", error)
  return data as Size
}

export async function updateSize(id: string, input: SizeInput): Promise<Size> {
  const { data, error } = await supabase
    .from("sizes")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) handleSupabaseError("actualizar", "sizes", error)
  return data as Size
}

export async function deleteSize(id: string): Promise<void> {
  const { error } = await supabase.from("sizes").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", "sizes", error)
}
