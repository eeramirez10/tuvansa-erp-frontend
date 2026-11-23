import type {
  GeneralExpensesCatalog,
  GeneralExpensesInput,
  GeneralExpensesPreview,
  GeneralExpensesResult,
} from "@/features/purchasing/purchase-receptions/model"
import { apiClient } from "@/shared/api/api-client"

const path = "/purchasing/purchase-receptions/general-expenses"

export async function getGeneralExpensesPreview(signal?: AbortSignal) {
  const response = await apiClient.get<{ data: GeneralExpensesPreview }>(`${path}/create`, { signal })
  return response.data.data
}

export async function lookupGeneralExpensesCatalog(
  key: "supplierCode" | "productCode",
  code: string,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<{ data: GeneralExpensesCatalog }>(`${path}/catalog`, {
    params: { [key]: code }, signal,
  })
  return response.data.data
}

export async function createGeneralExpenses(input: GeneralExpensesInput) {
  const response = await apiClient.post<{ data: GeneralExpensesResult }>(path, input)
  return response.data.data
}
