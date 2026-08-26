import axios from "axios"

import { env } from "@/app/config/env"

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: "application/json",
  },
  timeout: 15_000,
})
