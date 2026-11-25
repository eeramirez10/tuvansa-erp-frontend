import { Outlet } from "react-router"
import { ProscaiMenu } from "@/features/general-data/users/components/proscai-menu"

import { ErpModuleNavigation } from "@/features/workspace/components/erp-module-navigation"
import { ReportsMenu } from "@/features/reports/components/reports-menu"
import { DesktopWindowTaskbar } from "@/shared/ui/desktop-window-taskbar"

export function ErpLayout() {
  return (
    <div className="flex min-h-svh min-w-0 flex-col bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <ProscaiMenu />
        <ReportsMenu />
        <ErpModuleNavigation />
      </header>
      <main className="flex min-w-0 flex-1 flex-col p-2">
        <Outlet />
      </main>
      <DesktopWindowTaskbar />
    </div>
  )
}
