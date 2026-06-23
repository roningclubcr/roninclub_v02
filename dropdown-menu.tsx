"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Plus, Ruler, Search, Trash2 } from "lucide-react"
import type { Size, SizeInput } from "@/lib/types"
import { createSize, deleteSize, fetchSizes, updateSize } from "@/lib/catalogs"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const emptyForm: SizeInput = { name: "" }

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export default function SizesPage() {
  const { data: sizes, error, isLoading, mutate } = useSWR("sizes", fetchSizes)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Size | null>(null)
  const [deleting, setDeleting] = useState<Size | null>(null)
  const [form, setForm] = useState<SizeInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!sizes) return []
    if (!q) return sizes
    return sizes.filter((size) => size.name.toLowerCase().includes(q))
  }, [sizes, query])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(editing ? { name: editing.name ?? "" } : emptyForm)
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

    const payload: SizeInput = { name: form.name.trim().toUpperCase() }

    setSaving(true)
    try {
      if (editing) {
        await updateSize(editing.id, payload)
        toast.success("Talla actualizada")
      } else {
        await createSize(payload)
        toast.success("Talla creada")
      }
      setOpen(false)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al guardar la talla")
      console.error("Error al guardar talla", err)
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
      await deleteSize(deleting.id)
      toast.success("Talla eliminada")
      setDeleting(null)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al eliminar la talla")
      console.error("Error al eliminar talla", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Tallas"
        description="Tallas disponibles para las camisas Ronin Club."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nueva talla
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar talla" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">Error al cargar tallas: {error.message}</div>
          ) : isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Ruler className="size-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium">{query ? "Sin resultados" : "Aún no hay tallas"}</p>
              <Button onClick={openCreate} className="mt-1"><Plus className="size-4" />Nueva talla</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((size) => (
                  <TableRow key={size.id}>
                    <TableCell className="font-medium">{size.name}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} aria-label={`Acciones para ${size.name}`}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(size); setOpen(true) }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setDeleteError(null); setDeleting(size) }}><Trash2 className="size-4" />Eliminar</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar talla" : "Nueva talla"}</DialogTitle>
            <DialogDescription>Registra tallas como S, M, L o XL.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {formError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>}
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required />
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
            <DialogTitle>Eliminar talla</DialogTitle>
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
