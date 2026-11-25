import { Link } from "react-router"
import { paths } from "@/app/router/paths"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { WebAccessGate } from "./components/web-access-gate"

export function Component() {
  return (
    <WebAccessGate capability="generalData">
      {session => (
        <Card className="w-full max-w-xl">
          <CardHeader><CardTitle>Datos Generales</CardTitle></CardHeader>
          {session.capabilities.users && <CardContent>
            <Button variant="outline" render={<Link to={paths.users} />}>Usuarios</Button>
          </CardContent>}
        </Card>
      )}
    </WebAccessGate>
  )
}
