import Database01Icon from "@hugeicons/core-free-icons/Database01Icon"
import ServerStack01Icon from "@hugeicons/core-free-icons/ServerStack01Icon"
import { HugeiconsIcon } from "@hugeicons/react"

import { ModuleCard } from "@/features/workspace/components/module-card"
import { erpModules } from "@/features/workspace/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"

export function WorkspacePage() {
  return (
    <section className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Espacio de trabajo</p>
          <h1 className="text-xl font-semibold tracking-tight">TUVANSA ERP</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Base del nuevo sistema, preparada para migrar cada catálogo conservando el flujo de trabajo de OMNIS.
          </p>
        </div>
        <Badge variant="outline">Base UI · Mira</Badge>
      </div>

      <Alert>
        <HugeiconsIcon icon={ServerStack01Icon} strokeWidth={2} />
        <AlertTitle>Frontend preparado para consumir la API</AlertTitle>
        <AlertDescription>
          Axios centraliza las peticiones y TanStack Query administrará caché, estados de carga y actualización.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-2">
        {erpModules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>

      <div className="mt-auto flex min-w-0 items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <HugeiconsIcon icon={Database01Icon} strokeWidth={2} />
        <span className="min-w-0">Datos heredados: MySQL de pruebas mediante tuvansa-erp-api.</span>
      </div>
    </section>
  )
}
