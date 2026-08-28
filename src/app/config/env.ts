import { z } from "zod"

const envSchema = z.object({
  VITE_API_BASE_URL: z.url().optional(),
  VITE_API_URL: z.url().optional(),
})

const parsedEnv = envSchema.safeParse(import.meta.env)

if (!parsedEnv.success) {
  throw new Error("La URL configurada para la API no es válida.")
}

const apiUrl = parsedEnv.data.VITE_API_BASE_URL
  ?? parsedEnv.data.VITE_API_URL
  ?? "http://localhost:3000/api"

export const env = Object.freeze({
  apiUrl: apiUrl.replace(/\/$/, ""),
})
