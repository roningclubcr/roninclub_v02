"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Plus, Search, ShoppingCart, Trash2 } from "lucide-react"
import type { PaymentStatus, ProductionStatus, Sale, SaleInput } from "@/lib/types"
import { fetchCharacters, fetchColors, fetchDesigns, fetchSizes } from "@/lib/catalogs"
import { fetchClients } from "@/lib/clients"
import { deleteSale, fetchSales, updateSale } from "@/lib/business"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const all = "__all"
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

function money(value: number | null) {
  if (value === null || value === undefined) return "-"
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value)
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

export default function SalesPage() {
  const { data: sales, error, isLoading, mutate } = useSWR("sales", fetchSales)
  const { data: clients } = useSWR("clients", fetchClients)
  const { data: characters } = useSWR("characters", fetchCharacters)
  const { data: designs } = useSWR("designs", fetchDesigns)
  const { data: colors } = useSWR("colors", fetchColors)
  const { data: sizes } = useSWR("sizes", fetchSizes)
  const [query, setQuery] = useState("")
  const [productionFilter, setProductionFilter] = useState(all)
  const [paymentFilter, setPaymentFilter] = useState(all)
  const [clientFilter, setClientFilter] = useState(all)
  const [characterFilter, setCharacterFilter] = useState(all)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [deleting, setDeleting] = useState<Sale | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const clientsById = useMemo(() => new Map((clients ?? []).map((item) => [item.id, item.name])), [clients])
  const charactersById = useMemo(() => new Map((characters ?? []).map((item) => [item.id, item.name])), [characters])
  const designsById = useMemo(() => new Map((designs ?? []).map((item) => [item.id, item.name])), [designs])
  const colorsById = useMemo(() => new Map((colors ?? []).map((item) => [item.id, item.name])), [colors])
  const sizesById = useMemo(() => new Map((sizes ?? []).map((item) => [item.id, item.name])), [sizes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (sales ?? []).filter((sale) => {
      const haystack = [
        sale.sale_number,
        sale.production_status,
        sale.payment_status,
        sale.client_id ? clientsById.get(sale.client_id) : "",
        sale.character_id ? charactersById.get(sale.character_id) : "",
        sale.design_id ? designsById.get(sale.design_id) : "",
        sale.color_id ? colorsById.get(sale.color_id) : "",
        sale.size_id ? sizesById.get(sale.size_id) : "",
      ].join(" ").toLowerCase()

      return (
        (!q || haystack.includes(q)) &&
        (productionFilter === all || sale.production_status === productionFilter) &&
        (paymentFilter === all || sale.payment_status === paymentFilter) &&
        (clientFilter === all || sale.client_id === clientFilter) &&
        (characterFilter === all || sale.character_id === characterFilter) &&
        (!dateFrom || (sale.order_date ?? "") >= dateFrom) &&
        (!dateTo || (sale.order_date ?? "") <= dateTo)
      )
    })
  }, [sales, query, clientsById, charactersById, designsById, colorsById, sizesById, productionFilter, paymentFilter, clientFilter, characterFilter, dateFrom, dateTo])

  async function handleStatusChange(
    sale: Sale,
    key: "production_status" | "payment_status",
    value: ProductionStatus | PaymentStatus,
  ) {
    try {
      await updateSale(sale.id, { ...saleToInput(sale), [key]: value })
      toast.success("Estado actualizado")
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al actualizar estado")
      console.error("Error al actualizar estado de venta", err)
      toast.error(message)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteError(null)
    setSaving(true)
    try {
      await deleteSale(deleting.id)
      toast.success("Venta eliminada")
      setDeleting(null)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al eliminar la venta")
      console.error("Error al eliminar venta", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Ventas"
        description="Registro y seguimiento de pedidos."
        action={
          <Button render={<Link href="/sales/new" />}>
            <Plus className="size-4" />
            Nueva venta
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-[1.3fr_repeat(6,minmax(140px,1fr))]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar venta, cliente o estado" className="pl-9" />
        </div>
        <Select value={productionFilter} onValueChange={(value) => setProductionFilter(value ?? all)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>Produccion</SelectItem>{productionStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value ?? all)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>Pago</SelectItem>{paymentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={(value) => setClientFilter(value ?? all)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>Cliente</SelectItem>{(clients ?? []).map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={characterFilter} onValueChange={(value) => setCharacterFilter(value ?? all)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>Personaje</SelectItem>{(characters ?? []).map((character) => <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="grid gap-1"><Label className="sr-only">Desde</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
        <div className="grid gap-1"><Label className="sr-only">Hasta</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">Error al cargar ventas: {error.message}</div>
          ) : isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted"><ShoppingCart className="size-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium">{query ? "Sin resultados" : "Aun no hay ventas"}</p>
              <Button render={<Link href="/sales/new" />} className="mt-1"><Plus className="size-4" />Nueva venta</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Personaje</TableHead>
                  <TableHead>Diseno</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Acabado</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Produccion</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Entrega est.</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.sale_number || sale.id.slice(0, 8)}</TableCell>
                    <TableCell>{sale.client_id ? clientsById.get(sale.client_id) ?? "-" : "-"}</TableCell>
                    <TableCell>{sale.character_id ? charactersById.get(sale.character_id) ?? "-" : "-"}</TableCell>
                    <TableCell>{sale.design_id ? designsById.get(sale.design_id) ?? "-" : "-"}</TableCell>
                    <TableCell>{sale.color_id ? colorsById.get(sale.color_id) ?? "-" : "-"}</TableCell>
                    <TableCell>{sale.size_id ? sizesById.get(sale.size_id) ?? "-" : "-"}</TableCell>
                    <TableCell>{sale.finish_type === "washed" ? "Washed" : "Color liso"}</TableCell>
                    <TableCell>{sale.quantity ?? 0}</TableCell>
                    <TableCell>{money(sale.sale_price)}</TableCell>
                    <TableCell>
                      <Select value={sale.production_status ?? "pedido_recibido"} onValueChange={(value) => handleStatusChange(sale, "production_status", value as ProductionStatus)}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>{productionStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={sale.payment_status ?? "pendiente"} onValueChange={(value) => handleStatusChange(sale, "payment_status", value as PaymentStatus)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>{paymentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sale.order_date || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.estimated_delivery_date || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} aria-label={`Acciones para venta ${sale.sale_number ?? sale.id}`}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/sales/${sale.id}/edit`} />}><Pencil className="size-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setDeleteError(null); setDeleting(sale) }}><Trash2 className="size-4" />Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleting)} onOpenChange={(next) => !next && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar venta</DialogTitle>
            <DialogDescription>Seguro que deseas eliminar esta venta? Esta accion no se puede deshacer.</DialogDescription>
          </DialogHeader>
          {deleteError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{deleteError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Eliminando..." : "Eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
