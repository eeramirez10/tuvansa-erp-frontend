import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { ClientFiscalDialog } from "@/features/accounts-receivable/clients/components/client-fiscal-dialog"
import { verifyClientFiscal } from "@/features/accounts-receivable/clients/services/client-fiscal-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/shared/ui/alert-dialog"

export function ClientFiscalAction({ clientId }: { clientId: number }) {
  const [confirm, setConfirm] = useState(false)
  const [editor, setEditor] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const verify = useMutation({
    mutationFn: () => verifyClientFiscal(clientId),
    onSuccess: (result) => setMessage(result.message),
    onError: (error) => setMessage(getApiErrorMessage(error)),
  })
  return <>
    <Button className="w-full justify-start" size="xs" variant="outline" disabled={verify.isPending || editor} title="Ctrl + clic para editar los datos fiscales" onClick={(event) => {
      if (event.ctrlKey) setConfirm(true)
      else verify.mutate()
    }}>{verify.isPending && <Spinner />}Verifica fiscal</Button>
    <AlertDialog open={confirm} onOpenChange={setConfirm}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Desea actualizar los datos?</AlertDialogTitle><AlertDialogDescription>Se abrirán los datos fiscales del cliente para editarlos.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>No</AlertDialogCancel><AlertDialogAction onClick={() => { setConfirm(false); setEditor(true) }}>Yes</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {editor && <DesktopWindowIdentity id={`clients:${clientId}:fiscal`}><ClientFiscalDialog clientId={clientId} onOpenChange={setEditor} onSaved={(text) => { setEditor(false); setMessage(text) }} /></DesktopWindowIdentity>}
    <AlertDialog open={message !== null} onOpenChange={(open) => { if (!open) setMessage(null) }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Verifica fiscal</AlertDialogTitle><AlertDialogDescription>{message}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction onClick={() => setMessage(null)}>OK</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </>
}
