export const paths = {
  home: "/",
  inventoryProducts: "/inventarios/productos",
  inventoryProduct: (productId: number) => `/inventarios/productos/${productId}`,
  accountsReceivableClients: "/cuentas-por-cobrar/clientes",
  accountsReceivableClient: (clientId: number) =>
    `/cuentas-por-cobrar/clientes/${clientId}`,
  accountsPayableSuppliers: "/cuentas-por-pagar/proveedores",
  accountsPayableSupplier: (supplierId: number) =>
    `/cuentas-por-pagar/proveedores/${supplierId}`,
  purchaseOrders: "/ordenes-compra",
  purchaseOrder: (purchaseOrderId: number) =>
    `/ordenes-compra/${purchaseOrderId}`,
  purchaseReceptions: "/recepciones",
  purchaseReception: (purchaseReceptionId: number) =>
    `/recepciones/${purchaseReceptionId}`,
  salesOrders: "/pedidos",
  salesOrder: (orderId: number) => `/pedidos/${orderId}`,
  salesInvoices: "/facturacion",
  salesInvoice: (invoiceId: number) => `/facturacion/${invoiceId}`,
  bankAccounts: "/bancos",
  bankAccount: (bankAccountId: number) => `/bancos/${bankAccountId}`,
  accountingPolicies: "/contabilidad/polizas",
  accountingPolicy: (policyId: number) => `/contabilidad/polizas/${policyId}`,
} as const
