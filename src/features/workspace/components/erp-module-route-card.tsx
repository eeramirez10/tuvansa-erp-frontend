import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon"
import PackageIcon from "@hugeicons/core-free-icons/PackageIcon"
import { HugeiconsIcon } from "@hugeicons/react"

import { paths } from "@/app/router/paths"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"

type ErpModuleRouteCardProps = {
  pathname: string
}

const routeCards = [
  {
    matches: (pathname: string) => pathname.startsWith(paths.inventoryProducts),
    title: "Inventarios",
    abbreviation: "P.T.",
    icon: PackageIcon,
    tone:
      "border-module-inventory/70 bg-module-inventory text-module-inventory-foreground",
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
    <Card
      className={cn(
        "h-20 w-[260px] shrink-0 justify-center py-0 shadow-sm",
        routeCard.tone,
      )}
      size="sm"
    >
      <CardContent className="flex h-full items-center justify-between gap-4 px-4">
        <p className="text-lg/tight font-bold tracking-tight">{routeCard.title}</p>
        <div className="flex items-center gap-2 rounded-md border border-current/20 bg-background/15 px-2 py-1.5">
          <span className="text-xs font-bold">{routeCard.abbreviation}</span>
          <HugeiconsIcon className="size-8" icon={routeCard.icon} strokeWidth={1.8} />
        </div>
      </CardContent>
    </Card>
  )
}
