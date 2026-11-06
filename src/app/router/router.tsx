import { createBrowserRouter, redirect } from "react-router"

import { ErpLayout } from "@/app/layouts/erp-layout"
import { RootErrorBoundary } from "@/app/router/root-error-boundary"
import { RouteLoadingFallback } from "@/app/router/route-loading-fallback"
import { paths } from "@/app/router/paths"

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
        path: "inventarios/reportes/inventario-por-familia",
        loader: ({ request }) => { const url = new URL(request.url); return redirect(paths.inventoryByFamily + url.search + url.hash) },
      },
      {
        path: paths.inventoryByFamily.slice(1),
        lazy: () => import("@/features/inventories/reports/inventory-by-family-route"),
      },
      {
        path: "ventas/reportes/ventas-por-familia",
        loader: ({ request }) => { const url = new URL(request.url); return redirect(paths.salesByFamily + url.search + url.hash) },
      },
      {
        path: paths.salesByFamily.slice(1),
        lazy: () => import("@/features/sales/reports/sales-by-family-route"),
      },
      {
        path: "cuentas-por-cobrar/clientes/:clientId?",
        lazy: () =>
          import("@/features/accounts-receivable/clients/accounts-receivable-clients-route"),
      },
      {
        path: "cuentas-por-pagar/proveedores/:supplierId?",
        lazy: () =>
          import("@/features/accounts-payable/suppliers/accounts-payable-suppliers-route"),
      },
      {
        path: "recepciones/:purchaseReceptionId?",
        lazy: () =>
          import("@/features/purchasing/purchase-receptions/purchase-receptions-route"),
      },
      {
        path: "ordenes-compra/:purchaseOrderId?",
        lazy: () =>
          import("@/features/purchasing/purchase-orders/purchase-orders-route"),
      },
      {
        path: "pedidos/:orderId?",
        lazy: () => import("@/features/sales/orders/sales-orders-route"),
      },
      {
        path: "facturacion/:invoiceId?",
        lazy: () => import("@/features/sales/invoicing/sales-invoicing-route"),
      },
      {
        path: "contabilidad/reportes/estado-de-resultados",
        lazy: () => import("@/features/accounting/reports/income-statement-route"),
      },
      {
        path: paths.collectionCommissions.slice(1),
        lazy: () => import("@/features/sales/commissions/collection-commissions-route"),
      },
      {
        path: "contabilidad/polizas/:policyId?",
        lazy: () => import("@/features/accounting/policies/accounting-policies-route"),
      },
      {
        path: "bancos/:bankAccountId?",
        lazy: () => import("@/features/treasury/banking/treasury-banking-route"),
      },
    ],
  },
])
