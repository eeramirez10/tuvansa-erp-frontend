import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { clientClassificationsQueryOptions } from "@/features/accounts-receivable/clients/logic"
import type {
  Client,
  ClientClassification,
  ClientClassificationOption,
} from "@/features/accounts-receivable/clients/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type ClientClassificationsDialogProps = {
  client: Client
  onOpenChange: (open: boolean) => void
}

function OptionsTable({ options }: { options: ClientClassificationOption[] }) {
  return (
    <div className="min-w-0">
      <ErpDataTableViewport axes="xy" className="h-[27rem]">
        <table className="w-full min-w-[18rem] table-fixed border-collapse text-[9px]/none">
          <colgroup><col className="w-[3.4rem]" /><col /></colgroup>
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="h-5 border-b border-input">
              <th className="border-r px-1 text-left font-normal">Fam</th>
              <th className="px-1 text-left font-normal">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr className="h-4 border-b border-dotted border-input/70 hover:bg-muted/60" key={option.id}>
                <td className="border-r px-1 tabular-nums">{option.number}</td>
                <td className="truncate px-1" title={option.description}>{option.description}</td>
              </tr>
            ))}
            {options.length === 0 && (
              <tr><td className="h-[22rem] text-center text-muted-foreground" colSpan={2}>Sin opciones configuradas</td></tr>
            )}
          </tbody>
        </table>
      </ErpDataTableViewport>
    </div>
  )
}

function SelectedTable({ classifications, activePosition }: {
  classifications: ClientClassification[]
  activePosition: number
}) {
  return (
    <div className="min-w-0">
      <div className="flex h-5 items-center justify-center border border-b-0 border-input bg-background font-semibold">
        SELECCIONADOS
      </div>
      <ErpDataTableViewport axes="xy" className="h-[27rem]">
        <table className="w-full min-w-[25rem] table-fixed border-collapse text-[9px]/none">
          <colgroup><col className="w-[5.6rem]" /><col className="w-[3.4rem]" /><col /></colgroup>
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="h-5 border-b border-input">
              <th className="border-r px-1 text-left font-normal">Fam</th>
              <th className="border-r px-1 text-center font-normal">Cod.</th>
              <th className="px-1 text-left font-normal">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {classifications.map((classification) => (
              <tr
                className={cn(
                  "h-5 border-b border-dotted border-input/70",
                  classification.position === activePosition && "bg-module-receivable text-module-receivable-foreground",
                )}
                key={classification.position}
              >
                <td className="border-r px-1">{classification.label}</td>
                <td className="border-r px-1 text-center tabular-nums">{classification.number}</td>
                <td className="truncate px-1" title={classification.description}>{classification.description}</td>
              </tr>
            ))}
            <tr><td className="h-[14rem]" colSpan={3} /></tr>
          </tbody>
        </table>
      </ErpDataTableViewport>
    </div>
  )
}

export function ClientClassificationsDialog({ client, onOpenChange }: ClientClassificationsDialogProps) {
  const [position, setPosition] = useState(1)
  const query = useQuery(clientClassificationsQueryOptions(client.id, position))
  const data = query.data?.data
  const classifications = data?.classifications ?? []
  const active = classifications.find((classification) => classification.position === position)

  return (
    <ErpDataDialog
      className="sm:max-w-[63rem]"
      description={`Clasificaciones configuradas para ${client.code}.`}
      onOpenChange={onOpenChange}
      title="Seleccion de parametros"
      tone="receivable"
    >
      <ErpDataDialogBody className="h-[32rem] p-3">
        {query.isError && (
          <Alert className="mb-2" variant="destructive">
            <AlertTitle>No fue posible cargar las clasificaciones</AlertTitle>
            <AlertDescription>La API no devolvió las opciones de la familia seleccionada.</AlertDescription>
          </Alert>
        )}

        <div className="ml-4 grid w-max grid-cols-[10.4rem_18.5rem_25.5rem] items-start gap-2.5">
          <div className="grid grid-cols-[6rem_3.8rem] gap-x-1 gap-y-px pt-5">
            {classifications.map((classification) => (
              <div className="contents" key={classification.position}>
                <Button
                  className={cn(
                    "h-5 justify-center rounded-none px-1 text-[9px] font-normal",
                    classification.position === position && "border-module-receivable bg-module-receivable/15 ring-1 ring-inset ring-module-receivable/50",
                  )}
                  onClick={() => setPosition(classification.position)}
                  size="xs"
                  type="button"
                  variant="outline"
                >
                  {classification.label}
                </Button>
                <Button className="h-5 rounded-none px-1 text-[9px] font-normal" size="xs" type="button" variant="outline">
                  Guardar
                </Button>
              </div>
            ))}
            <Button className="col-span-2 mt-2 h-6 rounded-none text-[9px] font-normal" size="xs" type="button" variant="outline">
              Guardar todos
            </Button>
          </div>

          <div className="relative">
            <div className="flex h-5 items-center justify-center border border-b-0 border-input bg-background font-semibold">
              {active?.label ?? "CLASIFICACIÓN"}
            </div>
            <OptionsTable options={data?.options ?? []} />
            {query.isFetching && (
              <div className="absolute inset-x-0 top-10 grid place-items-center pointer-events-none">
                <Spinner />
              </div>
            )}
          </div>

          <SelectedTable activePosition={position} classifications={classifications} />
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
