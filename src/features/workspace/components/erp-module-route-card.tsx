import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon"
import PackageIcon from "@hugeicons/core-free-icons/PackageIcon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { HugeiconsIcon } from "@hugeicons/react"

import { paths } from "@/app/router/paths"
import { ErpModuleToolbarSlot } from "@/features/workspace/components/erp-module-toolbar-portal"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"

type ErpModuleRouteCardProps = {
  pathname: string
}

const routeCards = [
  {
    matches: (pathname: string) =>
      pathname.startsWith(paths.accountsReceivableClients),
    title: "Clientes",
    abbreviation: "CXC",
    icon: UserGroupIcon,
    tone:
      "border-module-receivable/70 bg-module-receivable text-module-receivable-foreground",
  },
  {
    matches: (pathname: string) => pathname.startsWith(paths.inventoryProducts),
    title: "Inventarios",
    abbreviation: "P.T.",
    icon: PackageIcon,
    tone:
      "border-module-inventory/70 bg-module-inventory text-module-inventory-foreground",
  },
  {
    matches: (pathname: string) => pathname.startsWith(paths.salesOrders),
    title: "Pedidos",
    abbreviation: "VTAS",
    icon: PackageIcon,
    tone: "border-module-sales/70 bg-module-sales text-module-sales-foreground",
  },
] as const

const fallbackCard = {
  title: "Módulos",
  abbreviation: "ERP",
  icon: DashboardSquare01Icon,
  tone: "border-primary/70 bg-primary text-primary-foreground",
}

export function ErpModuleRouteCard({ pathname }: ErpModuleRouteCardProps) {
  const routeCard =
    routeCards.find((candidate) => candidate.matches(pathname)) ?? fallbackCard

  return (
    <div className="flex w-[260px] shrink-0 flex-col gap-1">
      <Card
        className={cn(
          "h-20 w-full justify-center py-0 shadow-sm",
          routeCard.tone,
        )}
        size="sm"
      >
        <CardContent className="flex h-full items-center justify-between gap-4 px-4">
          <p className="text-lg/tight font-bold tracking-tight">
            {routeCard.title}
          </p>
          <div className="flex items-center gap-2 rounded-md border border-current/20 bg-background/15 px-2 py-1.5">
            <span className="text-xs font-bold">{routeCard.abbreviation}</span>
            <HugeiconsIcon
              className="size-8"
              icon={routeCard.icon}
              strokeWidth={1.8}
            />
          </div>
        </CardContent>
      </Card>
      <ErpModuleToolbarSlot />
    </div>
  )
}
