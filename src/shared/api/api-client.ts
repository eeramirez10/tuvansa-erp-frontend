import axios from "axios"

import { env } from "@/app/config/env"

function createApiClient(baseURL: string) {
  return axios.create({
    baseURL,
    headers: {
      Accept: "application/json",
    },
    timeout: 15_000,
  })
}

export const apiClient = createApiClient(env.apiUrl)
export const sessionApiClient = createApiClient("/api")

sessionApiClient.interceptors.response.use(response => {
  const contentType = response.headers["content-type"]
  if (response.status !== 204 && (typeof contentType !== "string" || !contentType.includes("application/json"))) {
    throw new Error("No fue posible conectar la sesión web con /api.")
  }
  return response
})
