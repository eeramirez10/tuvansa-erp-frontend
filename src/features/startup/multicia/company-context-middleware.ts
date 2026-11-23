import { isAxiosError } from "axios"
import { replace, type MiddlewareFunction } from "react-router"

import { queryClient } from "@/app/providers/query-client"
import {
  companyContextQueryOptions,
  companySessionKey,
  startupPathFor,
} from "@/features/startup/multicia/logic"

export const requireCompanyContext: MiddlewareFunction = async ({ url }, next) => {
  const currentUrl = new URL(window.location.href)
  // React Router omits the fragment from requests to loaders.
  const destination = url.pathname === currentUrl.pathname && url.search === currentUrl.search
    ? currentUrl
    : url

  const storedId = sessionStorage.getItem(companySessionKey)
  if (!storedId) throw replace(startupPathFor(destination))
  const id = Number(storedId)
  if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== storedId) {
    sessionStorage.removeItem(companySessionKey)
    throw replace(startupPathFor(destination))
  }

  try {
    await queryClient.fetchQuery(companyContextQueryOptions(id))
  } catch (error) {
    if (isAxiosError(error) && [400, 403, 404].includes(error.response?.status ?? 0)) {
      sessionStorage.removeItem(companySessionKey)
      throw replace(startupPathFor(destination))
    }
    throw new Error("No se pudo validar la compañía. Vuelve a intentar abrir el ERP.", { cause: error })
  }

  return next()
}
