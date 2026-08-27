export const paths = {
  home: "/",
  inventoryProducts: "/inventarios/productos",
  inventoryProduct: (productId: number) => `/inventarios/productos/${productId}`,
  accountsReceivableClients: "/cuentas-por-cobrar/clientes",
  accountsReceivableClient: (clientId: number) =>
    `/cuentas-por-cobrar/clientes/${clientId}`,
  salesOrders: "/pedidos",
  salesOrder: (orderId: number) => `/pedidos/${orderId}`,
} as const
