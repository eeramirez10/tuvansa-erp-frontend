import { sessionApiClient } from "@/shared/api/api-client"
import type { DirectoryDirection, DirectoryFilters, DirectoryResult, DirectoryUser, DirectoryUserDetail, PermissionChange, PermissionGroup, SavedDirectoryUser, UserProfileUpdate, WebSession } from "../model"

const users = "/general-data/users"
const groups = "/general-data/permission-groups"
type Response<T> = { data: T }

export async function readWebSession() {
  return (await sessionApiClient.get<Response<WebSession | null>>("/session")).data.data
}

export async function startWebSession(identification: string, password: string) {
  return (await sessionApiClient.post<Response<WebSession>>("/session", { identification, password })).data.data
}

export async function endWebSession() {
  await sessionApiClient.delete("/session")
}

export async function activateWebAccount(token: string, password: string) {
  await sessionApiClient.post("/session/activation", { token, password })
}

export async function listUsers(filters: DirectoryFilters, signal?: AbortSignal) {
  return (await sessionApiClient.get<Response<DirectoryResult>>(users, { params: filters, signal })).data.data
}

export async function readUser(userId: string, signal?: AbortSignal) {
  return (await sessionApiClient.get<Response<DirectoryUserDetail>>(`${users}/${userId}`, { signal })).data.data
}

export async function adjacentUser(filters: DirectoryFilters, userId: string, direction: DirectoryDirection) {
  const params = { ...filters, anchor: userId, direction }
  const response = await sessionApiClient.get<Response<DirectoryResult & { position: number | null }>>(users, { params })
  return response.data.data
}

export async function saveUser(profile: UserProfileUpdate, user?: DirectoryUser) {
  const response = user
    ? await sessionApiClient.patch<Response<SavedDirectoryUser>>(`${users}/${user.id}`, { ...profile, revision: user.revision })
    : await sessionApiClient.post<Response<SavedDirectoryUser>>(users, profile)
  return response.data.data
}

export async function issueActivation(user: DirectoryUser) {
  return (await sessionApiClient.post<Response<{ token: string; revision: number }>>(
    `${users}/${user.id}/activation`, { revision: user.revision })).data.data
}

export async function readPermissionGroup(group: number) {
  return (await sessionApiClient.get<Response<PermissionGroup>>(`${groups}/${group}`)).data.data
}

export async function savePermissionGroup(group: number, revision: number, changes: PermissionChange[]) {
  return (await sessionApiClient.patch<Response<PermissionGroup>>(`${groups}/${group}`, { revision, changes })).data.data
}
