import { useLocation } from "react-router"
import { InventoryByFamilyPage } from "@/features/inventories/reports/pages/inventory-by-family-page"
import "@/features/inventories/reports/inventory-by-family.css"
export function Component() {
  const location = useLocation()
  return <InventoryByFamilyPage key={location.key} />
}
