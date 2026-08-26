import { NavLink, useLocation } from "react-router"

import { paths } from "@/app/router/paths"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

type ErpModuleNavigationItem = {
  label: string
  path?: string
  color: string
}

const receptionModule: ErpModuleNavigationItem = {
  label: "Recep.",
  color: "border-[#a79519] from-[#e5d43c] to-[#bda71a]",
}

const ordersModule: ErpModuleNavigationItem = {
  label: "Ordenes",
  color: "border-[#a79519] from-[#e5d43c] to-[#bda71a]",
}

const rawMaterialsModule: ErpModuleNavigationItem = {
  label: "Inventarios M.P.",
  color: "border-[#b95624] from-[#f39a54] to-[#ca5d28]",
}

const accountsPayableModule: ErpModuleNavigationItem = {
  label: "Cuentas x pagar",
  color: "border-[#8e3049] from-[#c55772] to-[#96364f]",
}

const productionModule: ErpModuleNavigationItem = {
  label: "Producción",
  color: "border-[#806520] from-[#b89a45] to-[#86691f]",
}

const accountingModule: ErpModuleNavigationItem = {
  label: "Contabilidad",
  color: "border-[#3f652b] from-[#729e4f] to-[#466e30]",
}

const bankingModule: ErpModuleNavigationItem = {
  label: "Bancos",
  color: "border-[#7b337c] from-[#bd67b5] to-[#873c87]",
}

const finishedProductsModule: ErpModuleNavigationItem = {
  label: "Inventarios P.T.",
  path: paths.inventoryProducts,
  color: "border-[#217f89] from-[#55c1cb] to-[#278d98]",
}

const accountsReceivableModule: ErpModuleNavigationItem = {
  label: "Cuentas x cobrar",
  color: "border-[#1769a8] from-[#459fdc] to-[#2478bc]",
}

const salesOrdersModule: ErpModuleNavigationItem = {
  label: "Pedidos",
  color: "border-[#30428c] from-[#6074c8] to-[#3b4d9c]",
}

const invoicingModule: ErpModuleNavigationItem = {
  label: "Factura",
  color: "border-[#35418d] from-[#6b72ca] to-[#444da5]",
}

const moduleButtonClassName =
  "h-[22px] w-full rounded-full bg-gradient-to-b px-1 text-[8px]/none font-semibold tracking-wide text-white uppercase shadow-[inset_0_1px_0_rgb(255_255_255/45%),inset_0_-1px_0_rgb(0_0_0/20%),0_1px_1px_rgb(0_0_0/25%)] disabled:opacity-100"

type ModuleButtonProps = {
  module: ErpModuleNavigationItem
  active: boolean
}

function ModuleButton({ module, active }: ModuleButtonProps) {
  const className = cn(
    moduleButtonClassName,
    module.color,
    active &&
      "z-10 brightness-110 ring-2 ring-[#176772] ring-offset-1 ring-offset-[#e4ecef]",
  )

  return module.path ? (
    <Button
      className={className}
      nativeButton={false}
      render={<NavLink to={module.path} />}
      variant="ghost"
    >
      {module.label}
    </Button>
  ) : (
    <Button className={className} disabled variant="ghost">
      {module.label}
    </Button>
  )
}

type SplitModuleButtonProps = {
  left: ErpModuleNavigationItem
  right: ErpModuleNavigationItem
}

function SplitModuleButton({ left, right }: SplitModuleButtonProps) {
  return (
    <div className="flex w-full gap-0">
      <Button
        className={cn(
          moduleButtonClassName,
          left.color,
          "rounded-r-none border-r-0 px-0.5",
        )}
        disabled={!left.path}
        variant="ghost"
      >
        {left.label}
      </Button>
      <Button
        className={cn(
          moduleButtonClassName,
          right.color,
          "rounded-l-none px-0.5",
        )}
        disabled={!right.path}
        variant="ghost"
      >
        {right.label}
      </Button>
    </div>
  )
}

export function ErpModuleNavigation() {
  const location = useLocation()
  const isActive = (module: ErpModuleNavigationItem) =>
    module.path !== undefined && location.pathname.startsWith(module.path)

  return (
    <nav
      aria-label="Módulos del ERP"
      className="overflow-x-auto border-b border-[#9ba8ad] bg-gradient-to-b from-[#f7fafb] to-[#d8e1e5]"
    >
      <div className="mx-auto flex min-w-[40rem] items-start justify-center gap-1.5 px-3 py-1.5">
        <div className="mt-4 w-[7.5rem] shrink-0">
          <SplitModuleButton left={receptionModule} right={ordersModule} />
        </div>

        <div className="mt-[10px] flex w-[7.5rem] shrink-0 flex-col gap-1">
          <ModuleButton
            active={isActive(rawMaterialsModule)}
            module={rawMaterialsModule}
          />
          <ModuleButton
            active={isActive(accountsPayableModule)}
            module={accountsPayableModule}
          />
        </div>

        <div className="flex w-[7.5rem] shrink-0 flex-col gap-1">
          <ModuleButton
            active={isActive(productionModule)}
            module={productionModule}
          />
          <ModuleButton
            active={isActive(accountingModule)}
            module={accountingModule}
          />
          <ModuleButton active={isActive(bankingModule)} module={bankingModule} />
        </div>

        <div className="mt-[10px] flex w-[7.5rem] shrink-0 flex-col gap-1">
          <ModuleButton
            active={isActive(finishedProductsModule)}
            module={finishedProductsModule}
          />
          <ModuleButton
            active={isActive(accountsReceivableModule)}
            module={accountsReceivableModule}
          />
        </div>

        <div className="mt-4 w-[7.5rem] shrink-0">
          <SplitModuleButton left={salesOrdersModule} right={invoicingModule} />
        </div>
      </div>
    </nav>
  )
}
