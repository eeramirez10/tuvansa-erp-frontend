import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, type ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { paths } from "@/app/router/paths"
import { companySessionKey } from "@/features/startup/multicia/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { isTypingOrInDialog } from "@/shared/ui/erp-shortcuts"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { signInPath, webSessionKey, webSessionOptions } from "../logic"
import { endWebSession } from "../services/users-service"

export function ProscaiMenu({ globalMenus, contextualMenus }: { globalMenus: ReactNode; contextualMenus: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const session = useQuery(webSessionOptions)
  const logout = useMutation({
    mutationFn: endWebSession,
    onSuccess: async () => {
      sessionStorage.removeItem(companySessionKey)
      await queryClient.cancelQueries()
      queryClient.clear()
      queryClient.setQueryData(webSessionKey, null)
      void navigate(paths.signIn, { replace: true })
    },
  })
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.altKey || event.metaKey || event.shiftKey || isTypingOrInDialog(event)) return
      if (event.key === "F10" && !event.ctrlKey) {
        event.preventDefault()
        void navigate(paths.generalData)
      } else if (event.ctrlKey && event.key.toLowerCase() === "u") {
        event.preventDefault()
        void navigate(paths.users)
      }
    }
    window.addEventListener("keydown", shortcut)
    return () => window.removeEventListener("keydown", shortcut)
  }, [navigate])

  return (
    <nav aria-label="Menús del ERP" className="flex min-h-8 flex-wrap items-center gap-1 border-b px-2">
      <div className="flex shrink-0 items-center gap-1">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>Proscai</DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem render={<Link to={paths.generalData} />}>Datos Generales<DropdownMenuShortcut>F10</DropdownMenuShortcut></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {globalMenus}
      </div>
      {contextualMenus}
      {location.pathname.startsWith(paths.generalData) && session.data?.capabilities.generalData && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>Datos Generales</DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Catálogos</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem disabled={!session.data.capabilities.users}
                  render={session.data.capabilities.users ? <Link to={paths.users} /> : undefined}>
                  Usuarios<DropdownMenuShortcut>Ctrl+U</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <div className="ml-auto flex items-center gap-2">
        {logout.error && <span role="alert" className="text-xs text-destructive">{getApiErrorMessage(logout.error)}</span>}
        {session.data ? <>
          <span className="text-xs text-muted-foreground">{session.data.user.name || session.data.user.identification}</span>
          <Button variant="ghost" size="sm" disabled={logout.isPending} onClick={() => logout.mutate()}>Cerrar sesión</Button>
        </> : <Button variant="ghost" size="sm" render={<Link to={signInPath(location.pathname + location.search + location.hash)} />}>Iniciar sesión</Button>}
      </div>
    </nav>
  )
}
