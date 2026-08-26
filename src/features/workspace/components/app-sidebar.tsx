import Home01Icon from "@hugeicons/core-free-icons/Home01Icon"
import Invoice01Icon from "@hugeicons/core-free-icons/Invoice01Icon"
import PackageIcon from "@hugeicons/core-free-icons/PackageIcon"
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { NavLink, useLocation } from "react-router"

import { paths } from "@/app/router/paths"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/ui/sidebar"

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="TUVANSA ERP">
              <span className="grid aspect-square size-8 place-items-center rounded-md bg-primary font-semibold text-primary-foreground">
                TV
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-semibold">TUVANSA ERP</span>
                <span className="truncate text-muted-foreground">Migración web</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === paths.home}
                  render={<NavLink to={paths.home} />}
                  tooltip="Inicio"
                >
                  <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                  <span>Inicio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled tooltip="Cuentas por cobrar">
                  <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />
                  <span>Cuentas por cobrar</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>API</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled tooltip="Inventarios PT">
                  <HugeiconsIcon icon={PackageIcon} strokeWidth={2} />
                  <span>Inventarios PT</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>API</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled tooltip="Configuración">
              <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
              <span>Configuración</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
