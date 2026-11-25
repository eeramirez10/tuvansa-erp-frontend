import axios from "axios"
import { paths } from "@/app/router/paths"

function createApiClient(baseURL: string) {
  return axios.create({
    baseURL,
    headers: {
      Accept: "application/json",
    },
    timeout: 15_000,
  })
}

export const apiClient = createApiClient("/api")
export const sessionApiClient = createApiClient("/api")

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
    throw new Error("No fue posible conectar la sesión web con /api.")
  }
  return response
})
