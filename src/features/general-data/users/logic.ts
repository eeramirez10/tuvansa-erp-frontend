import { queryOptions } from "@tanstack/react-query"
import { paths } from "@/app/router/paths"
import type { DirectoryFilters, DirectoryUser } from "./model"
import { listUsers, readPermissionGroup, readUser, readWebSession } from "./services/users-service"

export const webSessionKey = ["web-session"] as const
export const userDirectoryKey = ["general-data"] as const
export const initialDirectoryFilters: DirectoryFilters = { search: "", offset: 0, limit: 25 }
export const webSessionOptions = queryOptions({ queryKey: webSessionKey, queryFn: readWebSession, staleTime: 30_000, retry: false })
export const usersOptions = (filters: DirectoryFilters) => queryOptions({
  queryKey: [...userDirectoryKey, "users", filters], queryFn: ({ signal }) => listUsers(filters, signal), retry: false,
})
export const userDetailOptions = (userId: string) => queryOptions({
  queryKey: [...userDirectoryKey, "user", userId], queryFn: ({ signal }) => readUser(userId, signal), retry: false,
})
export const permissionGroupOptions = (group: number) => queryOptions({
  queryKey: [...userDirectoryKey, "permissions", group], queryFn: () => readPermissionGroup(group), retry: false,
})

export function directoryState(user: DirectoryUser) {
  if (!user.effectiveActive) return "Inactivo"
  return user.configured ? "Activo" : "Por activar"
}

export function signInPath(destination: string) {
  return `${paths.signIn}?${new URLSearchParams({ volver: destination })}`
}
