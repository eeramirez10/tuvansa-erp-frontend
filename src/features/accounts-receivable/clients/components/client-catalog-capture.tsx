import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { ClientCatalogDetails } from "@/features/accounts-receivable/clients/components/client-catalog-details"
import { clientSearchQueryOptions, getClientFormDefaults, toClientMutationInput, toClientUpdateInput } from "@/features/accounts-receivable/clients/logic"
import { clientFormSchema, type Client, type ClientFormValues, type ClientMutationInput, type ClientUpdateInput } from "@/features/accounts-receivable/clients/model"
import { createClient, updateClient } from "@/features/accounts-receivable/clients/services/client-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"

type Save = { mode: "create"; input: ClientMutationInput } | { mode: "edit"; id: number; input: ClientUpdateInput }

function newDisplay(values: ClientFormValues): Client {
  return {
    ...toClientMutationInput(values), id: 0, isActive: true, createdAt: null, deactivatedAt: null, indicators: { hasEvents: false },
    totals: { actualPaymentTermDays: 0, previousBalance: 0, currentBalance: 0, availableCredit: 0, accumulatedSales: 0,
      lastPurchaseAt: null, lastPaymentAt: null, lastOrderAt: null },
  }
}

export function ClientCatalogCapture({ client, onClose, onSaved }: {
  client: Client | null
  onClose: () => void
  onSaved: (client: Client, mode: Save["mode"]) => void
}) {
  const [defaults] = useState(() => {
    const values = getClientFormDefaults(client ?? undefined)
    const normalized = clientFormSchema.safeParse(values)
    return normalized.success ? normalized.data : values
  })
  const title = client ? "Cambio al cliente actual" : "Alta de clientes"
  const form = useForm<ClientFormValues>({ defaultValues: defaults, resolver: zodResolver(clientFormSchema) })
  const { setFocus } = form
  const queryClient = useQueryClient()
  const inFlight = useRef(false)
  const codeRequest = useRef(0)
  const codeError = form.formState.errors.code?.type
  const accountError = form.formState.errors.accountingAccount?.type
  const mutation = useMutation({
    mutationFn: (operation: Save) => operation.mode === "create" ? createClient(operation.input) : updateClient(operation.id, operation.input),
    onSuccess: (saved, operation) => onSaved(saved, operation.mode),
    onError: error => {
      const code = isAxiosError<{ error?: { code?: string } }>(error) ? error.response?.data.error?.code : undefined
      if (code === "CLIENT_CODE_EXISTS") {
        form.setValue("code", defaults.code, { shouldDirty: true })
        form.setError("code", { type: "duplicate", message: "El código del cliente ya existe." })
      }
      if (code === "ACCOUNTING_ACCOUNT_NOT_FOUND") form.setError("accountingAccount", { type: "account", message: getApiErrorMessage(error) })
    },
    onSettled: () => { inFlight.current = false },
  })

  useEffect(() => {
    setFocus(client ? "name" : "code", { shouldSelect: true })
    return () => { codeRequest.current += 1 }
  }, [client, setFocus])
  useEffect(() => {
    if (mutation.isPending) return
    if (codeError === "duplicate") setFocus("code")
    else if (accountError === "account") setFocus("accountingAccount")
  }, [accountError, codeError, mutation.isPending, setFocus])

  function editCode() {
    codeRequest.current += 1
    if (form.getFieldState("code").error?.type === "duplicate") form.clearErrors("code")
  }

  async function checkCode(raw: string) {
    const code = raw.trim().toUpperCase()
    if (!code || code.length > 6 || code === defaults.code.trim().toUpperCase()) return
    const request = ++codeRequest.current
    try {
      const { data } = await queryClient.fetchQuery({
        ...clientSearchQueryOptions({ q: code, status: "all", page: 1, pageSize: 100 }), staleTime: 0,
      })
      if (request !== codeRequest.current || code !== form.getValues("code").trim().toUpperCase()) return
      if (data.some(record => record.id !== client?.id && record.code.trim().toUpperCase() === code)) {
        form.setValue("code", defaults.code, { shouldDirty: true })
        form.setError("code", { type: "duplicate", message: `El código ${code} ya existe.` }, { shouldFocus: true })
      }
    } catch {
      // The catalogue write checks uniqueness again.
    }
  }

  function close() {
    if (!inFlight.current) onClose()
  }

  function submit(values: ClientFormValues) {
    if (inFlight.current) return
    if (client) {
      const input = toClientUpdateInput(defaults, values)
      if (!Object.keys(input).length) { close(); return }
      inFlight.current = true
      mutation.mutate({ mode: "edit", id: client.id, input })
    } else {
      inFlight.current = true
      mutation.mutate({ mode: "create", input: toClientMutationInput(values) })
    }
  }

  return (
    <form aria-label={title} className="grid min-w-0 gap-2" noValidate
      onSubmit={event => { void form.handleSubmit(submit)(event) }}
      onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close() } }}>
      <h2 className="border-b pb-1 text-xs font-semibold">{title}</h2>
      {mutation.isError && <Alert variant="destructive">
        <AlertTitle>No fue posible guardar el cliente</AlertTitle><AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
      </Alert>}
      <ClientCatalogDetails client={client ?? newDisplay(defaults)}
        editor={{ form, disabled: mutation.isPending, onCodeBlur: value => { void checkCode(value) }, onCodeChange: editCode }} />
      <footer className="flex gap-1">
        <Button disabled={mutation.isPending} size="sm" type="submit">{mutation.isPending && <Spinner />}OK</Button>
        <Button disabled={mutation.isPending} onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
      </footer>
    </form>
  )
}
