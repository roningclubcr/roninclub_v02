"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Plus, Search, Trash2, Drama } from "lucide-react"
import type { Character, CharacterInput } from "@/lib/types"
import {
  createCharacter,
  deleteCharacter,
  fetchCharacters,
  updateCharacter,
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

const emptyForm: CharacterInput = {
  name: "",
  franchise: "",
  status: "active",
  notes: "",
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export default function CharactersPage() {
  const { data: characters, error, isLoading, mutate } = useSWR(
    "characters",
    fetchCharacters,
  )
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Character | null>(null)
  const [deleting, setDeleting] = useState<Character | null>(null)
  const [form, setForm] = useState<CharacterInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!characters) return []
    if (!q) return characters
    return characters.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.franchise ?? "").toLowerCase().includes(q) ||
        (item.status ?? "").toLowerCase().includes(q),
    )
  }, [characters, query])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(
      editing
        ? {
            name: editing.name ?? "",
            franchise: editing.franchise ?? "",
            status: editing.status ?? "active",
            notes: editing.notes ?? "",
          }
        : emptyForm,
    )
  }, [open, editing])

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(character: Character) {
    setEditing(character)
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

    const payload: CharacterInput = {
      name: form.name.trim(),
      franchise: form.franchise?.trim() || null,
      status: form.status?.trim() || "active",
      notes: form.notes?.trim() || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateCharacter(editing.id, payload)
        toast.success("Personaje actualizado")
      } else {
        await createCharacter(payload)
        toast.success("Personaje creado")
      }
      setOpen(false)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al guardar el personaje")
      console.error("Error al guardar personaje", err)
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
      await deleteCharacter(deleting.id)
      toast.success("Personaje eliminado")
      setDeleting(null)
      await mutate()
    } catch (err) {
      const message = errorMessage(err, "Error al eliminar el personaje")
      console.error("Error al eliminar personaje", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Personajes"
        description="Catálogo de personajes para los diseños de camisas."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo personaje
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, franquicia o estado"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">
              Error al cargar personajes: {error.message}
            </div>
          ) : isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Drama className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                {query ? "Sin resultados" : "Aún no hay personajes"}
              </p>
              <Button onClick={openCreate} className="mt-1">
                <Plus className="size-4" />
                Nuevo personaje
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Franquicia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((character) => (
                  <TableRow key={character.id}>
                    <TableCell className="font-medium">{character.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {character.franchise || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{character.status || "active"}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {character.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" />}
                          aria-label={`Acciones para ${character.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(character)}>
                            <Pencil className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setDeleteError(null)
                              setDeleting(character)
                            }}
                          >
                            <Trash2 className="size-4" />
                            Eliminar
                          </DropdownMenuItem>
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
            <DialogTitle>{editing ? "Editar personaje" : "Nuevo personaje"}</DialogTitle>
            <DialogDescription>
              Registra el personaje, franquicia y estado para asociarlo a diseños.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {formError && (
              <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="franchise">Franquicia</Label>
              <Input id="franchise" value={form.franchise ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, franchise: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Input id="status" value={form.status ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} placeholder="active" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" value={form.notes ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
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
            <DialogTitle>Eliminar personaje</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar a {deleting?.name}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Eliminando..." : "Eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
