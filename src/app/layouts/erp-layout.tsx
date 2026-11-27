import { Outlet, useLocation } from "react-router"
import { ProscaiMenu } from "@/features/general-data/users/components/proscai-menu"

import { ErpModuleNavigation } from "@/features/workspace/components/erp-module-navigation"
import { ReportsMenu } from "@/features/reports/components/reports-menu"
import { globalReportModules } from "@/features/reports/model"
import { getErpModuleForPath } from "@/features/workspace/module-routes"
import { DesktopWindowTaskbar } from "@/shared/ui/desktop-window-taskbar"

export function ErpLayout() {
  const { pathname } = useLocation()
  const activeModule = getErpModuleForPath(pathname)

  return (
    <div className="flex min-h-svh w-full min-w-0 flex-col bg-muted/30">
      <header className="top-0 z-10 min-w-0 border-b bg-background/95 backdrop-blur lg:sticky">
        <ProscaiMenu
          globalMenus={globalReportModules.map(moduleId => <ReportsMenu key={moduleId} moduleId={moduleId} />)}
          contextualMenus={activeModule && !globalReportModules.includes(activeModule)
            ? <ReportsMenu key={activeModule} moduleId={activeModule} />
            : null}
        />
        <ErpModuleNavigation />
      </header>
      <main className="@container/erp flex w-full min-w-0 flex-1 flex-col p-2">
        <Outlet />
      </main>
      <DesktopWindowTaskbar />
    </div>
  )
}
