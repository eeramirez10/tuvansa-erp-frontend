import { queryOptions } from "@tanstack/react-query"

import type {
  Client,
  ClientFormValues,
  ClientMutationInput,
  ClientPanelDefinition,
} from "@/features/accounts-receivable/clients/model"
import {
  getClient,
  getFirstActiveClient,
  getClientClassifications,
  getClientPanel,
  searchClients,
  type ClientSearchCriteria,
} from "@/features/accounts-receivable/clients/services/client-service"

export const clientKeys = {
  all: ["accounts-receivable", "clients"] as const,
  firstActive: () => [...clientKeys.all, "first-active"] as const,
  detail: (clientId: number) => [...clientKeys.all, "detail", clientId] as const,
  search: (criteria: ClientSearchCriteria) => [...clientKeys.all, "search", criteria] as const,
  panel: (clientId: number, panelKey: string) =>
    [...clientKeys.detail(clientId), "panel", panelKey] as const,
  classifications: (clientId: number, position: number) =>
    [...clientKeys.detail(clientId), "classifications", position] as const,
}

export const clientQueryOptions = (clientId: number) => queryOptions({
  queryKey: clientKeys.detail(clientId),
  queryFn: ({ signal }) => getClient(clientId, signal),
})

export const firstActiveClientQueryOptions = () => queryOptions({
  queryKey: clientKeys.firstActive(),
  queryFn: ({ signal }) => getFirstActiveClient(signal),
})

export const clientSearchQueryOptions = (criteria: ClientSearchCriteria) => queryOptions({
  queryKey: clientKeys.search(criteria),
  queryFn: ({ signal }) => searchClients(criteria, signal),
})

export const clientPanelQueryOptions = (clientId: number, panel: ClientPanelDefinition) => queryOptions({
  queryKey: clientKeys.panel(clientId, panel.key),
  queryFn: ({ signal }) => getClientPanel(clientId, panel, signal),
})

export const clientClassificationsQueryOptions = (clientId: number, position: number) => queryOptions({
  queryKey: clientKeys.classifications(clientId, position),
  queryFn: ({ signal }) => getClientClassifications(clientId, position, signal),
  placeholderData: (previousData) => previousData,
})

export function getClientFormDefaults(client?: Client): ClientFormValues {
  return {
    code: client?.code ?? "",
    name: client?.name ?? "",
    street: client?.address.street ?? "",
    exteriorNumber: client?.address.exteriorNumber ?? "",
    interiorNumber: client?.address.interiorNumber ?? "",
    neighborhood: client?.address.neighborhood ?? "",
    borough: client?.address.borough ?? "",
    city: client?.address.city ?? "",
    state: client?.address.state ?? "",
    postalCode: client?.address.postalCode ?? "",
    countryCode: client?.address.countryCode ?? "MEX",
    contactName: client?.contact.name ?? "",
    phones: client?.contact.phones ?? "",
    fax: client?.contact.fax ?? "",
    email: client?.contact.email ?? "",
    website: client?.contact.website ?? "",
    taxId: client?.fiscal.taxId ?? "",
    curp: client?.fiscal.curp ?? "",
    branch: client?.fiscal.branch ?? "",
    accountingAccount: client?.fiscal.accountingAccount ?? "1105001",
    priceList: client?.terms.priceList ?? 1,
    discount1: client?.terms.discounts[0] ?? 0,
    discount2: client?.terms.discounts[1] ?? 0,
    discount3: client?.terms.discounts[2] ?? 0,
    paymentTermDays: client?.terms.paymentTermDays ?? 0,
    creditLimit: client?.terms.creditLimit ?? 0,
    creditExpiresAt: client?.terms.creditExpiresAt ?? "",
    reviewDay: client?.terms.reviewDay ?? "",
    reviewTime: client?.terms.reviewTime ?? "",
    paymentDay: client?.terms.paymentDay ?? "",
    paymentTime: client?.terms.paymentTime ?? "",
    applyToClientCode: client?.terms.applyToClientCode ?? "",
    reviewStartsFromInvoice: client?.terms.reviewStartsFromInvoice ?? false,
  }
}

export function toClientMutationInput(values: ClientFormValues): ClientMutationInput {
  return {
    code: values.code,
    name: values.name,
    address: {
      street: values.street,
      exteriorNumber: values.exteriorNumber,
      interiorNumber: values.interiorNumber,
      neighborhood: values.neighborhood,
      borough: values.borough,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      countryCode: values.countryCode,
    },
    contact: {
      name: values.contactName,
      phones: values.phones,
      fax: values.fax,
      email: values.email,
      website: values.website,
    },
    fiscal: {
      taxId: values.taxId,
      curp: values.curp,
      branch: values.branch,
      accountingAccount: values.accountingAccount,
    },
    terms: {
      priceList: values.priceList,
      discounts: [values.discount1, values.discount2, values.discount3],
      paymentTermDays: values.paymentTermDays,
      creditLimit: values.creditLimit,
      creditExpiresAt: values.creditExpiresAt || null,
      reviewDay: values.reviewDay,
      reviewTime: values.reviewTime,
      paymentDay: values.paymentDay,
      paymentTime: values.paymentTime,
      applyToClientCode: values.applyToClientCode,
      reviewStartsFromInvoice: values.reviewStartsFromInvoice,
    },
  }
}
