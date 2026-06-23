"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  Plus,
  Search,
  AtSign,
  Phone,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react"
import type { Client } from "@/lib/types"
import { fetchClients } from "@/lib/clients"
import { PageHeader } from "@/components/page-header"
import { ClientFormDialog } from "@/components/clients/client-form-dialog"
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function ContactBadge({ client }: { client: Client }) {
  if (client.contact_method === "instagram") {
    return (
      <Badge variant="secondary" className="gap-1">
        <AtSign className="size-3" />
        Instagram
      </Badge>
    )
  }
  if (client.contact_method === "whatsapp") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Phone className="size-3" />
        WhatsApp
      </Badge>
    )
  }
  return <span className="text-muted-foreground">—</span>
}

export default function ClientsPage() {
  const { data: clients, isLoading, error, mutate } = useSWR(
    "clients",
    fetchClients,
  )
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)

  const filtered = useMemo(() => {
    if (!clients) return []
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.instagram_user ?? "").toLowerCase().includes(q),
    )
  }, [clients, query])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Administra la base de clientes de Ronin Club."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o usuario"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">
              Error al cargar los clientes: {error.message}
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
                <Users className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                {query ? "Sin resultados" : "Aún no hay clientes"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                {query
                  ? "Prueba con otro término de búsqueda."
                  : "Crea tu primer cliente para empezar."}
              </p>
              {!query && (
                <Button onClick={openCreate} className="mt-1">
                  <Plus className="size-4" />
                  Nuevo cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <ContactBadge client={client} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.instagram_user || "—"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {client.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" />
                            }
                            aria-label={`Acciones para ${client.name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(client)}>
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleting(client)}
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
            </div>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        onSaved={() => mutate()}
      />

      <DeleteClientDialog
        client={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => mutate()}
      />
    </>
  )
}
