# Filtros de comisiones por cliente y agente

Actualizado 2026-11-11. Misma ruta y menú de Ventas. Se conserva Agente junto
con fechas y sucursal y se agrega la selección de un cliente específico.

| Control | Evento | Endpoint relativo a /api |
| --- | --- | --- |
| Cliente / Seleccionar cliente | Abrir ventana de búsqueda independiente | GET /accounts-receivable/clients?status=all&page=1&pageSize=25 |
| Código o nombre del cliente | Buscar coincidencias y paginar | Mismo GET con q |
| Seleccionar / doble clic | Establecer customerId exacto y mostrar código/nombre | Sin HTTP adicional |
| Limpiar cliente | Todos los clientes, conservando agente y filtros anteriores | Sin HTTP hasta Vista previa |
| Vista previa | Combinar fechas, sucursal, agente y cliente | GET /sales/reports/collection-commissions?...&customerId=... |
| Recalcular liquidación | Conservar criterios del reporte | POST /sales/reports/collection-commissions/preview |
| Descargar Excel | Exportar sólo el resultado filtrado | Sin HTTP adicional |

Componentes Input/Button/Table/Alert y ventana ERP compartidos shadcn/Base UI.
La búsqueda usa clientSearchQueryOptions y el servicio existente del catálogo,
incluyendo inactivos; no limita la selección a los primeros clientes visibles.
25 resultados por página; estados de carga, vacío, error y reintento.
La ventana mantiene foco propio sin mover el reporte, y permite cancelar.

customerId es FCLI.CLISEQ, no texto parcial ni un nombre. Se conserva en form,
criteria, query key, GET, POST preview y descarga. Omitido significa todos.
El agente sigue siendo independiente: se puede consultar uno con todos los
clientes, un cliente con todos los agentes, o la intersección de ambos.
Las notas de crédito de antiguos vendedores siguen en el vendedor efectivo.

Cambiar cliente bloquea el Excel anterior hasta generar de nuevo; Limpiar cliente
también invalida esa exportación y conserva los demás filtros. La búsqueda no
cambia el cliente hasta seleccionar; cancelarla conserva la selección anterior.
La UI explica que totales y liquidación corresponden únicamente a los filtros.
El tabulador de un cliente filtrado no sustituye la cobranza mensual del agente.

Cada hoja Excel indica el agente/cliente consultado. El nombre del archivo añade
sus identificadores. Se conservan dieciséis columnas individuales, tres renglones
del resumen y el bloque azul. No filtra sólo la página de pantalla: exporta la
respuesta completa ya filtrada por la API.

Validación real: búsqueda por código y nombre, selección, filtros combinados,
notas reasignadas, resultado vacío, regeneración y bloqueo de exportación obsoleta,
liquidación con filtros, limpiar/restaurar y tres descargas. Libros contrastados
contra API, alcance en encabezados y fórmulas evaluadas independientemente.
Buscador con error/reintento, paginación y Escape verificados; la ventana del
reporte permanece abierta. Backend 257 pruebas; frontend lint/typecheck/build.
SQL derivado y pruebas en docs/modules/sales/collection-commission-filters.md
del backend. Evidencia privada en captures, `commission-customer-20261111`.
