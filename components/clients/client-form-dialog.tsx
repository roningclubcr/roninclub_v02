"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { Client, ClientInput, ContactMethod } from "@/lib/types"
import { createClient, updateClient } from "@/lib/clients"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSaved: () => void
}

const emptyForm: ClientInput = {
  name: "",
  phone: "",
  contact_method: "instagram",
  instagram_user: "",
  notes: "",
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: ClientFormDialogProps) {
  const isEditing = Boolean(client)
  const [form, setForm] = useState<ClientInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSaveError(null)
      setForm(
        client
          ? {
              name: client.name ?? "",
              phone: client.phone ?? "",
              contact_method: client.contact_method ?? "instagram",
              instagram_user: client.instagram_user ?? "",
              notes: client.notes ?? "",
            }
          : emptyForm,
      )
    }
  }, [open, client])

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    setSaveError(null)

    if (!form.name.trim()) {
      const message = "El nombre es obligatorio"
      setSaveError(message)
      toast.error(message)
      return
    }

    setSaving(true)
    const payload: ClientInput = {
      name: form.name.trim(),
      phone: form.phone?.trim() || null,
      contact_method: form.contact_method,
      instagram_user: form.instagram_user?.trim() || null,
      notes: form.notes?.trim() || null,
    }

    try {
      if (isEditing && client) {
        await updateClient(client.id, payload)
        toast.success("Cliente actualizado")
      } else {
        await createClient(payload)
        toast.success("Cliente creado")
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const message = getErrorMessage(err, "Error al guardar el cliente")
      console.error("Error al guardar cliente", err)
      setSaveError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza la información del cliente."
              : "Completa los datos para registrar un nuevo cliente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {saveError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {saveError}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Número de teléfono"
              inputMode="tel"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contact_method">Método de contacto</Label>
            <Select
              value={form.contact_method ?? "instagram"}
              onValueChange={(v) => set("contact_method", v as ContactMethod)}
            >
              <SelectTrigger id="contact_method">
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instagram_user">Usuario de Instagram</Label>
            <Input
              id="instagram_user"
              value={form.instagram_user ?? ""}
              onChange={(e) => set("instagram_user", e.target.value)}
              placeholder="@usuario"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Notas adicionales sobre el cliente"
              rows={3}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
