import { Link, useLocation } from "react-router"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { reportGroupsByModule, reportMenuLabels } from "@/features/reports/model"
import { erpModuleNames, getErpModuleForPath } from "@/features/workspace/module-routes"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"

export function ReportsMenu() {
  const { pathname } = useLocation()
  const moduleId = getErpModuleForPath(pathname)
  const groups = moduleId ? reportGroupsByModule[moduleId]?.filter(group => group.reports.length > 0) : undefined
  if (!moduleId || !groups?.length) return null
  const label = reportMenuLabels[moduleId] ?? `Reportes ${erpModuleNames[moduleId]}`

  return <nav aria-label={label} className="flex min-h-8 items-center border-b px-2"><DropdownMenu key={moduleId} modal={false}>
    <DropdownMenuTrigger render={<Button size="lg" variant="ghost" />}>
      {label} <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
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
  </DropdownMenu></nav>
}
