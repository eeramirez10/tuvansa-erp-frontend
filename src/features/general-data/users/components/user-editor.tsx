import { zodResolver } from "@hookform/resolvers/zod"
import { useId, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { directoryState } from "../logic"
import { profileSchema, type DirectoryUser, type DirectoryUserDetail, type UserProfile } from "../model"
import { saveUser } from "../services/users-service"
import { AccessError, GroupSelect } from "./directory-controls"

type Props = {
  user: DirectoryUserDetail | null
  mode: "view" | "create" | "edit"
  busy: boolean
  onSaved: (user: DirectoryUser) => void
  onCancel: () => void
  onPermissions: () => void
  onActivation: () => void
  onReload: () => void
}

const linkDate = new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short", timeZone: "America/Mexico_City" })

function ReferenceField({ label, value, className, multiline }: {
  label: string; value?: string | number | null; className?: string; multiline?: boolean
}) {
  const id = useId()
  const narrowed = value ?? ""
  return (
    <div className={cn("grid min-w-0 content-start gap-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      {multiline
        ? <Textarea id={id} value={narrowed} readOnly rows={2} className="min-h-12 resize-y" />
        : <Input id={id} value={narrowed} readOnly className="bg-muted/35" />}
    </div>
  )
}

function GermanAccessFlag({ label, value }: { label: string; value?: boolean | null }) {
  return (
    <Label className="flex items-center gap-2">
      <Checkbox checked={value === true} indeterminate={value == null} disabled className="disabled:opacity-100" />
      {label}
    </Label>
  )
}

export function UserEditor({ user, mode, busy, onSaved, onCancel, onPermissions, onActivation, onReload }: Props) {
  const details = user?.legacyDetails
  const editing = mode !== "view"
  const [failure, setFailure] = useState<unknown>(null)
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<UserProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      identification: user?.identification ?? "", name: user?.name ?? "", group: user?.group ?? 1,
      active: user?.active ?? mode === "create", administrator: user?.administrator ?? false,
    },
  })
  const submit = handleSubmit(async profile => {
    if (!editing) return
    setFailure(null)
    try {
      onSaved(await saveUser(profile, mode === "edit" ? user ?? undefined : undefined))
    } catch (error) {
      setFailure(error)
    }
  })

  return (
    <form className="grid min-w-0 gap-3" onSubmit={submit} onKeyDown={event => {
      if (!editing || event.defaultPrevented || isSubmitting || event.nativeEvent.isComposing) return
      if (event.key === "Escape") {
        if (event.target instanceof Element && event.target.closest("[role=listbox]")) return
        event.preventDefault()
        event.stopPropagation()
        onCancel()
      }
      if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type === "text" && !event.target.readOnly) {
        event.preventDefault()
        event.currentTarget.requestSubmit()
      }
    }}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6">
        <ReferenceField label="Secuencia" value={user?.legacyId} />
        <div className="grid min-w-0 gap-1 sm:col-span-2">
          <Label htmlFor="profile-identification">Código</Label>
          <Input id="profile-identification" readOnly={!editing} disabled={isSubmitting} autoFocus={mode === "create"} maxLength={32}
            aria-invalid={Boolean(errors.identification)} {...register("identification")} />
          {errors.identification && <p role="alert" className="text-xs text-destructive">{errors.identification.message}</p>}
          {user?.legacyIdentification && user.legacyIdentification.toLowerCase() !== user.identification.toLowerCase() &&
            <p className="text-xs text-muted-foreground">Código German {user.legacyIdentification}</p>}
        </div>
        <div className="grid min-w-0 content-start gap-1 sm:col-span-3">
          <Label htmlFor="user-key-state">Clave web</Label>
          <div className="flex flex-wrap gap-1">
            <Input id="user-key-state" className="min-w-22 flex-1 bg-muted/35" readOnly value={user ? directoryState(user) : ""} />
            {user && !editing && <Button type="button" size="sm" variant="outline" disabled={busy || !user.effectiveActive} onClick={onActivation}>
              {user.configured ? "Reinicia clave" : "Activar"}
            </Button>}
          </div>
        </div>
        <div className="col-span-2 grid min-w-0 content-start gap-1 sm:col-span-4">
          <Label htmlFor="profile-name">Nombre</Label>
          <Input id="profile-name" readOnly={!editing} disabled={isSubmitting} autoFocus={mode === "edit"} maxLength={46}
            aria-invalid={Boolean(errors.name)} {...register("name")} />
          {errors.name && <p role="alert" className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <ReferenceField label="Caduca el enlace" className="col-span-2"
          value={user?.activationExpiresAt ? linkDate.format(new Date(user.activationExpiresAt)) : ""} />
        <div className="grid min-w-0 content-start gap-1 sm:col-span-2">
          <Label htmlFor="profile-group">Grupo</Label>
          {editing
            ? <Controller control={control} name="group" render={({ field }) => (
              <GroupSelect id="profile-group" value={field.value} onChange={field.onChange} disabled={isSubmitting} />
            )} />
            : <div className="flex flex-wrap gap-1">
              <Input id="profile-group" readOnly value={user?.group ?? ""} className="min-w-10 flex-1 bg-muted/35" />
              <Button type="button" size="sm" variant="outline" disabled={busy} aria-label="Permisos del grupo" onClick={onPermissions}>Permisos</Button>
            </div>}
          {errors.group && <p role="alert" className="text-xs text-destructive">Selecciona un grupo válido.</p>}
        </div>
        <ReferenceField label="Cía." value={details?.company} />
        <ReferenceField label="Depto." value={details?.department} />
        <ReferenceField label="Multi Cía." value={details?.multiCompany} />
        <ReferenceField label="Parámetro" value={details?.parameter} />
        <ReferenceField label="Observaciones" value={details?.notes} className="col-span-full" />
      </div>

      <fieldset className="grid gap-2 rounded-md border px-3 pt-1 pb-3 sm:grid-cols-2">
        <legend className="px-1 text-xs font-medium">Acceso</legend>
        <div className="grid content-start gap-2">
          <span className="text-xs text-muted-foreground">{details ? "Restricciones registradas en German" : "Restricciones sin ficha de German"}</span>
          <GermanAccessFlag label="No ver costos" value={details?.hideCosts} />
          <GermanAccessFlag label="No ver saldos" value={details?.hideBalances} />
          <GermanAccessFlag label="Solo ver a sus clientes" value={details?.ownCustomersOnly} />
        </div>
        <div className="grid content-start gap-2">
          <Label className="flex items-center gap-2">
            <Controller control={control} name="active" render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!editing || isSubmitting || user?.legacyActive === false} />
            )} />
            Cuenta web habilitada
          </Label>
          {user?.legacyActive === false && <p className="text-xs text-muted-foreground">Usuario dado de baja en German.</p>}
          <Label className="flex items-center gap-2">
            <Controller control={control} name="administrator" render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!editing || isSubmitting} />
            )} />
            Administrador web
          </Label>
        </div>
      </fieldset>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <ReferenceField label="Imprimir en" value={details?.printer} className="sm:col-span-2" />
        <ReferenceField label="SIP ID para etiquetas" value={details?.labelPrinter} />
        <ReferenceField label="Clasificadores de proveedores con acceso" value={details?.supplierClassifiers}
          className="sm:col-span-3" multiline />
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)]">
        <fieldset className="grid grid-cols-2 gap-2 rounded-md border px-3 pt-1 pb-3">
          <legend className="px-1 text-xs font-medium">Capturas</legend>
          <ReferenceField label="Del" value={details?.captureFrom} />
          <ReferenceField label="Al" value={details?.captureUntil} />
        </fieldset>
        <fieldset className="grid grid-cols-2 gap-2 rounded-md border px-3 pt-1 pb-3">
          <legend className="px-1 text-xs font-medium">Nómina</legend>
          <ReferenceField label="Tienda" value={details?.store} />
          <ReferenceField label="Número de nómina" value={details?.payrollNumber} />
          <ReferenceField label="Puesto" className="col-span-2" value={details?.position} />
        </fieldset>
      </div>
      {failure != null && <AccessError error={failure} />}
      {editing && (
        <div className="flex flex-wrap justify-end gap-2 border-t pt-2">
          {failure != null && mode === "edit" && <Button type="button" variant="outline" disabled={isSubmitting} onClick={onReload}>Recargar ficha</Button>}
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Spinner />}Aceptar</Button>
        </div>
      )}
    </form>
  )
}
