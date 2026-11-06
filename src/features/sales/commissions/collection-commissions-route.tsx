import { useLocation } from "react-router"
import { CollectionCommissionsPage } from "@/features/sales/commissions/pages/collection-commissions-page"
export function Component() { const location = useLocation(); return <CollectionCommissionsPage key={location.key} /> }
