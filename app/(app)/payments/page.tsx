"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { AlertTriangle, CreditCard, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"
import type { Payment, PaymentInput, PaymentMethod, Sale, SaleInput } from "@/lib/types"
import { createPayment, deletePayment, fetchPayments, fetchSales, updatePayment, updateSale } from "@/lib/business"
import { fetchClients } from "@/lib/clients"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const none = "__none"
const paymentMethods: PaymentMethod[] = ["sinpe", "efectivo", "transferencia", "tarjeta", "otro"]
const emptyForm: PaymentInput = {
  sale_id: null,
  payment_date: new Date().toISOString().slice(0, 10),
  amount: null,
  payment_method: "sinpe",
  reference: "",
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

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

function saleToInput(sale: Sale): SaleInput {
  return {
    sale_number: sale.sale_number,
    client_id: sale.client_id,
    character_id: sale.character_id,
    design_id: sale.design_id,
    color_id: sale.color_id,
    size_id: sale.size_id,
    finish_type: sale.finish_type,
    quantity: sale.quantity,
    sale_price: sale.sale_price,
    shirt_cost: sale.shirt_cost,
    dtf_cost: sale.dtf_cost,
    packaging_cost: sale.packaging_cost,
    other_costs: sale.other_costs,
    production_status: sale.production_status,
    payment_status: sale.payment_status,
    order_date: sale.order_date,
    estimated_delivery_date: sale.estimated_delivery_date,
    real_delivery_date: sale.real_delivery_date,
    notes: sale.notes,
  }
}

export default function PaymentsPage() {
  const { data: payments, error, isLoading, mutate } = useSWR("payments", fetchPayments)
  const { data: sales, mutate: mutateSales } = useSWR("sales", fetchSales)
  const { data: clients } = useSWR("clients", fetchClients)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState<Payment | null>(null)
  const [form, setForm] = useState<PaymentInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const clientsById = useMemo(() => new Map((clients ?? []).map((item) => [item.id, item.name])), [clients])
  const salesById = useMemo(() => new Map((sales ?? []).map((item) => [item.id, item])), [sales])
  const paidBySale = useMemo(() => {
    const map = new Map<string, number>()
    for (const payment of payments ?? []) {
      if (payment.sale_id) map.set(payment.sale_id, (map.get(payment.sale_id) ?? 0) + (payment.amount ?? 0))
    }
    return map
  }, [payments])
  const salesWithPayments = useMemo(() => new Set((payments ?? []).map((payment) => payment.sale_id).filter(Boolean)), [payments])
  const selectableSales = useMemo(() => {
    return (sales ?? []).filter((sale) => sale.id === editing?.sale_id || (!salesWithPayments.has(sale.id) && sale.payment_status !== "pagado"))
  }, [sales, salesWithPayments, editing])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (payments ?? []).filter((payment) => {
      const sale = payment.sale_id ? salesById.get(payment.sale_id) : null
      return !q || [
        payment.payment_method,
        payment.reference,
        payment.notes,
        sale?.sale_number,
        sale?.client_id ? clientsById.get(sale.client_id) : "",
      ].join(" ").toLowerCase().includes(q)
    })
  }, [payments, query, salesById, clientsById])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(editing ? {
      sale_id: editing.sale_id,
      payment_date: editing.payment_date,
      amount: editing.amount,
      payment_method: editing.payment_method ?? "sinpe",
      reference: editing.reference ?? "",
      notes: editing.notes ?? "",
    } : emptyForm)
  }, [open, editing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setFormError(null)
    if (!form.sale_id || !form.amount) {
      const message = "Venta y monto son obligatorios"
      setFormError(message)
      toast.error(message)
      return
    }
    if (!editing && salesWithPayments.has(form.sale_id)) {
      const message = "Esta venta ya tiene un pago registrado"
      setFormError(message)
      toast.error(message)
      return
    }
    const payload: PaymentInput = {
      ...form,
      payment_method: form.payment_method?.trim() || "sinpe",
      reference: form.reference?.trim() || null,
      notes: form.notes?.trim() || null,
    }
    setSaving(true)
    try {
      if (editing) {
        await updatePayment(editing.id, payload)
        toast.success("Pago actualizado")
      } else {
        await createPayment(payload)
        toast.success("Pago registrado")
      }
      const sale = payload.sale_id ? salesById.get(payload.sale_id) : null
      if (sale) {
        await updateSale(sale.id, { ...saleToInput(sale), payment_status: "pagado" })
        await mutateSales()
      }
      setOpen(false)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al guardar el pago")
      console.error("Error al guardar pago", err)
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
      await deletePayment(deleting.id)
      toast.success("Pago eliminado")
      setDeleting(null)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al eliminar el pago")
      console.error("Error al eliminar pago", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Pagos" description="Registra pagos y controla saldos pendientes." action={<Button onClick={() => { setEditing(null); setOpen(true) }}><Plus className="size-4" />Nuevo pago</Button>} />
      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pago, venta o referencia" className="pl-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          {error ? <div className="px-6 py-12 text-center text-sm text-destructive">Error al cargar pagos: {error.message}</div> : isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><CreditCard className="size-6 text-muted-foreground" /></div><p className="text-sm font-medium">{query ? "Sin resultados" : "Aun no hay pagos"}</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Venta</TableHead><TableHead>Cliente</TableHead><TableHead>Monto</TableHead><TableHead>Pagado venta</TableHead><TableHead>Saldo</TableHead><TableHead>Metodo</TableHead><TableHead>Referencia</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {filtered.map((payment) => {
                  const sale = payment.sale_id ? salesById.get(payment.sale_id) : null
                  const paid = payment.sale_id ? paidBySale.get(payment.sale_id) ?? 0 : 0
                  const balance = Math.max((sale?.sale_price ?? 0) - paid, 0)
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.payment_date || "-"}</TableCell>
                      <TableCell className="font-medium">{sale?.sale_number || "-"}</TableCell>
                      <TableCell>{sale?.client_id ? clientsById.get(sale.client_id) ?? "-" : "-"}</TableCell>
                      <TableCell>{money(payment.amount)}</TableCell>
                      <TableCell><Badge variant="secondary">{money(paid)}</Badge></TableCell>
                      <TableCell><Badge variant={balance > 0 ? "destructive" : "default"}>{balance > 0 && <AlertTriangle className="size-3" />}{money(balance)}</Badge></TableCell>
                      <TableCell>{payment.payment_method || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.reference || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditing(payment); setOpen(true) }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => { setDeleteError(null); setDeleting(payment) }}><Trash2 className="size-4" />Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar pago" : "Nuevo pago"}</DialogTitle><DialogDescription>Asocia el pago a una venta.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {formError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>}
            <div className="grid gap-2">
              <Label>Venta</Label>
              <Select value={form.sale_id ?? none} onValueChange={(value) => setForm((prev) => ({ ...prev, sale_id: value === none ? null : value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={none}>Selecciona venta</SelectItem>
                  {selectableSales.map((sale) => {
                    const paid = paidBySale.get(sale.id) ?? 0
                    const balance = Math.max((sale.sale_price ?? 0) - paid, 0)
                    return <SelectItem key={sale.id} value={sale.id}>{sale.sale_number || sale.id.slice(0, 8)} · {sale.client_id ? clientsById.get(sale.client_id) ?? "" : ""} · saldo {money(balance)}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="payment_date">Fecha</Label><Input id="payment_date" type="date" value={form.payment_date ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, payment_date: e.target.value || null }))} /></div>
              <div className="grid gap-2"><Label htmlFor="amount">Monto</Label><Input id="amount" type="number" min="0" value={form.amount ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, amount: toNumber(e.target.value) }))} /></div>
              <div className="grid gap-2">
                <Label htmlFor="payment_method">Metodo</Label>
                <Select value={form.payment_method ?? "sinpe"} onValueChange={(value) => setForm((prev) => ({ ...prev, payment_method: value ?? "sinpe" }))}>
                  <SelectTrigger id="payment_method"><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentMethods.map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label htmlFor="reference">Referencia</Label><Input id="reference" value={form.reference ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))} /></div>
            </div>
            <div className="grid gap-2"><Label htmlFor="notes">Notas</Label><Textarea id="notes" value={form.notes ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleting)} onOpenChange={(next) => !next && setDeleting(null)}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Eliminar pago</DialogTitle><DialogDescription>Seguro que deseas eliminar este pago?</DialogDescription></DialogHeader>{deleteError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{deleteError}</div>}<DialogFooter><Button variant="outline" onClick={() => setDeleting(null)} disabled={saving}>Cancelar</Button><Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Eliminando..." : "Eliminar"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  )
}
