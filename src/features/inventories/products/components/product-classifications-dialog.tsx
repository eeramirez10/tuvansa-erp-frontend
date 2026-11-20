import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useState, type FormEvent, type ReactNode } from "react"
import { useForm, useWatch } from "react-hook-form"

import { productClassificationQueryOptions, productKeys } from "@/features/inventories/products/logic"
import {
  productClassificationFormSchema,
  type Product,
  type ProductClassification,
  type ProductClassificationForm,
  type ProductClassificationOption,
  type ProductClassificationUpdate,
} from "@/features/inventories/products/model"
import { updateProductClassification } from "@/features/inventories/products/services/product-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { cn } from "@/shared/utils/cn"

type ClassificationSelection = Pick<ProductClassificationOption, "code" | "number" | "description">
type OptionSort = "number" | "description"

type SelectedClassificationGroup = {
  id: string
  label: string
  selection: ClassificationSelection | null
  flag: string
}

type ClassificationsSelectorProps = {
  groups: SelectedClassificationGroup[]
  group: SelectedClassificationGroup | undefined
  options: ProductClassificationOption[]
  optionCode: string | undefined
  optionsNotice?: ReactNode
  pending: boolean
  canTransfer: boolean
  sort: OptionSort
  onGroup: (id: string) => void
  onOption: (code: string) => void
  onSort: (sort: OptionSort) => void
  onTransfer: (code: string) => void
}

const rowClass = "h-4 cursor-pointer border-b border-dotted border-input hover:bg-muted/60 data-[state=selected]:bg-module-inventory data-[state=selected]:text-module-inventory-foreground"
const headClass = "h-5 border-r border-input px-1 py-0 text-[9px] font-normal last:border-r-0"
const cellClass = "truncate border-r border-input px-1 py-0 last:border-r-0"
const rowButtonClass = "h-4 w-full justify-start rounded-none p-0 text-[9px] font-normal text-inherit hover:bg-transparent"
const optionCollator = new Intl.Collator("es", { sensitivity: "base" })

function PaneHeading({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <h3 className={cn("flex h-5 shrink-0 items-center border border-b-0 border-input bg-background px-1 font-semibold", centered && "justify-center")}>
      {children}
    </h3>
  )
}

