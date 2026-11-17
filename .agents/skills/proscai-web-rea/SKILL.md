---
name: proscai-web-rea
description: Continuar la réplica web de PROSCAI en el frontend Tuvansa desde una instalación nueva, comparando la vista observada con el contrato backend y el flujo de ventanas existente.
---

# Continuar el frontend de PROSCAI

Lee AGENTS.md, [REA-START-HERE](../../../docs/REA-START-HERE.md), docs/endpoint-map.md y el documento de la pantalla. Para una tarea de observación o documentación, no implementes por iniciativa propia.

Localiza el repositorio backend y su documentación del módulo. No inventes un endpoint ni relaciones de tablas desde el frontend. Si la tarea requiere captura SQL o extender contratos, usa las skills de ese repositorio: proscai-rea, proscai-sql-capture o proscai-feature-migration, abriendo su SKILL.md por ruta si no aparecen en el catálogo.

Sin Studio, la evidencia visual procede del runtime Windows y la evidencia SQL del servidor de datos. No se necesita acceder al código de OMNIS. No reutilices coordenadas, PID ni códigos de prueba de otro servidor. Diferencias de respaldo pueden cambiar los montos sin cambiar el contrato.

Conserva el texto visible, campos, columnas, totales, proporciones, atajos y foco del flujo autorizado. Usa shadcn con Base UI y las ventanas compartidas; una búsqueda independiente se abre delante y no debe desplazarse junto con su ventana padre. No sustituyas el estilo por controles alternativos.

Modelos/validación en la feature, HTTP mediante Axios compartido y caché con TanStack Query; sus keys incluyen todos los filtros relevantes (sucursal, cliente, tipo de documento, periodo y demás que cambien el resultado). Zustand sólo para estado de interfaz. Reutiliza menús por módulo y el adaptador de notificaciones.

Una función visible no prueba escritura habilitada. La API conserva MySQL de lectura y el overlay PostgreSQL de Pedidos. Si necesita una migración o un proveedor aún no integrado, muestra el estado real y no un éxito simulado. Un resultado desconocido no equivale a cero.

Actualizar endpoint-map y documento de la vista. Probar acceso directo/menú, carga/error/vacío, selección inmediata, foco/teclado, paginación/scroll y exportación completa que corresponda a los filtros vigentes. Para Excel, contrastar fórmulas, valores disponibles, redondeo, signos y pendientes contra la API.

Antes de entregar: pnpm lint, pnpm typecheck, pnpm build. Distinguir respuestas simuladas de operaciones reales; no desplegar a Firebase ni publicar main por una solicitud de desarrollo. Mantener .firebase/, .firebaserc, firebase.json, credenciales y capturas privadas fuera de los commits.
