import type {
  ProductPanelDefinition,
  ProductType,
} from "@/features/inventories/products/model"

export const productTypeLabels: Record<ProductType, string> = {
  rawMaterial: "M.P.",
  finishedProduct: "P.T.",
  set: "Juego",
  assembly: "Ensamble",
  service: "Servicio",
  unknown: "Sin definir",
}

export const productTypeOptions = [
  { value: "rawMaterial", label: "M.P." },
  { value: "finishedProduct", label: "P.T." },
  { value: "set", label: "Juego" },
  { value: "assembly", label: "Ensamble" },
  { value: "service", label: "Servicio" },
] as const

export const actionPanels: readonly ProductPanelDefinition[] = [
  { key: "warehouses", label: "Almacenes", section: "actions" },
  {
    key: "color-size-registration",
    label: "Alta CT",
    section: "actions",
  },
  { key: "block-status", label: "Bloquear", section: "actions" },
  { key: "classifications", label: "Clasificar", section: "actions" },
  {
    key: "extended-description",
    label: "Descr. ext.",
    section: "actions",
  },
  {
    key: "customer-discounts",
    label: "% Descuentos clis",
    section: "actions",
  },
  {
    key: "supplier-discounts",
    label: "% Descuentos prv",
    section: "actions",
  },
  { key: "other-data", label: "Otros", section: "actions" },
  {
    key: "specifications",
    label: "Especificaciones",
    section: "actions",
  },
  { key: "photo", label: "Foto", section: "actions" },
  { key: "ct-inventory", label: "Inv. CT", section: "actions" },
  { key: "prices", label: "Precios", section: "actions" },
  { key: "skus", label: "SKUs", section: "actions" },
  { key: "prepacks", label: "Prepacks", section: "actions" },
]

export const purchasesProductionPanels: readonly ProductPanelDefinition[] = [
  {
    key: "alternates",
    label: "Alternos",
    section: "purchases-production",
  },
  {
    key: "components",
    label: "Componentes",
    section: "purchases-production",
  },
  {
    key: "quality-specifications",
    label: "Especific. Cal",
    section: "purchases-production",
  },
  {
    key: "implosion",
    label: "Implosión",
    section: "purchases-production",
  },
  { key: "lots", label: "Lotes", section: "purchases-production" },
  {
    key: "inventory-layers",
    label: "UEPS / PEPS",
    section: "purchases-production",
  },
]

export type ProductQueryRow = {
  primary: ProductPanelDefinition
  shortcuts?: readonly ProductPanelDefinition[]
}

export const queryPanelRows: readonly ProductQueryRow[] = [
  { primary: { key: "ledger", label: "Auxiliar", section: "queries" } },
  {
    primary: {
      key: "customer-orders",
      label: "Pedidos por cliente",
      section: "queries",
    },
    shortcuts: [
      { key: "customer-orders-star", label: "*", section: "queries" },
      { key: "customer-orders-ct", label: "CT", section: "queries" },
    ],
  },
  {
    primary: {
      key: "customer-quotes",
      label: "Cotizaciones por cliente",
      section: "queries",
    },
  },
  {
    primary: {
      key: "customer-sales",
      label: "Ventas por cliente",
      section: "queries",
    },
    shortcuts: [
      { key: "customer-sales-star", label: "*", section: "queries" },
      { key: "customer-sales-ct", label: "CT", section: "queries" },
    ],
  },
  {
    primary: {
      key: "customer-sales-detail",
      label: "Ventas desglosadas",
      section: "queries",
    },
  },
  {
    primary: {
      key: "sales-by-branch",
      label: "Ventas por sucursal",
      section: "queries",
    },
  },
  {
    primary: {
      key: "annual-sales",
      label: "Ventas anuales",
      section: "queries",
    },
  },
  {
    primary: {
      key: "annual-sales-summary",
      label: "Ventas anuales resumen",
      section: "queries",
    },
  },
  {
    primary: {
      key: "supplier-orders",
      label: "Ordenado a proveedor",
      section: "queries",
    },
    shortcuts: [
      { key: "supplier-orders-ct", label: "CT", section: "queries" },
    ],
  },
  {
    primary: {
      key: "supplier-quotes",
      label: "Cotizado a proveedores",
      section: "queries",
    },
  },
  {
    primary: {
      key: "supplier-purchases",
      label: "Compras por proveedor",
      section: "queries",
    },
    shortcuts: [
      { key: "supplier-purchases-dt", label: "DT", section: "queries" },
    ],
  },
  {
    primary: {
      key: "supplier-purchases-detail",
      label: "Compras desglosadas",
      section: "queries",
    },
  },
  {
    primary: {
      key: "annual-purchases",
      label: "Compras anuales",
      section: "queries",
    },
  },
  {
    primary: {
      key: "annual-purchases-summary",
      label: "Compras anuales resumen",
      section: "queries",
    },
  },
  { primary: { key: "pieces", label: "Piezas", section: "queries" } },
  {
    primary: {
      key: "fulfilled-pieces",
      label: "Piezas surtidas",
      section: "queries",
    },
  },
  {
    primary: {
      key: "work-in-progress",
      label: "W.I.P.",
      section: "queries",
    },
    shortcuts: [
      { key: "work-in-progress-ct", label: "CT", section: "queries" },
    ],
  },
  { primary: { key: "edi", label: "E.D.I.", section: "queries" } },
  {
    primary: {
      key: "pending-enablements",
      label: "Habilitaciones pendientes",
      section: "queries",
    },
  },
  {
    primary: {
      key: "documents",
      label: "Documentos",
      section: "queries",
    },
  },
]
