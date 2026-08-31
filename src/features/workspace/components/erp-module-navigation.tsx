import { NavLink, useLocation } from "react-router"

import { paths } from "@/app/router/paths"
import { ErpModuleRouteCard } from "@/features/workspace/components/erp-module-route-card"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

type ErpModuleNavigationItem = {
  label: string
  path?: string
  tone: string
}

const receptionModule: ErpModuleNavigationItem = {
  label: "Recep.",
  path: paths.purchaseReceptions,
  tone:
    "border-module-reception/70 bg-module-reception text-module-reception-foreground hover:bg-module-reception/85",
}
const ordersModule: ErpModuleNavigationItem = {
  label: "Ordenes",
  path: paths.purchaseOrders,
  tone:
    "border-module-reception/70 bg-module-reception text-module-reception-foreground hover:bg-module-reception/85",
}
const rawMaterialsModule: ErpModuleNavigationItem = {
  label: "Inventarios M.P.",
  path: paths.inventoryProducts,
  tone:
    "border-module-raw-materials/70 bg-module-raw-materials text-module-raw-materials-foreground hover:bg-module-raw-materials/85",
}
const accountsPayableModule: ErpModuleNavigationItem = {
  label: "Cuentas x pagar",
  path: paths.accountsPayableSuppliers,
  tone:
    "border-module-payable/70 bg-module-payable text-module-payable-foreground hover:bg-module-payable/85",
}
const productionModule: ErpModuleNavigationItem = {
  label: "Producción",
  tone:
    "border-module-production/70 bg-module-production text-module-production-foreground hover:bg-module-production/85",
}
const accountingModule: ErpModuleNavigationItem = {
  label: "Contabilidad",
  path: paths.accountingPolicies,
  tone:
    "border-module-accounting/70 bg-module-accounting text-module-accounting-foreground hover:bg-module-accounting/85",
}
const bankingModule: ErpModuleNavigationItem = {
  label: "Bancos",
  path: paths.bankAccounts,
  tone:
    "border-module-banking/70 bg-module-banking text-module-banking-foreground hover:bg-module-banking/85",
}
const finishedProductsModule: ErpModuleNavigationItem = {
  label: "Inventarios P.T.",
  path: paths.inventoryProducts,
  tone:
    "border-module-inventory/70 bg-module-inventory text-module-inventory-foreground hover:bg-module-inventory/85",
}
const accountsReceivableModule: ErpModuleNavigationItem = {
  label: "Cuentas x cobrar",
  path: paths.accountsReceivableClients,
  tone:
    "border-module-receivable/70 bg-module-receivable text-module-receivable-foreground hover:bg-module-receivable/85",
}
const salesOrdersModule: ErpModuleNavigationItem = {
  label: "Pedidos",
  path: paths.salesOrders,
  tone:
    "border-module-sales/70 bg-module-sales text-module-sales-foreground hover:bg-module-sales/85",
}
const invoicingModule: ErpModuleNavigationItem = {
  label: "Factura",
  path: paths.salesInvoices,
  tone:
    "border-module-sales/70 bg-module-sales text-module-sales-foreground hover:bg-module-sales/85",
}

type ModuleButtonProps = {
  module: ErpModuleNavigationItem
  active: boolean
}

function ModuleButton({ module, active }: ModuleButtonProps) {
  return (
    <div className="pb-[7px]">
      {module.path ? (
        <Button
          className={cn(
            "w-full uppercase",
            module.tone,
            active && "ring-2 ring-ring ring-offset-1",
          )}
          nativeButton={false}
          render={<NavLink to={module.path} />}
          size="sm"
          variant="outline"
        >
          {module.label}
        </Button>
      ) : (
        <Button
          className={cn(
            "w-full uppercase disabled:opacity-100",
            module.tone,
          )}
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
  const location = useLocation()
  const half = (module: ErpModuleNavigationItem, side: "left" | "right") => {
    const classes = cn(
      "w-1/2 shrink px-1 uppercase disabled:opacity-100",
      side === "left" ? "rounded-r-none border-r-0" : "rounded-l-none",
      module.tone,
      module.path && location.pathname.startsWith(module.path) && "ring-2 ring-ring ring-offset-1",
    )
    return module.path ? (
      <Button className={classes} nativeButton={false} render={<NavLink to={module.path} />} size="sm" variant="outline">{module.label}</Button>
    ) : (
      <Button className={classes} disabled size="sm" variant="outline">{module.label}</Button>
    )
  }
  return (
    <div className="flex w-full gap-0 pb-[7px]">
      {half(left, "left")}
      {half(right, "right")}
    </div>
  )
}

export function ErpModuleNavigation() {
  const location = useLocation()
  const isActive = (module: ErpModuleNavigationItem) =>
    module.path !== undefined && location.pathname.startsWith(module.path)

  return (
    <nav aria-label="Módulos del ERP" className="overflow-x-auto border-b bg-card">
      <div className="mx-auto grid w-full min-w-[74rem] grid-cols-[200px_minmax(0,1fr)_300px] items-start gap-2 px-2 py-3">
        <div aria-hidden />
        <div className="flex items-start justify-self-center gap-[6px]">
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

        <div className="justify-self-end">
          <ErpModuleRouteCard pathname={location.pathname} />
        </div>
      </div>
    </nav>
  )
}
