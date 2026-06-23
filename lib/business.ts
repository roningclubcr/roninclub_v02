import { supabase } from "@/lib/supabase/client"
import type {
  Expense,
  ExpenseInput,
  InventoryInput,
  InventoryItem,
  Payment,
  PaymentInput,
  Sale,
  SaleInput,
} from "@/lib/types"

function handleSupabaseError(action: string, table: string, error: { message: string }): never {
  console.error(`Supabase error al ${action} ${table}`, error)
  throw new Error(error.message)
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) handleSupabaseError("cargar", "inventory", error)
  return (data ?? []) as InventoryItem[]
}

export async function createInventoryItem(input: InventoryInput): Promise<InventoryItem> {
  const { data, error } = await supabase.from("inventory").insert(input).select().single()
  if (error) handleSupabaseError("crear", "inventory", error)
  return data as InventoryItem
}

export async function updateInventoryItem(id: string, input: InventoryInput): Promise<InventoryItem> {
  const { data, error } = await supabase.from("inventory").update(input).eq("id", id).select().single()
  if (error) handleSupabaseError("actualizar", "inventory", error)
  return data as InventoryItem
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await supabase.from("inventory").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", "inventory", error)
}

export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) handleSupabaseError("cargar", "sales", error)
  return (data ?? []) as Sale[]
}

export async function createSale(input: SaleInput): Promise<Sale> {
  const { data, error } = await supabase.from("sales").insert(input).select().single()
  if (error) handleSupabaseError("crear", "sales", error)
  return data as Sale
}

export async function updateSale(id: string, input: SaleInput): Promise<Sale> {
  const { data, error } = await supabase.from("sales").update(input).eq("id", id).select().single()
  if (error) handleSupabaseError("actualizar", "sales", error)
  return data as Sale
}

export async function deleteSale(id: string): Promise<void> {
  const { error } = await supabase.from("sales").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", "sales", error)
}

export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("payment_date", { ascending: false })

  if (error) handleSupabaseError("cargar", "payments", error)
  return (data ?? []) as Payment[]
}

export async function createPayment(input: PaymentInput): Promise<Payment> {
  const { data, error } = await supabase.from("payments").insert(input).select().single()
  if (error) handleSupabaseError("crear", "payments", error)
  return data as Payment
}

export async function updatePayment(id: string, input: PaymentInput): Promise<Payment> {
  const { data, error } = await supabase.from("payments").update(input).eq("id", id).select().single()
  if (error) handleSupabaseError("actualizar", "payments", error)
  return data as Payment
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", "payments", error)
}

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })

  if (error) handleSupabaseError("cargar", "expenses", error)
  return (data ?? []) as Expense[]
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase.from("expenses").insert(input).select().single()
  if (error) handleSupabaseError("crear", "expenses", error)
  return data as Expense
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase.from("expenses").update(input).eq("id", id).select().single()
  if (error) handleSupabaseError("actualizar", "expenses", error)
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id)
  if (error) handleSupabaseError("eliminar", "expenses", error)
}
