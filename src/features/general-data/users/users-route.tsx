import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { GroupPermissions } from "./components/group-permissions"
import { UserDirectory } from "./components/user-directory"
import { WebAccessGate } from "./components/web-access-gate"

function UsersPage() {
  const [section, setSection] = useState<"users" | "permissions">("users")
  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Catálogo de usuarios</CardTitle>
        <div className="flex gap-1">
          <Button aria-pressed={section === "users"} size="sm" variant={section === "users" ? "secondary" : "ghost"}
            onClick={() => setSection("users")}>Usuarios</Button>
          <Button aria-pressed={section === "permissions"} size="sm" variant={section === "permissions" ? "secondary" : "ghost"}
            onClick={() => setSection("permissions")}>Permisos por grupo</Button>
        </div>
      </CardHeader>
      <CardContent>
        {section === "users" ? <UserDirectory /> : <GroupPermissions />}
      </CardContent>
    </Card>
  )
}

export function Component() {
  return <WebAccessGate capability="users">{session => <UsersPage key={session.user.id} />}</WebAccessGate>
}
