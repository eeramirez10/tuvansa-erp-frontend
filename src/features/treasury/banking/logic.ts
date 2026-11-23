import { queryOptions } from "@tanstack/react-query"
import type { BankPanelKey } from "@/features/treasury/banking/model"
import {
  getBankAccount,
  getBankAccountFormPreview,
  getBankPanel,
  getBankTransferPreview,
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
  form: (id: number | null) => [...bankAccountKeys.all, "form", id] as const,
  transfer: (id: number) => [...bankAccountKeys.detail(id), "transfer"] as const,
}

export const bankAccountQueryOptions = (id: number) => queryOptions({
  queryKey: bankAccountKeys.detail(id),
  queryFn: ({ signal }) => getBankAccount(id, signal),
})

export const firstBankAccountQueryOptions = () => queryOptions({
  queryKey: bankAccountKeys.first(),
  queryFn: ({ signal }) => getFirstBankAccount(signal),
})

export const bankAccountSearchQueryOptions = (criteria: BankAccountSearchCriteria) => queryOptions({
  queryKey: bankAccountKeys.search(criteria),
  queryFn: ({ signal }) => searchBankAccounts(criteria, signal),
})

export const bankPanelQueryOptions = (id: number, key: BankPanelKey, costCenter?: string) => queryOptions({
  queryKey: costCenter ? [...bankAccountKeys.panel(id, key), costCenter] : bankAccountKeys.panel(id, key),
  queryFn: ({ signal }) => getBankPanel(id, key, signal, costCenter),
})

export const bankAccountFormQueryOptions = (id: number | null) => queryOptions({
  queryKey: bankAccountKeys.form(id),
  queryFn: ({ signal }) => getBankAccountFormPreview(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
})

export const bankTransferQueryOptions = (id: number) => queryOptions({
  queryKey: bankAccountKeys.transfer(id),
  queryFn: ({ signal }) => getBankTransferPreview(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
})

const moneyFormat = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const bankMoney = (value: unknown) => moneyFormat.format(Number(value ?? 0))
