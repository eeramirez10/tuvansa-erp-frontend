import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"
import { signInPath, webSessionOptions } from "../logic"
import type { WebSession } from "../model"

export function WebAccessGate({ capability, children }: {
  capability: "generalData" | "users"; children: (session: WebSession) => ReactNode
}) {
  const session = useQuery(webSessionOptions)
  const location = useLocation()
  if (session.isPending) return <p className="flex items-center gap-2 p-3"><Spinner />Consultando sesión</p>
  if (session.isError) return (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center gap-2">
        {getApiErrorMessage(session.error)}
        <Button variant="outline" onClick={() => void session.refetch()}>Reintentar</Button>
      </AlertDescription>
    </Alert>
  )
  if (!session.data) return <Navigate replace to={signInPath(location.pathname + location.search + location.hash)} />
  if (!session.data.capabilities[capability]) return (
    <Alert variant="destructive"><AlertDescription>Tu usuario no tiene permiso para abrir esta opción.</AlertDescription></Alert>
  )
  return children(session.data)
}
