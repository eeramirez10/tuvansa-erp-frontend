import { queryOptions } from "@tanstack/react-query"
import type { BankPanelKey } from "@/features/treasury/banking/model"
import {
  getBankAccount,
  getBankPanel,
  getFirstBankAccount,
  searchBankAccounts,
  type BankAccountSearchCriteria,
} from "@/features/treasury/banking/services/bank-account-service"

export const bankAccountKeys = {
  all: ["treasury", "bank-accounts"] as const,
  detail: (id: number) => [...bankAccountKeys.all, "detail", id] as const,
  first: () => [...bankAccountKeys.all, "first"] as const,
  search: (criteria: BankAccountSearchCriteria) => [...bankAccountKeys.all, "search", criteria] as const,
  panel: (id: number, key: BankPanelKey) => [...bankAccountKeys.detail(id), "panel", key] as const,
}

export const bankAccountQueryOptions = (id: number) => queryOptions({
  queryKey: bankAccountKeys.detail(id),
  queryFn: ({ signal }) => getBankAccount(id, signal),
})

export const firstBankAccountQueryOptions = () => queryOptions({
  queryKey: bankAccountKeys.first(),
  queryFn: async ({ signal }) => {
    const account = await getFirstBankAccount(signal)
    if (account === null) throw new Error("No hay cuentas bancarias disponibles")
    return account
  },
})

export const bankAccountSearchQueryOptions = (criteria: BankAccountSearchCriteria) => queryOptions({
  queryKey: bankAccountKeys.search(criteria),
  queryFn: ({ signal }) => searchBankAccounts(criteria, signal),
})

export const bankPanelQueryOptions = (id: number, key: BankPanelKey) => queryOptions({
  queryKey: bankAccountKeys.panel(id, key),
  queryFn: ({ signal }) => getBankPanel(id, key, signal),
})
