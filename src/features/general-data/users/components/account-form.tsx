import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router"
import { z } from "zod"
import { paths } from "@/app/router/paths"
import { getStartupDestination } from "@/features/startup/multicia/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { userDirectoryKey, webSessionKey } from "../logic"
import { identificationSchema } from "../model"
import { activateWebAccount, startWebSession } from "../services/users-service"

const loginSchema = z.object({ identification: identificationSchema, password: z.string().min(1, "Ingresa tu contraseña").max(128) })
const activationSchema = z.object({
  identification: z.string(),
  password: z.string().min(6, "Usa al menos 6 caracteres").max(128),
  confirmation: z.string(),
}).refine(values => values.password === values.confirmation, { path: ["confirmation"], message: "Las contraseñas deben coincidir" })

export function AccountForm({ activating = false }: { activating?: boolean }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [params] = useSearchParams()
  const [failure, setFailure] = useState("")
  const [activated, setActivated] = useState(false)
  const token = hash.slice(1)
  const validToken = /^[A-Za-z0-9_-]{43}$/.test(token)
  const { register, handleSubmit, resetField, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(activating ? activationSchema : loginSchema.extend({ confirmation: z.string() })),
    defaultValues: { identification: "", password: "", confirmation: "" },
  })
  const submit = handleSubmit(async values => {
    setFailure("")
    try {
      if (activating) {
        await activateWebAccount(token, values.password)
        setActivated(true)
        void navigate(paths.activateAccount, { replace: true })
        return
      }
      const session = await startWebSession(values.identification, values.password)
      await queryClient.cancelQueries({ queryKey: webSessionKey })
      queryClient.removeQueries({ queryKey: userDirectoryKey })
      queryClient.setQueryData(webSessionKey, session)
      void navigate(getStartupDestination(params.get("volver"), window.location.origin), { replace: true })
    } catch (error) {
      setFailure(getApiErrorMessage(error))
    } finally {
      resetField("password")
      resetField("confirmation")
    }
  })

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>{activating ? "Activar cuenta web" : "Iniciar sesión · TUVANSA México"}</CardTitle></CardHeader>
        <CardContent>
          {activated ? (
            <div className="grid gap-3">
              <p>Tu contraseña quedó registrada.</p>
              <Button render={<Link to={paths.signIn} />}>Iniciar sesión</Button>
            </div>
          ) : activating && !validToken ? (
            <Alert variant="destructive"><AlertDescription>Abre el enlace de activación que te entregó tu administrador.</AlertDescription></Alert>
          ) : (
            <form className="grid gap-3" onSubmit={submit}>
              {!activating && <div className="grid gap-1">
                <Label htmlFor="web-identification">Identificación</Label>
                <Input id="web-identification" autoComplete="username" autoFocus maxLength={32}
                  aria-invalid={Boolean(errors.identification)} {...register("identification")} />
                {errors.identification && <p role="alert" className="text-destructive">{errors.identification.message}</p>}
              </div>}
              <div className="grid gap-1">
                <Label htmlFor="web-password">{activating ? "Nueva contraseña" : "Contraseña"}</Label>
                <Input id="web-password" type="password" autoComplete={activating ? "new-password" : "current-password"}
                  autoFocus={activating} maxLength={128} aria-invalid={Boolean(errors.password)} {...register("password")} />
                {errors.password && <p role="alert" className="text-destructive">{errors.password.message}</p>}
              </div>
              {activating && <div className="grid gap-1">
                <Label htmlFor="web-password-confirmation">Confirmar contraseña</Label>
                <Input id="web-password-confirmation" type="password" autoComplete="new-password" maxLength={128}
                  aria-invalid={Boolean(errors.confirmation)} {...register("confirmation")} />
                {errors.confirmation && <p role="alert" className="text-destructive">{errors.confirmation.message}</p>}
              </div>}
              {failure && <Alert variant="destructive" role="alert"><AlertDescription>{failure}</AlertDescription></Alert>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" render={<Link to={paths.home} />}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Spinner />}{activating ? "Guardar contraseña" : "Entrar"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
