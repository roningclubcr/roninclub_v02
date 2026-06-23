"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { MoreHorizontal, Palette, Pencil, Plus, Search, Trash2 } from "lucide-react"
import type { Design, DesignInput } from "@/lib/types"
import {
  createDesign,
  deleteDesign,
  fetchCharacters,
  fetchDesigns,
  updateDesign,
} from "@/lib/catalogs"
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

const noCharacterValue = "__none"

const emptyForm: DesignInput = {
  character_id: null,
  name: "",
  design_type: "dtf",
  suggested_price_plain: null,
  suggested_price_washed: null,
  estimated_dtf_cost: null,
  image_url: "",
  status: "active",
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
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

export default function DesignsPage() {
  const { data: designs, error, isLoading, mutate } = useSWR("designs", fetchDesigns)
  const { data: characters, error: charactersError } = useSWR("characters", fetchCharacters)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Design | null>(null)
  const [deleting, setDeleting] = useState<Design | null>(null)
  const [form, setForm] = useState<DesignInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const characterById = useMemo(() => {
    return new Map((characters ?? []).map((character) => [character.id, character.name]))
  }, [characters])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!designs) return []
    if (!q) return designs
    return designs.filter((design) => {
      const characterName = design.character_id ? characterById.get(design.character_id) : ""
      return (
        design.name.toLowerCase().includes(q) ||
        (design.design_type ?? "").toLowerCase().includes(q) ||
        (design.status ?? "").toLowerCase().includes(q) ||
        (characterName ?? "").toLowerCase().includes(q)
      )
    })
  }, [designs, query, characterById])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(
      editing
        ? {
            character_id: editing.character_id,
            name: editing.name ?? "",
            design_type: editing.design_type ?? "dtf",
            suggested_price_plain: editing.suggested_price_plain,
            suggested_price_washed: editing.suggested_price_washed,
            estimated_dtf_cost: editing.estimated_dtf_cost,
            image_url: editing.image_url ?? "",
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

    const payload: DesignInput = {
      character_id: form.character_id || null,
      name: form.name.trim(),
      design_type: form.design_type?.trim() || null,
      suggested_price_plain: form.suggested_price_plain,
      suggested_price_washed: form.suggested_price_washed,
      estimated_dtf_cost: form.estimated_dtf_cost,
      image_url: form.image_url?.trim() || null,
      status: form.status?.trim() || "active",
    }

    setSaving(true)
    try {
      if (editing) {
        await updateDesign(editing.id, payload)
        toast.success("Diseño actualizado")
      } else {
        await createDesign(payload)
        toast.success("Diseño creado")
      }
      setOpen(false)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al guardar el diseño")
      console.error("Error al guardar diseño", err)
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
      await deleteDesign(deleting.id)
      toast.success("Diseño eliminado")
      setDeleting(null)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al eliminar el diseño")
      console.error("Error al eliminar diseño", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Diseños"
        description="Gestión de diseños asociados a personajes."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo diseño
          </Button>
        }
      />

      {charactersError && (
        <div role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Error al cargar personajes: {charactersError.message}
        </div>
      )}

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar diseño, personaje o estado" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">Error al cargar diseños: {error.message}</div>
          ) : isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Palette className="size-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium">{query ? "Sin resultados" : "Aún no hay diseños"}</p>
              <Button onClick={openCreate} className="mt-1"><Plus className="size-4" />Nuevo diseño</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Personaje</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio liso</TableHead>
                  <TableHead>Precio washed</TableHead>
                  <TableHead>Costo DTF</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((design) => (
                  <TableRow key={design.id}>
                    <TableCell className="font-medium">{design.name}</TableCell>
                    <TableCell className="text-muted-foreground">{design.character_id ? characterById.get(design.character_id) ?? "—" : "—"}</TableCell>
                    <TableCell>{design.design_type || "—"}</TableCell>
                    <TableCell>{money(design.suggested_price_plain)}</TableCell>
                    <TableCell>{money(design.suggested_price_washed)}</TableCell>
                    <TableCell>{money(design.estimated_dtf_cost)}</TableCell>
                    <TableCell><Badge variant="secondary">{design.status || "active"}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} aria-label={`Acciones para ${design.name}`}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(design); setOpen(true) }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setDeleteError(null); setDeleting(design) }}><Trash2 className="size-4" />Eliminar</DropdownMenuItem>
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
            <DialogTitle>{editing ? "Editar diseño" : "Nuevo diseño"}</DialogTitle>
            <DialogDescription>Asocia el diseño a un personaje y define precios sugeridos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {formError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="character_id">Personaje</Label>
                <Select value={form.character_id ?? noCharacterValue} onValueChange={(v) => setForm((prev) => ({ ...prev, character_id: v === noCharacterValue ? null : v }))}>
                  <SelectTrigger id="character_id"><SelectValue placeholder="Selecciona un personaje" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noCharacterValue}>Sin personaje</SelectItem>
                    {(characters ?? []).map((character) => (
                      <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="design_type">Tipo de diseño</Label>
                <Input id="design_type" value={form.design_type ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, design_type: e.target.value }))} placeholder="dtf" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Input id="status" value={form.status ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} placeholder="active" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="suggested_price_plain">Precio color liso</Label>
                <Input id="suggested_price_plain" type="number" min="0" step="1" value={form.suggested_price_plain ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, suggested_price_plain: toNumber(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="suggested_price_washed">Precio washed</Label>
                <Input id="suggested_price_washed" type="number" min="0" step="1" value={form.suggested_price_washed ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, suggested_price_washed: toNumber(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estimated_dtf_cost">Costo DTF estimado</Label>
                <Input id="estimated_dtf_cost" type="number" min="0" step="1" value={form.estimated_dtf_cost ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, estimated_dtf_cost: toNumber(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image_url">URL de imagen</Label>
                <Input id="image_url" value={form.image_url ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))} placeholder="https://..." />
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
            <DialogTitle>Eliminar diseño</DialogTitle>
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
