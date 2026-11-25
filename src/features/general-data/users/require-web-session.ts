import { replace, type MiddlewareFunction } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { signInPath, webSessionOptions } from "./logic"

export const requireWebSession: MiddlewareFunction = async ({ url }, next) => {
  const session = await queryClient.fetchQuery(webSessionOptions)
  if (!session) throw replace(signInPath(url.pathname + url.search + url.hash))
  return next()
}
