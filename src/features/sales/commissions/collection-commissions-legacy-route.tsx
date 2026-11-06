import { Navigate, useLocation } from "react-router"
import { paths } from "@/app/router/paths"

export function Component() {
  const { search, hash } = useLocation()
  return <Navigate replace to={{ pathname: paths.collectionCommissions, search, hash }} />
}
