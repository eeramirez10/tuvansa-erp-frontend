import { createBrowserRouter } from "react-router"

import { ErpLayout } from "@/app/layouts/erp-layout"
import { RootErrorBoundary } from "@/app/router/root-error-boundary"
import { RouteLoadingFallback } from "@/app/router/route-loading-fallback"

export const router = createBrowserRouter([
  {
    Component: ErpLayout,
    ErrorBoundary: RootErrorBoundary,
    HydrateFallback: RouteLoadingFallback,
    children: [
      {
        index: true,
        lazy: () => import("@/features/workspace/workspace-route"),
      },
    ],
  },
])
