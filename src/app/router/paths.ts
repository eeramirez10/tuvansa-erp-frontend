export const paths = {
  home: "/",
  inventoryProducts: "/inventarios/productos",
  inventoryProduct: (productId: number) => `/inventarios/productos/${productId}`,
  salesOrders: "/pedidos",
  salesOrder: (orderId: number) => `/pedidos/${orderId}`,
} as const
