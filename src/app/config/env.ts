import { z } from "zod"

const envSchema = z.object({
  VITE_API_URL: z.url().default("http://localhost:3000/api"),
})

const parsedEnv = envSchema.safeParse(import.meta.env)

if (!parsedEnv.success) {
  throw new Error("La variable VITE_API_URL no contiene una URL válida.")
}

export const env = Object.freeze({
  apiUrl: parsedEnv.data.VITE_API_URL.replace(/\/$/, ""),
})
