import Building01Icon from "@hugeicons/core-free-icons/Building01Icon"
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { NavLink, Outlet } from "react-router"

import { paths } from "@/app/router/paths"
import { ErpModuleNavigation } from "@/features/workspace/components/erp-module-navigation"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

export function ErpLayout() {
  return (
    <div className="flex min-h-svh min-w-0 flex-col bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex h-8 items-center gap-1.5 px-2">
          <Button
            aria-label="Ir al inicio"
            nativeButton={false}
            render={<NavLink to={paths.home} />}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-[11px]/tight font-semibold">TUVANSA ERP</p>
            <p className="truncate text-[9px]/tight text-muted-foreground">Migración de OMNIS</p>
          </div>
          <Badge className="ml-auto" variant="outline">
            <HugeiconsIcon
              data-icon="inline-start"
              icon={Building01Icon}
              strokeWidth={2}
            />
            TUVANSA
          </Badge>
        </div>
        <ErpModuleNavigation />
      </header>
      <main className="flex min-w-0 flex-1 flex-col p-2">
        <Outlet />
      </main>
    </div>
  )
}
