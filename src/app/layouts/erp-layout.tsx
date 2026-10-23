import { Outlet, useLocation } from "react-router"

import { ErpModuleNavigation } from "@/features/workspace/components/erp-module-navigation"
import { AccountingReportsMenu } from "@/features/accounting/reports/components/accounting-reports-menu"
import { DesktopWindowTaskbar } from "@/shared/ui/desktop-window-taskbar"

export function ErpLayout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-svh min-w-0 flex-col bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        {pathname.startsWith("/contabilidad/") && <nav aria-label="Reportes de contabilidad" className="flex min-h-8 items-center border-b px-2"><AccountingReportsMenu /></nav>}
        <ErpModuleNavigation />
      </header>
      <main className="flex min-w-0 flex-1 flex-col p-2">
        <Outlet />
      </main>
      <DesktopWindowTaskbar />
    </div>
  )
}
