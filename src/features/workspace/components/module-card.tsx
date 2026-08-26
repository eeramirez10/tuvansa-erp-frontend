import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Invoice01Icon from "@hugeicons/core-free-icons/Invoice01Icon"
import PackageIcon from "@hugeicons/core-free-icons/PackageIcon"
import { HugeiconsIcon } from "@hugeicons/react"

import type { ErpModule } from "@/features/workspace/model"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"

const moduleIcons = {
  "accounts-receivable": Invoice01Icon,
  "finished-goods-inventory": PackageIcon,
} as const

type ModuleCardProps = {
  module: ErpModule
}

export function ModuleCard({ module }: ModuleCardProps) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-muted text-foreground">
            <HugeiconsIcon icon={moduleIcons[module.id]} strokeWidth={2} />
          </span>
          <CardTitle>{module.name}</CardTitle>
        </div>
        <CardDescription>{module.description}</CardDescription>
        <CardAction>
          <Badge variant="secondary">API disponible</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid min-w-0 gap-1 rounded-md border bg-muted/30 p-2">
          <div className="grid grid-cols-2 items-center gap-3">
            <dt className="text-muted-foreground">Referencia en OMNIS</dt>
            <dd className="text-right font-medium break-words">{module.legacyShortcut}</dd>
          </div>
          <div className="grid grid-cols-2 items-center gap-3">
            <dt className="text-muted-foreground">Estado del frontend</dt>
            <dd className="text-right font-medium break-words">Pendiente de módulo</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="mt-auto border-t">
        <Button className="w-full" disabled variant="outline">
          Se implementará en su rama
          <HugeiconsIcon data-icon="inline-end" icon={ArrowRight01Icon} strokeWidth={2} />
        </Button>
      </CardFooter>
    </Card>
  )
}
