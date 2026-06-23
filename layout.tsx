"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Plus, Search, Trash2, Droplets } from "lucide-react"
import type { Color, ColorInput, FinishType } from "@/lib/types"
import { createColor, deleteColor, fetchColors, updateColor } from "@/lib/catalogs"
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

const emptyForm: ColorInput = {
  name: "",
  finish_type: "plain",
  status: "active",
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

function finishLabel(value: FinishType | null) {
  if (value === "washed") return "Washed"
  return "Color liso"
}

export default function ColorsPage() {
  const { data: colors, error, isLoading, mutate } = useSWR("colors", fetchColors)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Color | null>(null)
  const [deleting, setDeleting] = useState<Color | null>(null)
  const [form, setForm] = useState<ColorInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!colors) return []
    if (!q) return colors
    return colors.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.finish_type ?? "").toLowerCase().includes(q) ||
        (item.status ?? "").toLowerCase().includes(q),
    )
  }, [colors, query])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(
      editing
        ? {
            name: editing.name ?? "",
            finish_type: editing.finish_type ?? "plain",
            status: editing.status ?? "active",
          }
        : emptyForm,
    )
  }, [open, editing])

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setFormError(null)

    if (!form.name.trim()) {
      const message = "El nombre es obligatorio"
      setFormError(message)
      toast.error(message)
      return
    }

    const payload: ColorInput = {
      name: form.name.trim(),
      finish_type: form.finish_type ?? "plain",
      status: form.status?.trim() || "active",
    }

    setSaving(true)
    try {
      if (editing) {
        await updateColor(editing.id, payload)
        toast.success("Color actualizado")
      } else {
        await createColor(payload)
        toast.success("Color creado")
      }
      setOpen(false)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al guardar el color")
      console.error("Error al guardar color", err)
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
      await deleteColor(deleting.id)
      toast.success("Color eliminado")
      setDeleting(null)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al eliminar el color")
      console.error("Error al eliminar color", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Colores"
        description="Colores disponibles para camisas color liso y washed."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo color
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, acabado o estado" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">Error al cargar colores: {error.message}</div>
          ) : isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Droplets className="size-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium">{query ? "Sin resultados" : "Aún no hay colores"}</p>
              <Button onClick={openCreate} className="mt-1"><Plus className="size-4" />Nuevo color</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Acabado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((color) => (
                  <TableRow key={color.id}>
                    <TableCell className="font-medium">{color.name}</TableCell>
                    <TableCell><Badge variant="secondary">{finishLabel(color.finish_type)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{color.status || "active"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} aria-label={`Acciones para ${color.name}`}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(color); setOpen(true) }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setDeleteError(null); setDeleting(color) }}><Trash2 className="size-4" />Eliminar</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar color" : "Nuevo color"}</DialogTitle>
            <DialogDescription>Define colores disponibles por tipo de acabado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {formError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>}
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="finish_type">Acabado</Label>
              <Select value={form.finish_type ?? "plain"} onValueChange={(v) => setForm((prev) => ({ ...prev, finish_type: v as FinishType }))}>
                <SelectTrigger id="finish_type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Color liso</SelectItem>
                  <SelectItem value="washed">Washed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Input id="status" value={form.status ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} placeholder="active" />
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
            <DialogTitle>Eliminar color</DialogTitle>
            <DialogDescription>¿Seguro que deseas eliminar {deleting?.name}? Esta acción no se puede deshacer.</DialogDescription>
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
