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
      {
        path: "inventarios/productos/:productId?",
        lazy: () =>
          import("@/features/inventories/products/inventory-products-route"),
      },
      {
        path: "cuentas-por-cobrar/clientes/:clientId?",
        lazy: () =>
          import("@/features/accounts-receivable/clients/accounts-receivable-clients-route"),
      },
      {
        path: "pedidos/:orderId?",
        lazy: () => import("@/features/sales/orders/sales-orders-route"),
      },
    ],
  },
])
