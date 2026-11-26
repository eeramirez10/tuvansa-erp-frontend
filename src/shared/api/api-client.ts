import axios from "axios"
import { paths } from "@/app/router/paths"

const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const directApi = configuredUrl ? new URL(configuredUrl) : null

if (directApi && (directApi.protocol !== "https:" || directApi.username || directApi.password || directApi.search || directApi.hash)) {
  throw new Error("VITE_API_BASE_URL debe ser una URL HTTPS de la API, sin credenciales ni parámetros.")
}

function createApiClient() {
  return axios.create({
    baseURL: directApi?.href ?? "/api",
    withCredentials: directApi !== null,
    headers: {
      Accept: "application/json",
      ...(directApi?.hostname.endsWith(".ngrok-free.dev") ? { "ngrok-skip-browser-warning": "1" } : {}),
    },
    timeout: 15_000,
  })
}

export const apiClient = createApiClient()
export const sessionApiClient = createApiClient()

apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.error?.code === "WEB_SESSION_REQUIRED") {
    const { pathname, search, hash } = window.location
    if (pathname !== paths.signIn) window.location.assign(`${paths.signIn}?${new URLSearchParams({ volver: pathname + search + hash })}`)
  }
  return Promise.reject(error)
})

sessionApiClient.interceptors.response.use(response => {
  const contentType = response.headers["content-type"]
  if (response.status !== 204 && (typeof contentType !== "string" || !contentType.includes("application/json"))) {
    throw new Error("No fue posible conectar la sesión con el servidor de TUVANSA.")
  }
  return response
})
