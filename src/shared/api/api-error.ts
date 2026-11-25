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

export const isApiNotFound = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404

export const isApiSessionRequired = (error: unknown) =>
  axios.isAxiosError<ErrorPayload & { error?: { code?: string } }>(error) &&
  error.response?.data.error?.code === "WEB_SESSION_REQUIRED"
