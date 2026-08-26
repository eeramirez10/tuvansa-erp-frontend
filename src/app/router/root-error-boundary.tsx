import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { isRouteErrorResponse, useRouteError } from "react-router"

import { Button } from "@/shared/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"

function getErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Ocurrió un error inesperado al cargar el ERP."
}

export function RootErrorBoundary() {
  const error = useRouteError()

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <div className="flex w-full max-w-lg flex-col gap-3">
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertTitle>No fue posible abrir esta pantalla</AlertTitle>
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.assign("/")}>
          <HugeiconsIcon data-icon="inline-start" icon={Home01Icon} strokeWidth={2} />
          Volver al inicio
        </Button>
      </div>
    </main>
  )
}
