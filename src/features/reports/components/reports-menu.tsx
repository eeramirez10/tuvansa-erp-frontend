import { Link } from "react-router"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { paths } from "@/app/router/paths"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"

// Extend this catalog as reports are defined; entries without a route remain disabled.
const groups: Array<{ label: string; reports: Array<{ label: string; path: string | null }> }> = [
  { label: "Reportes Financieros", reports: [
    { label: "Estado de resultados", path: paths.incomeStatement },
    { label: "Ventas por familia", path: paths.salesByFamily },
    { label: "Inventario por familia", path: paths.inventoryByFamily },
  ] },
]

export function ReportsMenu() {
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger render={<Button size="lg" variant="ghost" />}>
      Reportes <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent className="min-w-48" align="start">
      {groups.map(group => <DropdownMenuSub key={group.label}>
        <DropdownMenuSubTrigger>{group.label}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-52">
          {group.reports.map(report => report.path
            ? <DropdownMenuItem key={report.label} render={<Link to={report.path} />}>{report.label}</DropdownMenuItem>
            : <DropdownMenuItem key={report.label} disabled title="Pendiente de definir">{report.label}</DropdownMenuItem>)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>)}
    </DropdownMenuContent>
  </DropdownMenu>
}
