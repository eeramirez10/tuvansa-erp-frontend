# Menús de reportes por módulo

**Proscai** y **Reportes de Contabilidad** comparten una fila del encabezado en
todas las pantallas del ERP. Los demás menús de reportes se muestran según el
módulo activo. El encabezado usa Dropdown Menu y Submenu de shadcn/Base UI.

Los reportes financieros actuales pertenecen a **Contabilidad**:

El menú principal se llama **Reportes de Contabilidad**. El mismo formato se aplica
por defecto a los módulos: Reportes Inventarios, Reportes Pedidos, Reportes Facturación,
Reportes Bancos, etc. Los nombres proceden de `erpModuleNames` en
`src/features/workspace/module-routes.ts`. Los submenús conservan sus nombres
propios, como Reportes Financieros, y se definen conforme se agregan.

| Módulo | Submenú | Reporte | Ruta |
| --- | --- | --- | --- |
| Contabilidad | Reportes Financieros | Estado de resultados | /contabilidad/reportes/estado-de-resultados |
| Contabilidad | Reportes Financieros | Ventas por familia | /contabilidad/reportes/ventas-por-familia |
| Contabilidad | Reportes Financieros | Inventario por familia | /contabilidad/reportes/inventario-por-familia |
| Ventas (Pedidos / Facturación) | Comisiones | Reporte Comisiones x Cobranza | /ventas/reportes/comisiones-por-cobranza |

El acceso a Contabilidad aparece una sola vez, incluso dentro de Contabilidad.
El menú contextual aparece si el módulo activo tiene reportes propios. Al
cambiar de módulo se desmonta su menú contextual, incluidos los submenús abiertos.
Los menús se construyen desde el catálogo local, por lo que siguen disponibles
durante la carga o un error de la API del módulo.

El catálogo está en `src/features/reports/model.ts`, indexado por `ErpModuleId`.
Para agregar un reporte se registra en el módulo propietario y dentro de su
grupo. `globalReportModules` indica qué módulos tienen un acceso fijo en la fila
superior y reutiliza el mismo catálogo.
`src/features/workspace/module-routes.ts` determina el módulo por prefijos de
ruta completos; no confunde un prefijo parcial con otro módulo.

Las rutas de Inventario y Ventas por familia se ubican bajo Contabilidad para
mantener el menú, el indicador de módulo y el acceso directo en el mismo contexto.
Los enlaces previos `/inventarios/reportes/inventario-por-familia` y
`/ventas/reportes/ventas-por-familia` redirigen a las rutas actuales, conservando
la query string. La ubicación de sus features y los endpoints de inventarios,
ventas y contabilidad permanecen iguales: este cambio sólo organiza navegación.

| Control | Efecto | HTTP / SQL |
| --- | --- | --- |
| Selector de módulos | Cambia catálogo de reportes según la ruta activa | Sin consulta adicional para construir el menú |
| Reportes de Contabilidad / Reportes Financieros | Abre submenú de Contabilidad desde cualquier módulo | Sin HTTP ni SQL |
| Reporte seleccionado | Abre ruta contable y carga su pantalla existente | Endpoints documentados en cada reporte |

Validación: lint, typecheck y build. Navegador para módulos sin reportes,
los tres enlaces desde Contabilidad, acceso directo, enlaces anteriores,
cambio de módulo con submenú abierto, Escape y disponibilidad ante error de API.
Se verificó también Ventas por familia con API real desde su ruta contable:
agosto 2026, México, conserva el importe **9,493,745.19**. Los errores simulados
afectaron únicamente las APIs de reportes; la navegación entre módulos se probó
con sus consultas de lectura existentes.
Evidencia privada en `captures/ui/new-version/module-report-menus-20261106/`
del backend. Sin cambios de SQL, backend, base de datos ni Firebase.

Validación histórica de la etiqueta principal: lint/typecheck/build aprobados; navegador
confirma `Reportes Contabilidad` tanto visible como accesible, conserva el submenú
Reportes Financieros con los tres reportes y Escape, y no muestra un menú global
en Inicio. Evidencia privada: `captures/ui/new-version/module-report-menu-labels-20261106/`.

## Ventas: comisiones por cobranza (2026-11-06)

Por indicación expresa, Ventas usa la etiqueta **Reportes de Ventas**, compartida
por Pedidos, Facturación y las rutas /ventas. Tiene **Comisiones → Reporte
Comisiones x Cobranza**, separado de Reportes Financieros de Contabilidad.
`reportMenuLabels` permite la etiqueta explícita sin alterar los nombres de módulos.
La ruta anterior /contabilidad/reportes/comisiones-por-cobranza redirige a /ventas
con query/hash. La tarjeta del módulo indica Ventas. Otros reportes y módulos
conservan su propietario y comportamiento.
