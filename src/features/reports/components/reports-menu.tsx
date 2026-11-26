import { Link } from "react-router"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { reportGroupsByModule, reportMenuLabels } from "@/features/reports/model"
import { erpModuleNames, type ErpModuleId } from "@/features/workspace/module-routes"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"

export function ReportsMenu({ moduleId }: { moduleId: ErpModuleId }) {
  const groups = reportGroupsByModule[moduleId]?.filter(group => group.reports.length > 0)
  if (!groups?.length) return null
  const label = reportMenuLabels[moduleId] ?? `Reportes ${erpModuleNames[moduleId]}`

  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
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
  </DropdownMenu>
}
