import { replace, type MiddlewareFunction } from "react-router"
import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { companySessionKey } from "@/features/startup/multicia/logic"
import { signInPath, webSessionOptions } from "./logic"

export const requireWebSession: MiddlewareFunction = async ({ url }, next) => {
  const session = await queryClient.fetchQuery(webSessionOptions)
  if (!session) {
    sessionStorage.removeItem(companySessionKey)
    const current = window.location
    const hash = url.hash || (url.pathname === current.pathname && url.search === current.search ? current.hash : "")
    const destination = url.pathname === paths.startup
      ? url.searchParams.get("volver") ?? paths.home
      : url.pathname + url.search + hash
    throw replace(signInPath(destination))
  }
  return next()
}
