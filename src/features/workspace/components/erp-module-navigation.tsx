import { NavLink, useLocation } from "react-router"

import { paths } from "@/app/router/paths"
import { Button } from "@/shared/ui/button"

type ErpModuleNavigationItem = {
  label: string
  path?: string
}

const modules: readonly ErpModuleNavigationItem[] = [
  { label: "Recep." },
  { label: "Órdenes" },
  { label: "Inventarios M.P." },
  { label: "Producción" },
  { label: "Contabilidad" },
  { label: "Cuentas x pagar" },
  { label: "Bancos" },
  { label: "Inventarios P.T.", path: paths.inventoryProducts },
  { label: "Cuentas x cobrar" },
  { label: "Pedidos" },
  { label: "Factura" },
]

export function ErpModuleNavigation() {
  const location = useLocation()

  return (
    <nav aria-label="Módulos del ERP" className="overflow-x-auto border-t">
      <div className="mx-auto flex min-w-max items-center justify-center gap-1 px-3 py-2">
        {modules.map((module) => {
          const isActive =
            module.path !== undefined && location.pathname.startsWith(module.path)

          return module.path ? (
            <Button
              key={module.label}
              render={<NavLink to={module.path} />}
              size="sm"
              variant={isActive ? "default" : "outline"}
            >
              {module.label}
            </Button>
          ) : (
            <Button key={module.label} disabled size="sm" variant="outline">
              {module.label}
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
