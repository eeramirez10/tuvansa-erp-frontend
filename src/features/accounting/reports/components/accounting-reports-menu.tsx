import { Link } from "react-router"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { paths } from "@/app/router/paths"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"

const reports = [{ label: "Estado de resultados", path: paths.incomeStatement }]

export function AccountingReportsMenu() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<Button size="lg" variant="ghost" />}>
        Reportes <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-48" align="start">
        {reports.map(report => (
          <DropdownMenuItem key={report.path} render={<Link to={report.path} />}>
            {report.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
