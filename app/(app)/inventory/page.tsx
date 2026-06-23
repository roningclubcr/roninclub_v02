"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { AlertTriangle, MoreHorizontal, Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import type { FinishType, InventoryInput, InventoryItem } from "@/lib/types"
import { fetchColors, fetchSizes } from "@/lib/catalogs"
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventory,
  updateInventoryItem,
} from "@/lib/business"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"

const none = "__none"
const emptyForm: InventoryInput = {
  item_type: "camisa",
  finish_type: "plain",
  color_id: null,
  size_id: null,
  stock_actual: 0,
  stock_minimo: 0,
  unit_cost: null,
  supplier: "",
  notes: "",
}

function toNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function money(value: number | null) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value)
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export default function InventoryPage() {
  const { data: inventory, error, isLoading, mutate } = useSWR("inventory", fetchInventory)
  const { data: colors } = useSWR("colors", fetchColors)
  const { data: sizes } = useSWR("sizes", fetchSizes)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [deleting, setDeleting] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState<InventoryInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const colorById = useMemo(() => new Map((colors ?? []).map((item) => [item.id, item.name])), [colors])
  const sizeById = useMemo(() => new Map((sizes ?? []).map((item) => [item.id, item.name])), [sizes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!inventory) return []
    if (!q) return inventory
    return inventory.filter((item) =>
      [
        item.item_type,
        item.finish_type,
        item.supplier,
        item.notes,
        item.color_id ? colorById.get(item.color_id) : "",
        item.size_id ? sizeById.get(item.size_id) : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [inventory, query, colorById, sizeById])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(
      editing
        ? {
            item_type: editing.item_type ?? "",
            finish_type: editing.finish_type ?? "plain",
            color_id: editing.color_id,
            size_id: editing.size_id,
            stock_actual: editing.stock_actual,
            stock_minimo: editing.stock_minimo,
            unit_cost: editing.unit_cost,
            supplier: editing.supplier ?? "",
            notes: editing.notes ?? "",
          }
        : emptyForm,
    )
  }, [open, editing])

  function lowStock(item: InventoryItem) {
    return (item.stock_actual ?? 0) <= (item.stock_minimo ?? 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setFormError(null)
    if (!form.item_type.trim()) {
      const message = "El tipo de insumo es obligatorio"
      setFormError(message)
      toast.error(message)
      return
    }

    const payload: InventoryInput = {
      ...form,
      item_type: form.item_type.trim(),
      supplier: form.supplier?.trim() || null,
      notes: form.notes?.trim() || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateInventoryItem(editing.id, payload)
        toast.success("Inventario actualizado")
      } else {
        await createInventoryItem(payload)
        toast.success("Insumo creado")
      }
      setOpen(false)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al guardar inventario")
      console.error("Error al guardar inventario", err)
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
      await deleteInventoryItem(deleting.id)
      toast.success("Insumo eliminado")
      setDeleting(null)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al eliminar inventario")
      console.error("Error al eliminar inventario", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Control de camisas, colores, tallas y suministros."
        action={
          <Button onClick={() => { setEditing(null); setOpen(true) }}>
            <Plus className="size-4" />
            Nuevo insumo
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar inventario" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">Error al cargar inventario: {error.message}</div>
          ) : isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Package className="size-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium">{query ? "Sin resultados" : "Aún no hay inventario"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Acabado</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item_type}</TableCell>
                    <TableCell>{item.finish_type === "washed" ? "Washed" : "Color liso"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.color_id ? colorById.get(item.color_id) ?? "—" : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.size_id ? sizeById.get(item.size_id) ?? "—" : "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        {lowStock(item) && <AlertTriangle className="size-4 text-destructive" />}
                        <Badge variant={lowStock(item) ? "destructive" : "secondary"}>{item.stock_actual ?? 0}</Badge>
                      </span>
                    </TableCell>
                    <TableCell>{item.stock_minimo ?? 0}</TableCell>
                    <TableCell>{money(item.unit_cost)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.supplier || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} aria-label={`Acciones para ${item.item_type}`}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(item); setOpen(true) }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setDeleteError(null); setDeleting(item) }}><Trash2 className="size-4" />Eliminar</DropdownMenuItem>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar insumo" : "Nuevo insumo"}</DialogTitle>
            <DialogDescription>Registra stock disponible y costo unitario.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {formError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="item_type">Tipo</Label>
                <Input id="item_type" value={form.item_type} onChange={(e) => setForm((p) => ({ ...p, item_type: e.target.value }))} required />
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
                    <SelectItem value={none}>Sin color</SelectItem>
                    {(colors ?? []).map((color) => <SelectItem key={color.id} value={color.id}>{color.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="size_id">Talla</Label>
                <Select value={form.size_id ?? none} onValueChange={(v) => setForm((p) => ({ ...p, size_id: v === none ? null : v }))}>
                  <SelectTrigger id="size_id"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={none}>Sin talla</SelectItem>
                    {(sizes ?? []).map((size) => <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock_actual">Stock actual</Label>
                <Input id="stock_actual" type="number" min="0" value={form.stock_actual ?? ""} onChange={(e) => setForm((p) => ({ ...p, stock_actual: toNumber(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock_minimo">Stock mínimo</Label>
                <Input id="stock_minimo" type="number" min="0" value={form.stock_minimo ?? ""} onChange={(e) => setForm((p) => ({ ...p, stock_minimo: toNumber(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_cost">Costo unitario</Label>
                <Input id="unit_cost" type="number" min="0" value={form.unit_cost ?? ""} onChange={(e) => setForm((p) => ({ ...p, unit_cost: toNumber(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">Proveedor</Label>
                <Input id="supplier" value={form.supplier ?? ""} onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(next) => !next && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar insumo</DialogTitle>
            <DialogDescription>¿Seguro que deseas eliminar {deleting?.item_type}? Esta acción no se puede deshacer.</DialogDescription>
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
