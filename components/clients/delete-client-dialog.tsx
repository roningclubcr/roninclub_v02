"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { Client } from "@/lib/types"
import { deleteClient } from "@/lib/clients"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteClientDialogProps {
  client: Client | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export function DeleteClientDialog({
  client,
  onOpenChange,
  onDeleted,
}: DeleteClientDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (client) setDeleteError(null)
  }, [client])

  async function handleDelete() {
    if (!client) return
    setDeleting(true)
    setDeleteError(null)

    try {
      await deleteClient(client.id)
      toast.success("Cliente eliminado")
      onOpenChange(false)
      onDeleted()
    } catch (err) {
      const message = getErrorMessage(err, "Error al eliminar el cliente")
      console.error("Error al eliminar cliente", err)
      setDeleteError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={Boolean(client)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar a{" "}
            <span className="font-medium text-foreground">{client?.name}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {deleteError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {deleteError}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
