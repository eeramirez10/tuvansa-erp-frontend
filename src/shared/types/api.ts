export type ApiListResponse<T> = {
  data: T[]
  meta?: {
    limit?: number
    offset?: number
    total?: number
  }
}

export type ApiItemResponse<T> = {
  data: T
}
