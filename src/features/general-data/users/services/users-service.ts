import { sessionApiClient } from "@/shared/api/api-client"
import type { DirectoryFilters, DirectoryUser, PermissionChange, PermissionGroup, UserProfile, WebSession } from "../model"

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

export async function listUsers(filters: DirectoryFilters) {
  return (await sessionApiClient.get<Response<{ items: DirectoryUser[]; total: number }>>(users, { params: filters })).data.data
}

export async function saveUser(profile: UserProfile, user?: DirectoryUser) {
  const response = user
    ? await sessionApiClient.patch<Response<DirectoryUser>>(`${users}/${user.id}`, { ...profile, revision: user.revision })
    : await sessionApiClient.post<Response<DirectoryUser>>(users, profile)
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
