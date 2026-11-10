import { queryOptions } from "@tanstack/react-query"
import type { CollectionCriteria, SettlementSettings } from "@/features/sales/commissions/model"
import { getCollectionCommissions, getCollectionOptions } from "@/features/sales/commissions/services/collection-commissions-service"
export const collectionOptionsQuery = () => queryOptions({ queryKey: ["sales", "collection-commissions", "options"], queryFn: ({ signal }) => getCollectionOptions(signal), staleTime: 0 })
export const collectionReportQuery = (criteria: CollectionCriteria, settings?: SettlementSettings) => queryOptions({ queryKey: ["sales", "collection-commissions", criteria, settings ?? null], queryFn: ({ signal }) => getCollectionCommissions(criteria, signal, settings), staleTime: 0, retry: false })
export const collectionMoney = (amount: number | null) => amount === null ? "No disponible" : "$" + amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const collectionBonusMoney = (amount: number | null) => amount === null ? "No disponible" : "$" + amount.toLocaleString("es-MX", { minimumFractionDigits: 4, maximumFractionDigits: 4 })
export const collectionDate = (date: string) => date.split("-").reverse().join("/")
export const collectionHeaders = ["Agente", "Cliente", "Fecha docto", "Fecha pago / ajuste", "Factura", "Días", "Subtotal", "Devoluciones", "Notas de crédito", "Total", "Pago / ajuste", "Costo", "Costo real", "Utilidad", "%", "Fletes", "Clasificación cliente", "LM", "LM_VALOR", "Base clientes 1%", "% clientes", "Bono clientes"]
export const collectionCustomerLabel = (status: string) => status === "Viejo_Reactivado" ? "Viejo recuperado" : status
