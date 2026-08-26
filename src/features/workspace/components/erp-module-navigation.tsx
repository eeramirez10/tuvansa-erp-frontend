import { NavLink, useLocation } from "react-router"

import { paths } from "@/app/router/paths"
import { Button } from "@/shared/ui/button"

type ErpModuleNavigationItem = {
  label: string
  path?: string
}

const receptionModule: ErpModuleNavigationItem = { label: "Recep." }
const ordersModule: ErpModuleNavigationItem = { label: "Ordenes" }
const rawMaterialsModule: ErpModuleNavigationItem = {
  label: "Inventarios M.P.",
}
const accountsPayableModule: ErpModuleNavigationItem = {
  label: "Cuentas x pagar",
}
const productionModule: ErpModuleNavigationItem = { label: "Producción" }
const accountingModule: ErpModuleNavigationItem = { label: "Contabilidad" }
const bankingModule: ErpModuleNavigationItem = { label: "Bancos" }
const finishedProductsModule: ErpModuleNavigationItem = {
  label: "Inventarios P.T.",
  path: paths.inventoryProducts,
}
const accountsReceivableModule: ErpModuleNavigationItem = {
  label: "Cuentas x cobrar",
}
const salesOrdersModule: ErpModuleNavigationItem = { label: "Pedidos" }
const invoicingModule: ErpModuleNavigationItem = { label: "Factura" }

type ModuleButtonProps = {
  module: ErpModuleNavigationItem
  active: boolean
}

function ModuleButton({ module, active }: ModuleButtonProps) {
  return (
    <div className="pb-[7px]">
      {module.path ? (
        <Button
          className="w-full uppercase"
          nativeButton={false}
          render={<NavLink to={module.path} />}
          size="sm"
          variant={active ? "default" : "outline"}
        >
          {module.label}
        </Button>
      ) : (
        <Button
          className="w-full uppercase disabled:opacity-100"
          disabled
          size="sm"
          variant="outline"
        >
          {module.label}
        </Button>
      )}
    </div>
  )
}

type SplitModuleButtonProps = {
  left: ErpModuleNavigationItem
  right: ErpModuleNavigationItem
}

function SplitModuleButton({ left, right }: SplitModuleButtonProps) {
  return (
    <div className="flex w-full gap-0 pb-[7px]">
      <Button
        className="w-1/2 shrink rounded-r-none border-r-0 px-1 uppercase disabled:opacity-100"
        disabled
        size="sm"
        variant="outline"
      >
        {left.label}
      </Button>
      <Button
        className="w-1/2 shrink rounded-l-none px-1 uppercase disabled:opacity-100"
        disabled
        size="sm"
        variant="outline"
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
    <nav aria-label="Módulos del ERP" className="overflow-x-auto border-b bg-card">
      <div className="mx-auto flex min-w-[40rem] items-start justify-center gap-[6px] px-3 py-3">
        <div className="mt-4 flex w-[120px] shrink-0 flex-col gap-1">
          <SplitModuleButton left={receptionModule} right={ordersModule} />
        </div>

        <div className="mt-[10px] flex w-[120px] shrink-0 flex-col gap-1">
          <ModuleButton
            active={isActive(rawMaterialsModule)}
            module={rawMaterialsModule}
          />
          <ModuleButton
            active={isActive(accountsPayableModule)}
            module={accountsPayableModule}
          />
        </div>

        <div className="flex w-[120px] shrink-0 flex-col gap-1">
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

        <div className="mt-[10px] flex w-[120px] shrink-0 flex-col gap-1">
          <ModuleButton
            active={isActive(finishedProductsModule)}
            module={finishedProductsModule}
          />
          <ModuleButton
            active={isActive(accountsReceivableModule)}
            module={accountsReceivableModule}
          />
        </div>

        <div className="mt-4 flex w-[120px] shrink-0 flex-col gap-1">
          <SplitModuleButton left={salesOrdersModule} right={invoicingModule} />
        </div>
      </div>
    </nav>
  )
}
