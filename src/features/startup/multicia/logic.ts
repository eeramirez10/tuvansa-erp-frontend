import { queryOptions } from "@tanstack/react-query"

import { paths } from "@/app/router/paths"
import { getCompanies, getCompanyContext } from "@/features/startup/multicia/services/companies-api"

export const companySessionKey = "tuvansa.companyId"

export const companiesQueryOptions = queryOptions({
  queryKey: ["companies"],
  queryFn: ({ signal }) => getCompanies(signal),
})

export const companyContextQueryOptions = (id: number) => queryOptions({
  queryKey: ["companies", id, "context"],
  queryFn: ({ signal }) => getCompanyContext(id, signal),
  staleTime: Infinity,
  retry: false,
})

export function startupPathFor(url: URL) {
  const destination = url.pathname + url.search + url.hash
  if (destination === paths.home) return paths.startup
  const params = new URLSearchParams({ volver: destination })
  return `${paths.startup}?${params}`
}

export function getStartupDestination(value: string | null, origin: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) return paths.home

  const url = new URL(value, origin)
  if (url.origin !== origin || !url.pathname.startsWith("/")) return paths.home
  if (url.pathname.replace(/\/+$/, "").toLowerCase() === paths.startup) return paths.home
  if (url.pathname.startsWith("//")) return paths.home

  return url.pathname + url.search + url.hash
}
