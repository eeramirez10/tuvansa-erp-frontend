import { NavLink, useLocation } from "react-router"

import { paths } from "@/app/router/paths"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

type ErpModuleNavigationItem = {
  label: string
  path?: string
  position: string
  color: string
}

const modules: readonly ErpModuleNavigationItem[] = [
  {
    label: "Recep.",
    position: "col-start-1 row-start-2",
    color: "border-[#a79519] from-[#e5d43c] to-[#bda71a]",
  },
  {
    label: "Órdenes",
    position: "col-start-2 row-start-2",
    color: "border-[#a79519] from-[#e5d43c] to-[#bda71a]",
  },
  {
    label: "Inventarios M.P.",
    position: "col-span-2 col-start-3 row-start-1",
    color: "border-[#b95624] from-[#f39a54] to-[#ca5d28]",
  },
  {
    label: "Producción",
    position: "col-span-2 col-start-5 row-start-1",
    color: "border-[#806520] from-[#b89a45] to-[#86691f]",
  },
  {
    label: "Contabilidad",
    position: "col-span-2 col-start-5 row-start-2",
    color: "border-[#3f652b] from-[#729e4f] to-[#466e30]",
  },
  {
    label: "Cuentas x pagar",
    position: "col-span-2 col-start-3 row-start-2",
    color: "border-[#8e3049] from-[#c55772] to-[#96364f]",
  },
  {
    label: "Bancos",
    position: "col-span-2 col-start-5 row-start-3",
    color: "border-[#7b337c] from-[#bd67b5] to-[#873c87]",
  },
  {
    label: "Inventarios P.T.",
    path: paths.inventoryProducts,
    position: "col-span-2 col-start-7 row-start-1",
    color: "border-[#217f89] from-[#55c1cb] to-[#278d98]",
  },
  {
    label: "Cuentas x cobrar",
    position: "col-span-2 col-start-7 row-start-2",
    color: "border-[#1769a8] from-[#459fdc] to-[#2478bc]",
  },
  {
    label: "Pedidos",
    position: "col-start-9 row-start-2",
    color: "border-[#30428c] from-[#6074c8] to-[#3b4d9c]",
  },
  {
    label: "Factura",
    position: "col-start-10 row-start-2",
    color: "border-[#35418d] from-[#6b72ca] to-[#444da5]",
  },
]

const moduleButtonClassName =
  "h-5 w-full rounded-full bg-gradient-to-b px-1 text-[8px]/none font-semibold tracking-wide text-white uppercase shadow-[inset_0_1px_0_rgb(255_255_255/45%),0_1px_1px_rgb(0_0_0/25%)] disabled:opacity-100"

export function ErpModuleNavigation() {
  const location = useLocation()

  return (
    <nav
      aria-label="Módulos del ERP"
      className="overflow-x-auto border-b border-[#9ba8ad] bg-gradient-to-b from-[#f7fafb] to-[#d8e1e5]"
    >
      <div className="mx-auto grid min-w-[35rem] max-w-[42rem] grid-cols-10 grid-rows-3 gap-x-0.5 gap-y-1 px-2 py-1.5">
        {modules.map((module) => {
          const isActive =
            module.path !== undefined && location.pathname.startsWith(module.path)
          const className = cn(
            moduleButtonClassName,
            module.position,
            module.color,
            isActive &&
              "z-10 brightness-110 ring-2 ring-[#176772] ring-offset-1 ring-offset-[#e4ecef]",
          )

          return module.path ? (
            <Button
              className={className}
              key={module.label}
              nativeButton={false}
              render={<NavLink to={module.path} />}
              variant="ghost"
            >
              {module.label}
            </Button>
          ) : (
            <Button
              className={className}
              disabled
              key={module.label}
              variant="ghost"
            >
              {module.label}
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
