import { Construction } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"

export function ComingSoon({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Construction className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Módulo en construcción</p>
          <p className="max-w-sm text-sm text-muted-foreground text-pretty">
            Esta sección estará disponible próximamente. Por ahora, el módulo de
            Clientes ya está completamente funcional.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
