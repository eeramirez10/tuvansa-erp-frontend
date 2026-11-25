import { zodResolver } from "@hookform/resolvers/zod"
import { useId, useState } from "react"
import { Controller, useForm, type Control } from "react-hook-form"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"
import { directoryState } from "../logic"
import { defaultUserSettings, profileSchema, type DirectoryUserDetail, type SavedDirectoryUser, type UserProfile, type UserSettings } from "../model"
import { saveUser } from "../services/users-service"
import { AccessError, GroupSelect } from "./directory-controls"

type Props = {
  user: DirectoryUserDetail | null
  mode: "view" | "create" | "edit"
  busy: boolean
  onSaved: (user: SavedDirectoryUser) => void
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

type Flag = "hideCosts" | "hideBalances" | "ownCustomersOnly"
type Setting = Exclude<keyof UserSettings, Flag | "classifier">
const classifiers = ["Agente", "Giro o sector", "Sucursal", "Clasificador 4", "Clasificador 5", "Clasificador 6", "Flete", "Origen", "Proyecto"]
  .map((label, index) => ({ label, value: String(index + 1) }))
const classifierChoices = [{ label: "Sin clasificador", value: "none" }, ...classifiers]

function AccessFlag({ label, control, name, enabled }: { label: string; control: Control<UserProfile>; name: Flag; enabled: boolean }) {
  return (
    <Label className="flex items-center gap-2">
      <Controller control={control} name={`settings.${name}`} render={({ field }) => (
        <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!enabled} className="disabled:opacity-100" />
      )} />
      {label}
    </Label>
  )
}

function SettingsField({ label, control, name, enabled, kind = "text", className }: {
  label: string; control: Control<UserProfile>; name: Setting; enabled: boolean
  kind?: "text" | "number" | "date" | "multiline"; className?: string
}) {
  const id = useId()
  return (
    <div className={cn("grid min-w-0 content-start gap-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Controller control={control} name={`settings.${name}`} render={({ field, fieldState }) => {
        const changeValue = (value: string) => field.onChange(value === "" ? null : kind === "number" ? Number(value) : value)
        return <>
          {kind === "multiline" ? (
            <Textarea id={id} value={field.value ?? ""} readOnly={!enabled} rows={2} onChange={event => changeValue(event.target.value)} />
          ) : (
            <Input id={id} type={kind} value={field.value ?? ""} readOnly={!enabled} min={kind === "number" ? 0 : undefined}
              aria-invalid={Boolean(fieldState.error)} onChange={event => changeValue(event.target.value)} />
          )}
          {fieldState.error && <p role="alert" className="text-xs text-destructive">{fieldState.error.message}</p>}
        </>
      }} />
    </div>
  )
}

export function UserEditor({ user, mode, busy, onSaved, onCancel, onPermissions, onActivation, onReload }: Props) {
  const editing = mode !== "view"
  const [failure, setFailure] = useState<unknown>(null)
  const { register, handleSubmit, control, formState: { errors, isSubmitting, dirtyFields } } = useForm<UserProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      identification: user?.identification ?? "", name: user?.name ?? "", group: user?.group ?? 1,
      active: user?.active ?? mode === "create", administrator: user?.administrator ?? false,
      settings: user?.settings ?? defaultUserSettings,
    },
  })
  const submit = handleSubmit(async profile => {
    if (!editing) return
    setFailure(null)
    try {
      const changes = Object.fromEntries(Object.entries(profile.settings).filter(([key]) =>
        dirtyFields.settings?.[key as keyof UserSettings]))
      onSaved(await saveUser({ ...profile, settings: changes }, mode === "edit" ? user ?? undefined : undefined))
    } catch (error) {
      setFailure(error)
    }
  })
  const canEditSettings = editing && !isSubmitting

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
        <SettingsField label="Cía." control={control} name="company" enabled={canEditSettings} kind="number" />
        <SettingsField label="Depto." control={control} name="department" enabled={canEditSettings} kind="number" />
        <SettingsField label="Multi Cía." control={control} name="multiCompany" enabled={canEditSettings} kind="number" />
        <SettingsField label="Parámetro" control={control} name="parameter" enabled={canEditSettings} />
        <SettingsField label="Observaciones" control={control} name="notes" enabled={canEditSettings} className="col-span-full" />
      </div>

      <fieldset className="grid gap-2 rounded-md border px-3 pt-1 pb-3 sm:grid-cols-2">
        <legend className="px-1 text-xs font-medium">Acceso</legend>
        <div className="grid content-start gap-2">
          <AccessFlag label="No ver costos" control={control} name="hideCosts" enabled={canEditSettings} />
          <AccessFlag label="No ver saldos" control={control} name="hideBalances" enabled={canEditSettings} />
          <AccessFlag label="Solo ver a sus clientes" control={control} name="ownCustomersOnly" enabled={canEditSettings} />
          <div className="grid gap-1">
            <Label htmlFor="user-classifier">Clasificador</Label>
            <Controller control={control} name="settings.classifier" render={({ field }) => (
              <Select items={classifierChoices} value={field.value === null ? "none" : String(field.value)}
                disabled={!canEditSettings} onValueChange={value => { if (value !== null) field.onChange(value === "none" ? null : Number(value)) }}>
                <SelectTrigger id="user-classifier"><SelectValue /></SelectTrigger>
                <SelectContent>{classifierChoices.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {errors.settings?.classifier && <p role="alert" className="text-xs text-destructive">{errors.settings.classifier.message}</p>}
          </div>
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
        <SettingsField label="Imprimir en" control={control} name="printer" enabled={canEditSettings} className="sm:col-span-2" />
        <SettingsField label="SIP ID para etiquetas" control={control} name="labelPrinter" enabled={canEditSettings} kind="number" />
        <SettingsField label="Clasificadores de proveedores con acceso" control={control} name="supplierClassifiers" enabled={canEditSettings}
          className="sm:col-span-3" kind="multiline" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)]">
        <fieldset className="grid grid-cols-2 gap-2 rounded-md border px-3 pt-1 pb-3">
          <legend className="px-1 text-xs font-medium">Capturas</legend>
          <SettingsField label="Del" control={control} name="captureFrom" enabled={canEditSettings} kind="date" />
          <SettingsField label="Al" control={control} name="captureUntil" enabled={canEditSettings} kind="date" />
        </fieldset>
        <fieldset className="grid grid-cols-2 gap-2 rounded-md border px-3 pt-1 pb-3">
          <legend className="px-1 text-xs font-medium">Nómina</legend>
          <SettingsField label="Tienda" control={control} name="store" enabled={canEditSettings} />
          <SettingsField label="Número de nómina" control={control} name="payrollNumber" enabled={canEditSettings} />
          <SettingsField label="Puesto" control={control} name="position" enabled={canEditSettings} className="col-span-2" />
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
