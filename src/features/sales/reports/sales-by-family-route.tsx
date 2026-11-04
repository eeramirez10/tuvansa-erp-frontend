import { useLocation } from "react-router"
import { SalesByFamilyPage } from "@/features/sales/reports/pages/sales-by-family-page"
import "@/features/sales/reports/sales-by-family.css"
export function Component() { const location = useLocation(); return <SalesByFamilyPage key={location.key} /> }
