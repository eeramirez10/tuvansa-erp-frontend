import { useRef, useState } from "react"
import { paths } from "@/app/router/paths"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import type { DirectoryUser } from "../model"
import { issueActivation } from "../services/users-service"
import { AccessError } from "./directory-controls"

export function UserActivation({ user, onClose }: { user: DirectoryUser; onClose: (changed: boolean) => void }) {
  const [link, setLink] = useState("")
  const [failure, setFailure] = useState<unknown>(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const action = user.configured ? "Restablecer contraseña" : "Activar cuenta"
  async function generate() {
    setFailure(null)
    setPending(true)
    try {
      const { token } = await issueActivation(user)
      setLink(new URL(`${paths.activateAccount}#${token}`, window.location.origin).toString())
    } catch (error) {
      setFailure(error)
    } finally {
      setPending(false)
    }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true) }
    catch { input.current?.focus(); input.current?.select() }
  }
  return (
    <ErpDataDialog title={action} description={user.identification} defaultWidth={510}
      onOpenChange={open => { if (!open && !pending) onClose(Boolean(link)) }}>
      <ErpDataDialogBody className="grid gap-3">
        {link ? <>
          <Label htmlFor="activation-link">Enlace de un solo uso · Vigencia de 24 horas</Label>
          <Input id="activation-link" ref={input} value={link} readOnly onFocus={event => event.currentTarget.select()} />
        </> : user.configured && <p>El enlace cancela las sesiones vigentes y sustituye la contraseña de esta cuenta.</p>}
        {failure != null && <AccessError error={failure} />}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={pending} onClick={() => onClose(Boolean(link))}>{link ? "Cerrar" : "Cancelar"}</Button>
          {link ? <Button onClick={() => void copy()}>{copied ? "Copiado" : "Copiar enlace"}</Button> :
            <Button onClick={() => void generate()} disabled={pending}>{pending && <Spinner />}Generar enlace</Button>}
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
