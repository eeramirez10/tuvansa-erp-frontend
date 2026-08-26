import Building01Icon from "@hugeicons/core-free-icons/Building01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { Outlet } from "react-router"

import {
  selectSetSidebarOpen,
  selectSidebarOpen,
  useAppStore,
} from "@/app/store"
import { AppSidebar } from "@/features/workspace/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/shared/ui/breadcrumb"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/ui/sidebar"

export function ErpLayout() {
  const sidebarOpen = useAppStore(selectSidebarOpen)
  const setSidebarOpen = useAppStore(selectSetSidebarOpen)

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
          <SidebarTrigger aria-label="Mostrar u ocultar navegación" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Inicio</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Badge className="ml-auto" variant="outline">
            <HugeiconsIcon data-icon="inline-start" icon={Building01Icon} strokeWidth={2} />
            TUVANSA
          </Badge>
        </header>
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
