import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { profileSchema, type DirectoryUser, type UserProfile } from "../model"
import { saveUser } from "../services/users-service"
import { AccessError, GroupSelect } from "./directory-controls"

export function UserEditor({ user, onSaved, close }: { user?: DirectoryUser; onSaved: (saved: DirectoryUser) => void; close: () => void }) {
  const [failure, setFailure] = useState<unknown>(null)
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<UserProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      identification: user?.identification ?? "", name: user?.name ?? "", group: user?.group ?? 1,
      active: user?.active ?? true, administrator: user?.administrator ?? false,
    },
  })
  const submit = handleSubmit(async profile => {
    setFailure(null)
    try {
      onSaved(await saveUser(profile, user))
    } catch (error) {
      setFailure(error)
    }
  })
  return (
    <ErpDataDialog title={user ? "Cambio de usuario" : "Alta de usuario"} description={user?.identification ?? "Cuenta web"} defaultWidth={440}
      onOpenChange={open => { if (!open && !isSubmitting) close() }}>
      <ErpDataDialogBody>
        <form className="grid gap-3" onSubmit={submit}>
          <div className="grid gap-1">
            <Label htmlFor="profile-identification">Identificación web</Label>
            <Input id="profile-identification" autoFocus maxLength={32} aria-invalid={Boolean(errors.identification)} {...register("identification")} />
            {errors.identification && <p role="alert" className="text-destructive">{errors.identification.message}</p>}
          </div>
          {user?.legacyId && <p className="text-muted-foreground">German · {user.legacyIdentification} · {user.legacyId}</p>}
          <div className="grid gap-1">
            <Label htmlFor="profile-name">Nombre</Label>
            <Input id="profile-name" maxLength={46} aria-invalid={Boolean(errors.name)} {...register("name")} />
            {errors.name && <p role="alert" className="text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="profile-group">Grupo</Label>
            <Controller control={control} name="group" render={({ field }) => (
              <GroupSelect id="profile-group" value={field.value} onChange={field.onChange} />
            )} />
            {errors.group && <p role="alert" className="text-destructive">Selecciona un grupo válido.</p>}
          </div>
          <Label className="flex gap-2">
            <Controller control={control} name="active" render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={user?.legacyActive === false} />
            )} />
            Cuenta web habilitada
          </Label>
          {user?.legacyActive === false && <p className="text-muted-foreground">Usuario dado de baja en German.</p>}
          <Label className="flex gap-2">
            <Controller control={control} name="administrator" render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            )} />
            Administrador web
          </Label>
          {failure != null && <AccessError error={failure} />}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={isSubmitting} onClick={close}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Spinner />}Guardar</Button>
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
