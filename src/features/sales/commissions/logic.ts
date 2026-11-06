import { queryOptions } from "@tanstack/react-query"
import type { CollectionCriteria } from "@/features/sales/commissions/model"
import { getCollectionCommissions, getCollectionOptions } from "@/features/sales/commissions/services/collection-commissions-service"
export const collectionOptionsQuery = () => queryOptions({ queryKey: ["sales", "collection-commissions", "options"], queryFn: ({ signal }) => getCollectionOptions(signal), staleTime: 0 })
export const collectionReportQuery = (criteria: CollectionCriteria) => queryOptions({ queryKey: ["sales", "collection-commissions", criteria], queryFn: ({ signal }) => getCollectionCommissions(criteria, signal), staleTime: 0, retry: false })
export const collectionMoney = (amount: number | null) => amount === null ? "No disponible" : "$" + amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const collectionDate = (date: string) => date.split("-").reverse().join("/")
export const collectionHeaders = ["Agente", "Cliente", "Fecha docto", "Fecha pago", "Factura", "Días", "Subtotal", "Devoluciones", "Total", "Pago", "Costo", "Costo real", "Utilidad", "%", "Fletes", "Cliente nuevo", "LM", "LM_VALOR"]
