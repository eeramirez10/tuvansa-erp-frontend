import { UserDirectory } from "./components/user-directory"
import { WebAccessGate } from "./components/web-access-gate"

export function Component() {
  return <WebAccessGate capability="users">{session => <UserDirectory key={session.user.id} />}</WebAccessGate>
}
