import axios from "axios"

type ErrorPayload = {
  error?: {
    message?: string
  }
  message?: string
}

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError<ErrorPayload>(error)) {
    return error instanceof Error ? error.message : "Ocurrió un error inesperado."
  }

  return (
    error.response?.data.error?.message ??
    error.response?.data.message ??
    "No fue posible comunicarse con el servidor."
  )
}
