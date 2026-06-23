"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react"
import type { Expense, ExpenseCategory, ExpenseInput, PaymentMethod } from "@/lib/types"
import { createExpense, deleteExpense, fetchExpenses, fetchSales, updateExpense } from "@/lib/business"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const none = "__none"
const all = "__all"
const categories: ExpenseCategory[] = ["camisas", "dtf", "empaque", "publicidad", "envios", "equipo", "software", "otro"]
const paymentMethods: PaymentMethod[] = ["sinpe", "efectivo", "transferencia", "tarjeta", "otro"]
const emptyForm: ExpenseInput = {
  expense_date: new Date().toISOString().slice(0, 10),
  category: "otro",
  description: "",
  amount: null,
  payment_method: "sinpe",
  supplier: "",
  sale_id: null,
  receipt_url: "",
  notes: "",
}

function toNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined) return "-"
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(value)
}

function inCurrentMonth(date: string | null) {
  if (!date) return false
  const now = new Date()
  const value = new Date(`${date}T00:00:00`)
  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth()
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export default function ExpensesPage() {
  const { data: expenses, error, isLoading, mutate } = useSWR("expenses", fetchExpenses)
  const { data: sales } = useSWR("sales", fetchSales)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(all)
  const [paymentMethod, setPaymentMethod] = useState(all)
  const [supplier, setSupplier] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const salesById = useMemo(() => new Map((sales ?? []).map((sale) => [sale.id, sale.sale_number ?? sale.id.slice(0, 8)])), [sales])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const supplierQuery = supplier.trim().toLowerCase()
    return (expenses ?? []).filter((expense) => {
      const date = expense.expense_date ?? ""
      return (
        (!q || [expense.description, expense.category, expense.payment_method, expense.supplier, expense.notes].join(" ").toLowerCase().includes(q)) &&
        (category === all || expense.category === category) &&
        (paymentMethod === all || expense.payment_method === paymentMethod) &&
        (!supplierQuery || (expense.supplier ?? "").toLowerCase().includes(supplierQuery)) &&
        (!dateFrom || date >= dateFrom) &&
        (!dateTo || date <= dateTo)
      )
    })
  }, [expenses, query, category, paymentMethod, supplier, dateFrom, dateTo])
  const filteredTotal = filtered.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)
  const monthTotal = (expenses ?? []).filter((expense) => inCurrentMonth(expense.expense_date)).reduce((sum, expense) => sum + (expense.amount ?? 0), 0)

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(editing ? {
      expense_date: editing.expense_date,
      category: editing.category ?? "otro",
      description: editing.description ?? "",
      amount: editing.amount,
      payment_method: editing.payment_method ?? "sinpe",
      supplier: editing.supplier ?? "",
      sale_id: editing.sale_id,
      receipt_url: editing.receipt_url ?? "",
      notes: editing.notes ?? "",
    } : emptyForm)
  }, [open, editing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setFormError(null)
    if (!form.description.trim() || !form.amount) {
      const message = "Descripcion y monto son obligatorios"
      setFormError(message)
      toast.error(message)
      return
    }
    const payload: ExpenseInput = {
      ...form,
      category: form.category || "otro",
      description: form.description.trim(),
      payment_method: form.payment_method || "sinpe",
      supplier: form.supplier?.trim() || null,
      receipt_url: form.receipt_url?.trim() || null,
      notes: form.notes?.trim() || null,
    }
    setSaving(true)
    try {
      if (editing) {
        await updateExpense(editing.id, payload)
        toast.success("Gasto actualizado")
      } else {
        await createExpense(payload)
        toast.success("Gasto registrado")
      }
      setOpen(false)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al guardar el gasto")
      console.error("Error al guardar gasto", err)
      setFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteError(null)
    setSaving(true)
    try {
      await deleteExpense(deleting.id)
      toast.success("Gasto eliminado")
      setDeleting(null)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al eliminar el gasto")
      console.error("Error al eliminar gasto", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Gastos" description="Registra y filtra gastos del negocio." action={<Button onClick={() => { setEditing(null); setOpen(true) }}><Plus className="size-4" />Nuevo gasto</Button>} />
      <div className="mb-4 grid gap-3 lg:grid-cols-[1.2fr_repeat(6,minmax(130px,1fr))]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar gasto" className="pl-9" /></div>
        <Select value={category} onValueChange={(value) => setCategory(value ?? all)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={all}>Categorias</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value ?? all)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={all}>Metodos</SelectItem>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Proveedor" />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total filtrado</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{money(filteredTotal)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Gastos del mes</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{money(monthTotal)}</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          {error ? <div className="px-6 py-12 text-center text-sm text-destructive">Error al cargar gastos: {error.message}</div> : isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><Receipt className="size-6 text-muted-foreground" /></div><p className="text-sm font-medium">Sin gastos para mostrar</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Categoria</TableHead><TableHead>Descripcion</TableHead><TableHead>Monto</TableHead><TableHead>Metodo</TableHead><TableHead>Proveedor</TableHead><TableHead>Venta</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>{filtered.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.expense_date || "-"}</TableCell>
                  <TableCell><Badge variant="secondary">{expense.category || "otro"}</Badge></TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{money(expense.amount)}</TableCell>
                  <TableCell>{expense.payment_method || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.supplier || "-"}</TableCell>
                  <TableCell>{expense.sale_id ? salesById.get(expense.sale_id) ?? "-" : "-"}</TableCell>
                  <TableCell><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}><MoreHorizontal className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setEditing(expense); setOpen(true) }}><Pencil className="size-4" />Editar</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => { setDeleteError(null); setDeleting(expense) }}><Trash2 className="size-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar gasto" : "Nuevo gasto"}</DialogTitle><DialogDescription>Registra compras, suministros o gastos asociados a ventas.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {formError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Fecha</Label><Input type="date" value={form.expense_date ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, expense_date: e.target.value || null }))} /></div>
              <div className="grid gap-2"><Label>Categoria</Label><Select value={form.category ?? "otro"} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value ?? "otro" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2 sm:col-span-2"><Label>Descripcion</Label><Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required /></div>
              <div className="grid gap-2"><Label>Monto</Label><Input type="number" min="0" value={form.amount ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, amount: toNumber(e.target.value) }))} /></div>
              <div className="grid gap-2"><Label>Metodo</Label><Select value={form.payment_method ?? "sinpe"} onValueChange={(value) => setForm((prev) => ({ ...prev, payment_method: value ?? "sinpe" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Proveedor</Label><Input value={form.supplier ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Venta asociada</Label><Select value={form.sale_id ?? none} onValueChange={(value) => setForm((prev) => ({ ...prev, sale_id: value === none ? null : value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={none}>Sin venta</SelectItem>{(sales ?? []).map((sale) => <SelectItem key={sale.id} value={sale.id}>{sale.sale_number || sale.id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2 sm:col-span-2"><Label>URL comprobante</Label><Input value={form.receipt_url ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, receipt_url: e.target.value }))} /></div>
              <div className="grid gap-2 sm:col-span-2"><Label>Notas</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleting)} onOpenChange={(next) => !next && setDeleting(null)}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Eliminar gasto</DialogTitle><DialogDescription>Seguro que deseas eliminar este gasto?</DialogDescription></DialogHeader>{deleteError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{deleteError}</div>}<DialogFooter><Button variant="outline" onClick={() => setDeleting(null)} disabled={saving}>Cancelar</Button><Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Eliminando..." : "Eliminar"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  )
}
