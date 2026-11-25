import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { accountingPolicyClassificationsQueryOptions, accountingPolicyKeys } from "@/features/accounting/policies/logic"
import type { AccountingPolicy, AccountingPolicyClassificationInput, AccountingPolicyClassifications } from "@/features/accounting/policies/model"
import { saveAccountingPolicyClassification } from "@/features/accounting/policies/services/accounting-policy-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Spinner } from "@/shared/ui/spinner"

const schema = z.object({ compositeCode: z.string().min(1).max(4) })

export function AccountingPolicyClassificationDialog({ policy, onClose }: { policy: AccountingPolicy; onClose: () => void }) {
  const query = useQuery(accountingPolicyClassificationsQueryOptions(policy.id))
  if (query.data && query.isFetchedAfterMount && !query.isError) {
    return <ClassificationEditor key={policy.id} data={query.data} onClose={onClose} />
  }
  return <ErpDataDialog defaultWidth={480} description={policy.number} title="Clasificadores"
    onOpenChange={(open) => { if (!open) onClose() }}>
    <ErpDataDialogBody>
      {query.isError
        ? <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>
        : <div className="grid min-h-32 place-items-center"><Spinner /></div>}
    </ErpDataDialogBody>
  </ErpDataDialog>
}

function ClassificationEditor({ data, onClose }: { data: AccountingPolicyClassifications; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { policy, items, summary } = data
  const [initial] = useState(() => ({ code: summary.current[0] ?? "", revision: summary.revision }))
  const request = useRef<AccountingPolicyClassificationInput>(null)
  const pending = useRef(false)
  const { control, formState: { isDirty }, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { compositeCode: initial.code },
  })
  const save = useMutation({
    mutationFn: (input: AccountingPolicyClassificationInput) => saveAccountingPolicyClassification(policy.id, input),
    onSuccess: () => {
      onClose()
      void queryClient.invalidateQueries({ queryKey: accountingPolicyKeys.all })
    },
    onSettled: () => { pending.current = false },
  })
  const close = () => { if (!pending.current) onClose() }
  const closeOnChange = (open: boolean) => { if (!open) close() }
  const readonly = !summary.canWrite || save.isPending
  const previousCode = initial.code

  function submit({ compositeCode }: z.infer<typeof schema>) {
    if (pending.current || !summary.canWrite || !isDirty) return
    if (request.current?.compositeCode !== compositeCode) {
      request.current = { compositeCode, revision: initial.revision, requestKey: crypto.randomUUID() }
    }
    pending.current = true
    save.mutate(request.current)
  }

  return (
    <ErpDataDialog defaultWidth={480} description={policy.number} onOpenChange={closeOnChange} title="Clasificadores">
      <ErpDataDialogBody>
        <form className="grid gap-2 text-xs" onSubmit={(event) => { void handleSubmit(submit)(event) }}>
          {summary.reason && <Alert><AlertDescription>{summary.reason}</AlertDescription></Alert>}
          {previousCode && !items.some(({ compositeCode }) => compositeCode === previousCode) && (
            <p>Clasificador actual {previousCode}</p>
          )}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <ErpDataTableViewport axes="y" className="h-36 border">
              <Controller control={control} name="compositeCode" render={({ field }) => (
                <RadioGroup aria-label="Clasificador de póliza" className="gap-0" disabled={readonly}
                  onValueChange={field.onChange} value={field.value}>
                  {items.map(({ code, description, compositeCode }) => (
                    <label className="flex min-h-6 items-center gap-2 border-b px-2 py-1" key={compositeCode}>
                      <RadioGroupItem disabled={!compositeCode || compositeCode.length > 4} value={compositeCode} />
                      <span>{code}</span><span>{description}</span>
                    </label>
                  ))}
                </RadioGroup>
              )} />
            </ErpDataTableViewport>
            <Button disabled={readonly || !isDirty} size="sm" type="submit">
              {save.isPending && <Spinner />}Guardar
            </Button>
          </div>
          {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
