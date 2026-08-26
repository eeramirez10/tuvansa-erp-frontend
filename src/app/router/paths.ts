export const paths = {
  home: "/",
  inventoryProducts: "/inventarios/productos",
  inventoryProduct: (productId: number) => `/inventarios/productos/${productId}`,
} as const
