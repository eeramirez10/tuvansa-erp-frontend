import { queryOptions } from "@tanstack/react-query"
import { paths } from "@/app/router/paths"
import type { DirectoryFilters } from "./model"
import { listUsers, readPermissionGroup, readWebSession } from "./services/users-service"

export const webSessionKey = ["web-session"] as const
export const userDirectoryKey = ["general-data"] as const
export const webSessionOptions = queryOptions({ queryKey: webSessionKey, queryFn: readWebSession, staleTime: 30_000, retry: false })
export const usersOptions = (filters: DirectoryFilters) => queryOptions({
  queryKey: [...userDirectoryKey, "users", filters], queryFn: () => listUsers(filters), retry: false,
})
export const permissionGroupOptions = (group: number) => queryOptions({
  queryKey: [...userDirectoryKey, "permissions", group], queryFn: () => readPermissionGroup(group), retry: false,
})

export function signInPath(destination: string) {
  return `${paths.signIn}?${new URLSearchParams({ volver: destination })}`
}