function ClassificationsSelector({
  groups, group, options, optionCode, optionsNotice, pending, canTransfer, sort,
  onGroup, onOption, onSort, onTransfer,
}: ClassificationsSelectorProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] gap-1.5">
      <section aria-label="Seleccionados" className="flex min-h-0 min-w-0 flex-col">
        <PaneHeading centered>SELECCIONADOS</PaneHeading>
        <ErpDataTableViewport className="min-h-28 flex-1">
          <table className="w-full min-w-72 table-fixed border-collapse text-[9px]/none">
            <colgroup>
              <col className="w-6" />
              <col className="w-28" />
              <col className="w-12" />
              <col />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className={headClass}>F.</TableHead>
                <TableHead className={headClass}>Fam</TableHead>
                <TableHead className={headClass}>Cod.</TableHead>
                <TableHead className={headClass}>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((item) => (
                <TableRow
                  className={cn(rowClass, !item.label && "cursor-default hover:bg-transparent")}
                  data-state={item.id === group?.id ? "selected" : undefined}
                  key={item.id}
                  onClick={() => { if (!pending && item.label) onGroup(item.id) }}
                >
                  <TableCell className={cellClass}>{item.flag}</TableCell>
                  <TableCell className={cellClass}>
                    {item.label && (
                      <Button
                        aria-pressed={item.id === group?.id}
                        className={rowButtonClass}
                        disabled={pending}
                        title={item.label}
                        type="button"
                        variant="ghost"
                      >
                        <span className="truncate">{item.label}</span>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className={cellClass}>{item.selection?.number}</TableCell>
                  <TableCell className={cellClass} title={item.selection?.description}>{item.selection?.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </ErpDataTableViewport>
      </section>

      <Button
        aria-label="Pasar opción a seleccionados"
        className="mt-11 h-5 min-w-9 px-1"
        disabled={!canTransfer || pending}
        onClick={() => { if (optionCode) onTransfer(optionCode) }}
        type="button"
        variant="outline"
      >
        &lt;
      </Button>

      <section aria-label={group?.label ?? "Opciones de clasificación"} className="flex min-h-0 min-w-0 flex-col">
        <PaneHeading>{group?.label}</PaneHeading>
        <ErpDataTableViewport className="min-h-28 flex-1" key={group?.id}>
          <table className="w-full min-w-40 table-fixed border-collapse text-[9px]/none">
            <colgroup><col className="w-12" /><col /></colgroup>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                {([["number", "Fam"], ["description", "Descripción"]] as const).map(([name, label]) => (
                  <TableHead aria-sort={sort === name ? "ascending" : "none"} className={headClass} key={name}>
                    <Button
                      className={rowButtonClass}
                      disabled={!group || pending}
                      onClick={() => onSort(name)}
                      type="button"
                      variant="ghost"
                    >
                      {label}
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option) => (
                <TableRow
                  className={rowClass}
                  data-state={option.code === optionCode ? "selected" : undefined}
                  key={option.id}
                  onClick={() => { if (!pending) onOption(option.code) }}
                  onDoubleClick={() => { if (!pending) onTransfer(option.code) }}
                >
                  <TableCell className={cellClass}>{option.number}</TableCell>
                  <TableCell className={cellClass}>
                    <Button
                      aria-pressed={option.code === optionCode}
                      className={rowButtonClass}
                      disabled={pending}
                      title={option.description}
                      type="button"
                      variant="ghost"
                    >
                      <span className="truncate">{option.description}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {optionsNotice && <TableRow><TableCell className="p-2" colSpan={2}>{optionsNotice}</TableCell></TableRow>}
            </TableBody>
          </table>
        </ErpDataTableViewport>
      </section>
    </div>
  )
}

type ProductClassificationsDialogProps = {
  product: Product
  onOpenChange: (open: boolean) => void
}

export function ProductClassificationsDialog({ product, onOpenChange }: ProductClassificationsDialogProps) {
  const queryClient = useQueryClient()
  const queryOptions = productClassificationQueryOptions(product.id)
  const classificationQuery = useQuery(queryOptions)
  const [baseline, setBaseline] = useState<ProductClassification>()
  const [groupKey, setGroupKey] = useState<string>()
  const [optionCode, setOptionCode] = useState<string>()
  const [sort, setSort] = useState<OptionSort>("number")
  const form = useForm<ProductClassificationForm>({
    defaultValues: { changes: {} },
    resolver: zodResolver(productClassificationFormSchema),
  })
  const changes = useWatch({ control: form.control, name: "changes" })
  const classification = baseline ?? classificationQuery.data?.data.classification
  const groups = classification?.groups.map((group) => {
    const edited = group.options.find((option) => option.code === changes[group.key])
    return {
      id: group.key,
      label: group.label,
      flag: edited ? group.key : group.selectedFlag,
      selection: edited ?? (group.selectedFlag ? {
        code: group.selectedCode,
        number: group.selectedNumber,
        description: group.selectedDescription,
      } : null),
    }
  }) ?? []
  const groupIndex = groups.findIndex(({ id }) => id === groupKey)
  const group = groups[groupIndex]
  const previousNumber = groups[groupIndex - 1]?.selection?.number
  const activeOptions = classification?.groups[groupIndex]?.options ?? []
  const options = activeOptions
    .filter(({ parentCode }) => groupKey === "1" || parentCode === "" || parentCode === previousNumber)
    .sort((left, right) => optionCollator.compare(left[sort], right[sort]) || optionCollator.compare(left.number, right.number))
  const mutation = useMutation({
    mutationFn: (input: ProductClassificationUpdate) => updateProductClassification(product.id, input),
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryOptions.queryKey, exact: true })
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(queryOptions.queryKey, response)
      const familyCode = response.data.classification.familyCode
      queryClient.setQueryData<Product>(productKeys.detail(product.id), (current) => current && ({
        ...current,
        classification: { ...current.classification, familyCode },
      }))
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(product.id), exact: true })
      onOpenChange(false)
    },
  })

  function transfer(code: string) {
    if (!classification?.writable || mutation.isPending || !groupKey || !options.some((option) => option.code === code)) return
    const currentGroup = classification.groups[groupIndex]
    if (!currentGroup || currentGroup.key !== groupKey) return
    const next = { ...changes }
    if (code === currentGroup.selectedCode) delete next[groupKey]
    else next[groupKey] = code
    setBaseline(classification)
    setOptionCode(code)
    mutation.reset()
    form.setValue("changes", next, { shouldDirty: true })
  }

  function changeGroup(key: string) {
    if (key === groupKey) return
    setGroupKey(key)
    setOptionCode(undefined)
    setSort("number")
  }

  function save(rebuildFamily: boolean, event?: FormEvent<HTMLFormElement>) {
    return form.handleSubmit((values) => {
      if (!classification?.writable || mutation.isPending) return
      mutation.mutate({ revision: classification.revision, changes: values.changes, ...(rebuildFamily && { rebuildFamily }) })
    })(event)
  }
  const optionsNotice = group && options.length === 0 ? "Sin opciones para esta familia." : undefined

  return (
    <ErpDataDialog
      defaultHeight={486}
      defaultWidth={764}
      description={`Seleccione los parámetros del producto ${product.code}.`}
      fillHeight
      onOpenChange={(open) => { if (!mutation.isPending) onOpenChange(open) }}
      title="Selección de parámetros"
    >
      <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col p-2">
        {classificationQuery.isPending ? (
          <div className="flex flex-1 items-center justify-center gap-1.5" role="status">
            <Spinner /> Cargando clasificación…
          </div>
        ) : !classification ? (
          <Alert variant="destructive">
            <AlertTitle>No fue posible cargar la clasificación</AlertTitle>
            <AlertDescription>
              {classificationQuery.isError
                ? getApiErrorMessage(classificationQuery.error)
                : "La API no devolvió los parámetros de clasificación."}
              <Button className="ml-2" onClick={() => void classificationQuery.refetch()} size="sm" type="button" variant="outline">Reintentar</Button>
            </AlertDescription>
          </Alert>
        ) : (
          <form
            className="flex min-h-0 flex-1 flex-col gap-1.5"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !mutation.isPending) {
                event.preventDefault()
                onOpenChange(false)
              }
            }}
            onSubmit={(event) => void save(false, event)}
          >
            <ClassificationsSelector
              canTransfer={Boolean(classification.writable && optionCode && options.some(({ code }) => code === optionCode))}
              group={group}
              groups={groups}
              onGroup={changeGroup}
              onOption={setOptionCode}
              onSort={setSort}
              onTransfer={transfer}
              optionCode={optionCode}
              options={options}
              optionsNotice={optionsNotice}
              pending={mutation.isPending}
              sort={sort}
            />
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertTitle>No fue posible guardar la clasificación</AlertTitle>
                <AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
              </Alert>
            )}
            <footer className="flex shrink-0 items-center justify-end gap-2">
              {!classification.writable && <p className="text-muted-foreground">Clasificación disponible para consulta.</p>}
              <Button
                disabled={!classification.writable || mutation.isPending}
                onClick={(event) => {
                  if (event.shiftKey) {
                    event.preventDefault()
                    void save(true)
                  }
                }}
                size="sm"
                type="submit"
                variant="outline"
              >
                {mutation.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </footer>
          </form>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
