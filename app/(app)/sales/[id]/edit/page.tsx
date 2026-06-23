"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"
import type { FinishType, PaymentStatus, ProductionStatus, SaleInput } from "@/lib/types"
import { fetchCharacters, fetchColors, fetchDesigns, fetchSizes } from "@/lib/catalogs"
import { fetchClients } from "@/lib/clients"
import { fetchSales, updateSale } from "@/lib/business"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

const none = "__none"
const productionStatuses: ProductionStatus[] = [
  "pedido_recibido",
  "falta_comprar_camisa",
  "falta_dtf",
  "falta_empaque",
  "listo_para_estampar",
  "estampado",
  "empacado",
  "entregado",
  "cancelado",
]
const paymentStatuses: PaymentStatus[] = ["pendiente", "abonado", "pagado", "reembolsado"]

const emptyForm: SaleInput = {
  sale_number: "",
  client_id: null,
  character_id: null,
  design_id: null,
  color_id: null,
  size_id: null,
  finish_type: "plain",
  quantity: 1,
  sale_price: null,
  shirt_cost: null,
  dtf_cost: null,
  packaging_cost: null,
  other_costs: null,
  production_status: "pedido_recibido",
  payment_status: "pendiente",
  order_date: null,
  estimated_delivery_date: null,
  real_delivery_date: null,
  notes: "",
}

function toNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export default function EditSalePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const saleId = params.id
  const { data: sales, error, isLoading } = useSWR("sales", fetchSales)
  const { data: clients } = useSWR("clients", fetchClients)
  const { data: characters } = useSWR("characters", fetchCharacters)
  const { data: designs } = useSWR("designs", fetchDesigns)
  const { data: colors } = useSWR("colors", fetchColors)
  const { data: sizes } = useSWR("sizes", fetchSizes)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<SaleInput>(emptyForm)

  const sale = useMemo(() => (sales ?? []).find((item) => item.id === saleId), [sales, saleId])
  const filteredDesigns = useMemo(() => {
    if (!form.character_id) return designs ?? []
    return (designs ?? []).filter((design) => design.character_id === form.character_id)
  }, [designs, form.character_id])

  useEffect(() => {
    if (!sale) return
    setForm({
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
      notes: sale.notes ?? "",
    })
  }, [sale])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving || !sale) return
    setFormError(null)

    if (!form.client_id || !form.design_id || !form.color_id || !form.size_id) {
      const message = "Cliente, diseno, color y talla son obligatorios"
      setFormError(message)
      toast.error(message)
      return
    }

    const payload: SaleInput = {
      ...form,
      sale_number: form.sale_number?.trim() || sale.sale_number,
      notes: form.notes?.trim() || null,
    }

    setSaving(true)
    try {
      await updateSale(sale.id, payload)
      toast.success("Venta actualizada")
      router.push("/sales")
    } catch (err) {
      const message = errorMessage(err, "Error al actualizar la venta")
      console.error("Error al actualizar venta", err)
      setFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Editar venta"
        description="Corrige pedido, costos, pago y entrega."
        action={
          <Button variant="outline" render={<Link href="/sales" />}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
        }
      />

      <Card>
        <CardContent>
          {error ? (
            <div className="py-12 text-center text-sm text-destructive">Error al cargar ventas: {error.message}</div>
          ) : isLoading ? (
            <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !sale ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Venta no encontrada.</div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-5">
              {formError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="sale_number">Numero</Label>
                  <Input id="sale_number" value={form.sale_number ?? ""} onChange={(e) => setForm((p) => ({ ...p, sale_number: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select value={form.client_id ?? none} onValueChange={(v) => setForm((p) => ({ ...p, client_id: v === none ? null : v }))}>
                    <SelectTrigger id="client_id"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={none}>Selecciona cliente</SelectItem>
                      {(clients ?? []).map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="character_id">Personaje</Label>
                  <Select value={form.character_id ?? none} onValueChange={(v) => setForm((p) => ({ ...p, character_id: v === none ? null : v, design_id: null }))}>
                    <SelectTrigger id="character_id"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={none}>Sin personaje</SelectItem>
                      {(characters ?? []).map((character) => <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="design_id">Diseno</Label>
                  <Select value={form.design_id ?? none} onValueChange={(v) => setForm((p) => ({ ...p, design_id: v === none ? null : v }))}>
                    <SelectTrigger id="design_id"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={none}>Selecciona diseno</SelectItem>
                      {filteredDesigns.map((design) => <SelectItem key={design.id} value={design.id}>{design.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="finish_type">Acabado</Label>
                  <Select value={form.finish_type ?? "plain"} onValueChange={(v) => setForm((p) => ({ ...p, finish_type: v as FinishType }))}>
                    <SelectTrigger id="finish_type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plain">Color liso</SelectItem>
                      <SelectItem value="washed">Washed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color_id">Color</Label>
                  <Select value={form.color_id ?? none} onValueChange={(v) => setForm((p) => ({ ...p, color_id: v === none ? null : v }))}>
                    <SelectTrigger id="color_id"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={none}>Selecciona color</SelectItem>
                      {(colors ?? []).map((color) => <SelectItem key={color.id} value={color.id}>{color.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="size_id">Talla</Label>
                  <Select value={form.size_id ?? none} onValueChange={(v) => setForm((p) => ({ ...p, size_id: v === none ? null : v }))}>
                    <SelectTrigger id="size_id"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={none}>Selecciona talla</SelectItem>
                      {(sizes ?? []).map((size) => <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {[
                  ["quantity", "Cantidad"],
                  ["sale_price", "Precio venta"],
                  ["shirt_cost", "Costo camisa"],
                  ["dtf_cost", "Costo DTF"],
                  ["packaging_cost", "Costo empaque"],
                  ["other_costs", "Otros costos"],
                ].map(([key, label]) => (
                  <div className="grid gap-2" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input id={key} type="number" min="0" value={(form[key as keyof SaleInput] as number | null) ?? ""} onChange={(e) => setForm((p) => ({ ...p, [key]: toNumber(e.target.value) }))} />
                  </div>
                ))}
                <div className="grid gap-2">
                  <Label htmlFor="production_status">Estado produccion</Label>
                  <Select value={form.production_status ?? "pedido_recibido"} onValueChange={(v) => setForm((p) => ({ ...p, production_status: v as ProductionStatus }))}>
                    <SelectTrigger id="production_status"><SelectValue /></SelectTrigger>
                    <SelectContent>{productionStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment_status">Estado pago</Label>
                  <Select value={form.payment_status ?? "pendiente"} onValueChange={(v) => setForm((p) => ({ ...p, payment_status: v as PaymentStatus }))}>
                    <SelectTrigger id="payment_status"><SelectValue /></SelectTrigger>
                    <SelectContent>{paymentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {[
                  ["order_date", "Fecha pedido"],
                  ["estimated_delivery_date", "Entrega estimada"],
                  ["real_delivery_date", "Entrega real"],
                ].map(([key, label]) => (
                  <div className="grid gap-2" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input id={key} type="date" value={(form[key as keyof SaleInput] as string | null) ?? ""} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value || null }))} />
                  </div>
                ))}
                <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="notes">Observaciones</Label>
                  <Textarea id="notes" value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" render={<Link href="/sales" />}>Cancelar</Button>
                <Button type="submit" disabled={saving}><Save className="size-4" />{saving ? "Guardando..." : "Guardar cambios"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  )
}
