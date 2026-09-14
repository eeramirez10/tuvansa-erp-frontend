# Mapa de vistas, controles y endpoints

Este documento es el contrato de trazabilidad entre la interfaz heredada de OMNIS/PROSCAI y el frontend. Cada pantalla implementada debe registrar el texto visible real del control, su evento, la petición HTTP y la clave de caché de TanStack Query.

## Estado inicial

### Verifica fiscal: edición disponible, verificación pendiente

Prefijo: `/api/accounts-receivable/clients/:clientId/actions/fiscal-verification`.

| Vista / control | Evento | Endpoint | Caché / estado |
|---|---|---|---|
| Clientes / Verifica fiscal | Clic | POST `/verify` | 501 explícito; no verifica ni escribe |
| Clientes / Verifica fiscal | Ctrl + clic, Yes | GET `/` | clientKeys.detail(id) + fiscal-verification; sólo lectura |
| Cliente - Datos Fiscal / OK | Guardar | PATCH `/` | expectedVersion + values; invalida clientKeys.all; cambios quedan pendientes |
| Cliente - Datos Fiscal / Cancelar | Cierre | Ninguno | Descarta formulario |
| Cliente - Datos Fiscal / Act. | Deshabilitado | Ninguno | Operación pendiente de captura |

SQL y diferencias se documentan en `docs/modules/accounts-receivable/client-fiscal-verification.md` del backend. El frontend no calcula ni envía CLICFDI4CS.

La conexión al proveedor se pospuso por decisión del usuario. El servicio y la UI están preparados para mostrar el mensaje de POST `/verify`: actualmente 501 por integración pendiente; con un adaptador futuro, rechazo 422, indisponibilidad 503, conflicto 409 o validación del proveedor 200 con `legacySync: pending`. Este último resultado no marca al cliente como verificado en PROSCAI. `verificationAvailable` es booleano y actualmente false.

| Módulo | Vista de OMNIS/PROSCAI | Control visible | Evento | Método y endpoint | Query key | Estado frontend |
| --- | --- | --- | --- | --- | --- | --- |
| General | Selector de módulos | Inicio | Abrir aplicación | Sin petición | Sin caché | Implementado |
| Cuentas por cobrar | Catálogo de clientes | Carga del catálogo | Abrir vista | `GET /accounts-receivable/clients` | `['accounts-receivable', 'clients', ...]` | Implementado |
| Inventarios PT | Catálogo de productos | Carga del catálogo | Abrir vista | `GET /inventories/products` | `['inventories', 'products', ...]` | Implementado |

Los endpoints son relativos a `VITE_API_BASE_URL`, cuyo valor local predeterminado es `http://localhost:3000/api`.

El desglose de la vista, la barra de navegación y cada botón de **Acciones**, **Compras/Prod** y **Consultas** está en [Inventarios PT: catálogo de productos](inventarios-catalogo-productos.md).

El detalle equivalente de Cuentas por cobrar está en [Catálogo de clientes](cuentas-por-cobrar-catalogo-clientes.md).

## Plantilla obligatoria para nuevas pantallas

| Módulo | Vista de OMNIS/PROSCAI | Sección | Control visible | Tipo de control | Evento | Método | Endpoint | Parámetros/body | Query key o mutation | Archivo frontend | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ejemplo | Catálogo | Barra inferior | Buscar | Botón | Clic | `GET` | `/recurso` | `search`, `limit`, `offset` | `['recurso', filtros]` | `src/features/...` | Pendiente |

Si el nombre interno heredado no coincide con el texto visible —por ejemplo, una función llamada “auxiliares” presentada como botón “Movimientos”— se documenta siempre primero el nombre que ve el usuario y después la referencia interna en una nota técnica.
