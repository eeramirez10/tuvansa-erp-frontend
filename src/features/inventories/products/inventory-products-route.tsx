import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"

import { queryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import {
  firstActiveProductQueryOptions,
  productKeys,
  productQueryOptions,
} from "@/features/inventories/products/logic"
import { ProductCatalogPage } from "@/features/inventories/products/pages/product-catalog-page"

export async function loader({ params }: LoaderFunctionArgs) {
  if (params.productId === undefined) {
    const firstProduct = await queryClient.ensureQueryData(firstActiveProductQueryOptions())
    queryClient.setQueryData(productKeys.detail(firstProduct.id), firstProduct)

    return redirect(paths.inventoryProduct(firstProduct.id))
  }

  const productId = Number(params.productId)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Response("Identificador de producto inválido", { status: 400 })
  }

  await queryClient.ensureQueryData(productQueryOptions(productId))
  return null
}

export function Component() {
  return <ProductCatalogPage />
}
