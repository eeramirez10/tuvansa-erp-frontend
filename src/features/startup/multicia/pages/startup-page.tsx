import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"

import {
  companiesQueryOptions,
  companyContextQueryOptions,
  companySessionKey,
  getStartupDestination,
} from "@/features/startup/multicia/logic"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

const userFields = [
  { label: "Identificación", type: "text" },
  { label: "Nombre", type: "text" },
  { label: "Clave", type: "password" },
  { label: "Caduca", type: "text" },
]

export function StartupPage() {
  const [showCompanies, setShowCompanies] = useState(false)

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <img src="/favicon.svg" alt="" className="size-5" />
          TUVANSA ERP
        </div>
        {showCompanies ? (
          <CompanySelection />
        ) : (
          <Card aria-labelledby="startup-title">
            <CardHeader className="border-b">
              <h1 id="startup-title" className="text-sm font-semibold">Usuario</h1>
            </CardHeader>
            <CardContent className="grid gap-2">
              {userFields.map(({ label, type }, index) => (
                <div key={label} className="grid gap-1">
                  <Label htmlFor={`startup-user-${index}`}>{label}</Label>
                  <Input id={`startup-user-${index}`} type={type} disabled />
                </div>
              ))}
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t">
              <Button onClick={() => setShowCompanies(true)}>Cancelar</Button>
              <Button variant="outline" disabled>Aceptar</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  )
}

function CompanySelection() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const client = useQueryClient()
  const companies = useQuery(companiesQueryOptions)
  const selection = useMutation({
    mutationFn: async (id: number) => {
      await client.fetchQuery({ ...companyContextQueryOptions(id), staleTime: 0 })
      sessionStorage.setItem(companySessionKey, String(id))
    },
    onSuccess: () => navigate(getStartupDestination(params.get("volver"), window.location.origin), {
      replace: true,
    }),
  })

  return (
    <Card aria-labelledby="startup-title">
      <CardHeader className="border-b">
        <h1 id="startup-title" className="text-sm font-semibold">Selección de multicía</h1>
      </CardHeader>
      <CardContent className="grid gap-2">
        {companies.isPending && <p role="status">Cargando compañías…</p>}
        {companies.isError && (
          <Alert variant="destructive">
            <AlertDescription>No se pudieron cargar las compañías.</AlertDescription>
            <Button variant="outline" onClick={() => void companies.refetch()}>Reintentar</Button>
          </Alert>
        )}
        {companies.data?.length === 0 && <p role="status">No hay compañías disponibles.</p>}
        {companies.data && companies.data.length > 0 && (
          <Table className="text-xs">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead scope="col" className="w-12 text-right">Cía</TableHead>
                <TableHead scope="col" className="w-32">Alias</TableHead>
                <TableHead scope="col">Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.data.map((company) => (
                <TableRow
                  key={company.id}
                  onDoubleClick={() => {
                    if (company.enabled && !selection.isPending) selection.mutate(company.id)
                  }}
                >
                  <TableCell className="text-right tabular-nums">{company.id}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-1"
                      disabled={!company.enabled || selection.isPending}
                      aria-label={company.enabled ? company.alias : `${company.alias}, no disponible`}
                      onClick={() => selection.mutate(company.id)}
                      onDoubleClick={(event) => event.stopPropagation()}
                    >
                      {company.alias}
                    </Button>
                  </TableCell>
                  <TableCell className="whitespace-normal">{company.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {selection.isPending && <p role="status">Validando compañía…</p>}
        {selection.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {isAxiosError<{ error: { message: string } }>(selection.error)
                ? selection.error.response?.data?.error?.message ?? "No se pudo validar la compañía."
                : "No se pudo guardar la selección en esta pestaña."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
