import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { SupplierCatalogDetails } from "@/features/accounts-payable/suppliers/components/supplier-catalog-details"
import { supplierCreateQueryOptions, supplierEditQueryOptions, supplierSearchQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import type { Supplier, SupplierCatalogFields, SupplierCreatePreview, SupplierEditPreview } from "@/features/accounts-payable/suppliers/model"
import { createSupplier, updateSupplier } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { newSupplierDisplay, supplierCatalogSchema, supplierCodeSchema } from "@/features/accounts-payable/suppliers/supplier-catalog-form"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"

const revision = (preview: SupplierCreatePreview | SupplierEditPreview) =>
  "revision" in preview ? preview.revision : null

function CaptureForm({ preview, supplier, loading, reload, onClose, onSaved }: {
  preview: SupplierCreatePreview | SupplierEditPreview
  supplier: Supplier | null
  loading: boolean
  reload: (discardDraft: boolean) => Promise<void>
  onClose: () => void
  onSaved: (supplier: Supplier) => void
}) {
  const [initial] = useState(preview)
  const initialRevision = revision(initial)
  const create = supplier === null
  const codeEditable = !("codeEditable" in initial) || initial.codeEditable
  const form = useForm<SupplierCatalogFields>({
    defaultValues: initial.fields,
    resolver: zodResolver(supplierCatalogSchema(preview.accountingAccountRequired)),
  })
  const queryClient = useQueryClient()
  const inFlight = useRef(false)
  const key = useRef<{ signature: string; id: string } | null>(null)
  const codeRequest = useRef(0)
  const { setFocus } = form
  const codeError = form.formState.errors.code?.type
  const accountError = form.formState.errors.fiscal?.accountingAccount?.type

  const mutation = useMutation({
    mutationFn: (fields: SupplierCatalogFields) => {
      if (supplier && initialRevision) return updateSupplier(supplier.id, initialRevision, fields)
      const signature = JSON.stringify(fields)
      if (key.current?.signature !== signature) key.current = { signature, id: crypto.randomUUID() }
      return createSupplier(key.current.id, fields)
    },
    onSuccess: onSaved,
    onError: (error) => {
      if (!isAxiosError<{ error?: { code?: string } }>(error)) return
      const code = error.response?.data.error?.code
      if (code === "SUPPLIER_CODE_EXISTS") {
        form.setValue("code", initial.fields.code, { shouldDirty: true })
        form.setError("code", { type: "duplicate", message: "El código del proveedor ya existe." })
      }
      if (code === "SUPPLIER_CATALOG_INVALID") {
        form.setError("fiscal.accountingAccount", { type: "account", message: getApiErrorMessage(error) })
      }
      if (!create && error.response?.status === 409) void reload(false)
    },
    onSettled: () => { inFlight.current = false },
  })
  const stale = initialRevision !== revision(preview)
  const saveDisabled = loading || !preview.writable || stale || mutation.isPending
  const display = supplier ? { ...supplier, ...initial.fields } : newSupplierDisplay(initial.fields)

  useEffect(() => {
    setFocus(codeEditable ? "code" : "name", { shouldSelect: true })
    return () => { codeRequest.current += 1 }
  }, [codeEditable, setFocus])
  useEffect(() => {
    if (mutation.isPending) return
    if (codeError === "duplicate") setFocus("code")
    else if (accountError === "account") setFocus("fiscal.accountingAccount")
  }, [accountError, codeError, mutation.isPending, setFocus])

  function changedCode() {
    codeRequest.current += 1
    if (form.getFieldState("code").error?.type === "duplicate") form.clearErrors("code")
  }

  async function checkCode(value: string) {
    const parsed = supplierCodeSchema.safeParse(value)
    if (!codeEditable || !parsed.success || parsed.data === initial.fields.code.trim().toUpperCase()) return
    const attempt = ++codeRequest.current
    try {
      const result = await queryClient.fetchQuery({
        ...supplierSearchQueryOptions({ q: parsed.data, status: "all", page: 1, pageSize: 100 }),
        staleTime: 0,
      })
      if (attempt !== codeRequest.current || form.getValues("code").trim().toUpperCase() !== parsed.data) return
      if (result.data.some(row => row.id !== supplier?.id && row.code.trim().toUpperCase() === parsed.data)) {
        form.setValue("code", initial.fields.code, { shouldDirty: true })
        form.setError("code", { type: "duplicate", message: `El código ${parsed.data} ya existe.` }, { shouldFocus: true })
      }
    } catch {
      // The save endpoint still validates exact uniqueness if the search is unavailable.
    }
  }

  function submit(fields: SupplierCatalogFields) {
    if (saveDisabled || inFlight.current || (!create && !initialRevision)) return
    inFlight.current = true
    mutation.mutate(fields)
  }

  return (
    <form aria-label={create ? "Alta de proveedores" : "Cambio al proveedor actual"} className="grid min-w-0 gap-2"
      noValidate onSubmit={event => { void form.handleSubmit(submit)(event) }}>
      {stale && (
        <Alert variant="destructive">
          <AlertTitle>La ficha cambió en otra sesión</AlertTitle>
          <AlertDescription>El borrador sigue visible. Recarga la ficha para usar la revisión vigente.</AlertDescription>
          <Button className="w-fit" disabled={loading || mutation.isPending} onClick={() => void reload(true)}
            size="xs" type="button" variant="outline">Descartar cambios y recargar</Button>
        </Alert>
      )}
      {mutation.isError && !stale && <Alert variant="destructive">
        <AlertTitle>No fue posible guardar el proveedor</AlertTitle><AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
      </Alert>}
      {!codeEditable && <p className="text-muted-foreground">El código queda fijo por las referencias del proveedor.</p>}
      <SupplierCatalogDetails editor={{ form, disabled: mutation.isPending, codeEditable, onCodeBlur: value => { void checkCode(value) },
        onCodeChange: changedCode }} supplier={display} />
      <footer className="flex gap-1">
        <Button disabled={saveDisabled} size="sm" type="submit">{mutation.isPending && <Spinner />}OK</Button>
        <Button disabled={mutation.isPending} onClick={() => { if (!inFlight.current) onClose() }}
          size="sm" type="button" variant="outline">Cancelar</Button>
      </footer>
    </form>
  )
}

export function SupplierCatalogCapture({ supplier, onClose, onSaved }: {
  supplier: Supplier | null
  onClose: () => void
  onSaved: (supplier: Supplier) => void
}) {
  const [generation, setGeneration] = useState(0)
  const creating = supplier === null
  const createQuery = useQuery({ ...supplierCreateQueryOptions(), enabled: creating })
  const editQuery = useQuery({ ...supplierEditQueryOptions(supplier?.id ?? 0), enabled: !creating })
  const query = creating ? createQuery : editQuery
  const preview = query.data

  async function reload(discardDraft: boolean) {
    const result = await query.refetch()
    if (discardDraft && result.isSuccess) setGeneration(current => current + 1)
  }

  return (
    <div className="grid min-w-0 gap-2">
      <h2 className="border-b pb-1 text-xs font-semibold">{creating ? "Alta de proveedores" : "Cambio al proveedor actual"}</h2>
      {query.isPending && <p className="flex items-center gap-1" role="status"><Spinner /> Consultando la ficha…</p>}
      {query.isError && <Alert variant="destructive">
        <AlertTitle>No fue posible consultar la ficha</AlertTitle><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription>
        <Button className="w-fit" disabled={query.isFetching} onClick={() => void reload(false)} size="xs" type="button" variant="outline">Reintentar</Button>
      </Alert>}
      {preview && !preview.writable && <Alert role="status">
        <AlertDescription>{preview.reason || "La ficha está disponible para consulta."}</AlertDescription>
      </Alert>}
      {preview?.writable ? (
        <CaptureForm key={generation} loading={query.isFetching || query.isError} onClose={onClose}
          onSaved={onSaved} preview={preview} reload={reload} supplier={supplier} />
      ) : (
        <Button className="w-fit" onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
      )}
    </div>
  )
}
