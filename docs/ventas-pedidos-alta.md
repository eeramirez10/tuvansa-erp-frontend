# Pedidos: alta de la versión nueva

Ruta `/pedidos/:orderId`. El botón **Nuevo pedido** (hoja) abre el modal **Captura de pedido**. Su primer paso permite elegir Almacén y después habilita el formulario dentro del mismo modal. La captura incluye cliente por código, agente visible, fechas, referencia, departamento e Inicial. Código de producto o IEAN + Enter/Tab carga el ICOD canónico, descripción, unidad y precio; por ejemplo, `tsc480` resuelve `01300938`. Tab recorre **Cantidad**, **Precio** y **Dto**. Tab al salir de **Dto** o el botón **Agregar partida** incorpora el renglón al borrador y devuelve el foco a **Código**. Al seleccionar un renglón inferior se cargan sus datos en la fila de captura. **Actualizar partida** o el mismo recorrido con Tab lo sustituye en su posición. Permite múltiples partidas y quitar renglones antes de guardar.

Columnas: Código, Descripción, Cantidad, UM, Precio, Dto, Importe, Sucursal, Pzas. Listado con scroll X/Y, totales de cantidad, volumen, peso, subtotal, descuento, IVA y Gran Total. Los importes se actualizan en pantalla; el servidor los recalcula.

Enter o clic en **OK** enfoca **Descto 1** y muestra el botón **Continuar**. Pulsa ese botón o recorre los cuatro descuentos globales con Enter para abrir **Comentarios del pedido**. Un descuento vacío equivale a cero. Los porcentajes se aplican en cascada sobre el saldo que deja el descuento anterior y los totales se actualizan en pantalla. En Comentarios se pueden modificar pedido del cliente, Inicial, fechas, T.C., departamento, cajas, sucursal, moneda de cobro, plazo, comisión, entregas parciales, transporte, dirección de entrega, contacto, Obs. y comentarios adicionales. Ambos campos **Pedido cliente** reflejan la misma referencia y la conservan al guardar. **Moneda de cobro** permite PESOS o DOLARES y el T.C. representa pesos por dólar. Al cambiar cualquiera de los dos se recalculan subtotal, descuento, IVA y gran total; el pedido guardado conserva precios e importes en la moneda elegida. Su OK guarda mediante POST `/sales/orders/capture`; los campos ampliados se conservan en el documento local de Neon. El servidor asigna el folio; el mostrado en la captura es orientativo. Se muestra **¿Continuo?**: Sí inicia otro borrador y No navega al registro guardado. El resultado inicial es cotización, como en el ejercicio; **Cotiz** alterna entre Pedido y Cotización mediante POST.

Después de guardar, el botón lateral **Comentarios** vuelve a mostrar T.C. y Moneda de cobro como campos editables. Su OK usa PATCH `/sales/orders/:id/actions/comments`, convierte cada partida desde su precio y moneda nativos, recalcula los importes y guarda otra revisión en Neon. Así, cambiar solamente el T.C. también actualiza un pedido que contiene precios de otra moneda. Cancelar o Escape cierra sin guardar.

Si el código o IEAN capturado no existe, se abre delante de la captura una ventana independiente **Encuentra producto**. Permite buscar por código/IEAN, descripción y código de proveedor; los resultados pertenecen al almacén 01 México. Doble clic u **OK** cargan el producto completo en la fila de captura y enfocan **Cantidad**. Al agregar la partida se valida el precio contra el costo. Alternos, Foto, Matriz de fotos y Familias quedan visibles y deshabilitados hasta capturar su comportamiento.

La captura posterior de `P021066` agregó los comportamientos de mantenimiento: Tab sobre un cliente parcial abre **Encuentra cliente** como una ventana ERP independiente delante de **Captura de pedido**, con búsqueda por Código, Nombre y RFC; un precio inferior al costo muestra el toast global `No se puede vender abajo del costo` en la esquina inferior derecha; Ctrl+A autoriza o desautoriza; Ctrl+P abre `Asignación de Pedido`; y `Cambio de pedido` expone sólo las partidas. En esta última ventana, el foco inicial queda en Código/IEAN; se pueden agregar productos, seleccionar y actualizar renglones, cambiar código, cantidad, precio o descuento, y eliminar partidas. El buscador **Encuentra producto** se abre delante cuando el código no existe. **OK** envía el detalle final completo y Escape ejecuta **Cancelar**. Para validar el costo, `IMONEDA1=1` PESOS compara el precio con `ILISTA5`; `IMONEDA1=2` DOLARES compara con `ILISTA6`. El T.C. de Comentarios convierte importes y totales entre monedas. Asignar requiere autorización, desautorizar requiere desasignar y un pedido autorizado no puede editarse; el servidor vuelve a verificarlo al guardar.

En **Cambio de pedido**, seleccionar un renglón carga su código y campos en la fila superior. Al vaciar el código se limpia la información de esa fila, y el Tab hacia adelante desde **Pzas.** elimina la partida seleccionada del borrador. Si la fila contiene un código válido, ese mismo Tab agrega o actualiza la partida y devuelve el foco a **Código/IEAN** para la siguiente captura. Shift+Tab conserva la navegación hacia atrás. Vaciar una fila nueva no elimina otras partidas. Las búsquedas pendientes se invalidan al cambiar el código. El **OK** final guarda los cambios; **Cancelar** los descarta.

La captura de pedidos está limitada temporalmente al almacén **01 México**. La resolución por IEAN cruza FINV con FALM mediante ISEQ y ALMNUM; `TSC480` corresponde a `01300938` en este almacén. La selección de sucursal según permisos del usuario queda pendiente.

Las notificaciones usan un adaptador global en `shared/notifications`; los módulos no importan directamente la librería Sonner. El contenedor compartido admite estados success, error, warning e info y se muestra sobre las ventanas ERP.

Las ventanas ERP de Ventas comparten el teclado: Enter activa el botón visible **OK** y Escape activa **Cancelar**. Los formularios conservan su submit nativo, los Enter manejados por búsquedas/códigos no se duplican y Enter dentro de un comentario multilínea conserva el salto de línea.

En la ficha, **Autorizar** y **Ctrl+A** cambian el estado con tu sesión web.
Si tu sesión terminó, inicia sesión y vuelve a pulsar **Autorizar** en el pedido.
El permiso **Autorizar** (`MPED5`) se administra en **Usuarios → Grupo →
Permisos**. La API comprueba ese permiso, la revisión, si el cliente puede
operar y el costo vigente de las partidas pendientes al autorizar. Un pedido
asignado o con surtido conserva la autorización. **Comentarios → Autorizó**
muestra el usuario que dio la última autorización.

En **Encuentra producto → Familias**, **Cálculo por código** permite usar
`ICOD='01201603'` junto con los clasificadores elegidos. Usa `1` para
quitar el filtro de código. Al elegir un resultado, vuelve a la captura
en el almacén del pedido.

La ficha central de Pedido conserva la distribución observada en PROSCAI: ocho bandas de ancho desigual en el primer renglón (Pedido, Pedido cliente, Carrito, Status., Surtido, Anticipo, Canal y Sucursal), Cliente y Nombre ocupan el bloque izquierdo del segundo, y Fecha/Desde/Vence/Agt./Plazo/Almacén forman el tercero. La tabla mantiene las proporciones visibles de Producto y Descripción, seguida por cantidades e importes; abajo, Totales ocupa cerca de un tercio del ancho e Importes el espacio restante. Carrito, Anticipo, Canal y la primera Sucursal permanecen visibles pero vacíos porque el contrato HTTP aún no expone esos valores.

El primer OK conserva un borrador local y comienza el recorrido de descuentos; no inserta un encabezado como OMNIS hasta el OK final. Cancelar Comentarios regresa a Captura. Cerrar un borrador pide confirmar descarte. Durante el guardado se deshabilitan controles; los errores conservan el contenido y no se reintenta automáticamente.

Arquitectura: `capture-model.ts` contiene tipos/Zod/cálculo visual; `capture-logic.ts`, claves de consulta; `services/order-capture-service.ts`, Axios; `components/order-capture-dialog.tsx`, React Hook Form y la ventana compartida. La caché incluye código, almacén, tipo y cliente. Al guardar se invalidan pedidos, productos y clientes; al convertir se invalidan pedidos y productos. La selección se carga inmediatamente y las respuestas atrasadas no sustituyen otra selección.

La evidencia de OMNIS vive en el backend: `docs/modules/sales/orders-create-sql-new-version.md`, `docs/modules/sales/orders-create-api.md` y `captures/sql/new-version/sales/orders-create-20260914-171356/ui/`. La tabla botón/API está en [endpoint-map.md](endpoint-map.md).

Alcance validado: tipo P, productos por código o IEAN, precio de lista 1 en PESOS o DOLARES y sin IEPS ni reglas automáticas de FDESCTOS. Se admite descuento manual por partida y cuatro descuentos globales en cascada. La regla de cascada procede de la indicación funcional del usuario y es derivada; no se presenta como SQL observado de OMNIS. La conversión entre monedas también es derivada porque no se capturó el algoritmo interno de OMNIS. Flete, seguros y sucursal por partida permanecen de sólo lectura. No se promete equivalencia de todas las configuraciones del ERP ni del mantenimiento heredado.

Validación en Chrome: lecturas reales con cliente/producto del ejercicio, dos renglones y total 205.49; error real 503 por falta de permisos de escritura manteniendo el borrador. Guardado exitoso/¿Continuo?/Cotiz comprobados con respuestas HTTP simuladas, no SQL nuevo de OMNIS ni un commit real. No se creó otro pedido. Capturas locales excluidas de Git en el backend: `captures/ui/new-version/orders-web/`. Lint, typecheck y build del frontend forman parte de la validación.

## Almacén México en pedidos heredados (2026-09-30)

Algunos encabezados heredados usan 1, mientras el catálogo y las claves de inventario usan 01. Las consultas de captura y de Encuentra producto normalizan 1 a 01, incluidos sus keys de TanStack Query. El editor de detalle envía 01 a la ventana de búsqueda. No se asigna México como sustituto de almacenes desconocidos ni se elimina la validación de otros almacenes.

El backend también normaliza las lecturas, el alta, las ediciones y las diferencias de inventario. No cambia ningún endpoint ni se modifica el flujo de captura.

## Sugerencias y selección de productos (2026-09-30)

Captura de pedido y Cambio de pedido usan el mismo campo de Código / IEAN con una lista de coincidencias por prefijo. Espera 200 ms para evitar una consulta por tecla, invalida las respuestas anteriores y muestra hasta diez sugerencias. Clic, flechas con Enter o Tab sobre una opción resaltada cargan el producto y enfocan Cantidad. No se elige automáticamente la primera coincidencia si el identificador tiene varias posibilidades.

Enter/Tab con código no resuelto o ambiguo abre Encuentra producto; también puede abrirse con el botón de búsqueda del campo o F2. La ventana permite código / IEAN, descripción y código de proveedor. No consulta sin filtro y bloquea la selección de resultados atrasados mientras se actualiza la búsqueda. En **Captura de pedido**, doble clic u **OK** cargan el código, descripción, unidad y precio en la fila editable. Se conserva una cantidad positiva o se propone 1. La partida se agrega al salir de **Dto** con Tab o al pulsar **Agregar partida**. En **Cambio de pedido**, la selección recarga el producto y agrega o sustituye su partida en el borrador. El OK final sigue siendo necesario para guardar. Una selección con error de conexión o validación comercial muestra el error y conserva el borrador.

Las lecturas ya no reutilizan la restricción de alta exclusiva de México: respetan el almacén del pedido y normalizan 1/01. El alta nueva sigue ofreciendo solamente 01. No se fuerza un pedido de otro almacén a México. Código, IEAN y descripción se buscan sin distinguir mayúsculas. La regla de precio bajo costo sigue vigente tanto en el borrador como al guardar en el servidor.

El campo está en components/order-product-code-input.tsx y las sugerencias usan el endpoint existente de coincidencias. Su lista se renderiza sobre las ventanas ERP y conserva las proporciones de los inputs. Las ventanas de búsqueda continúan siendo independientes, movibles y al frente.

Verificación local en Chromium con datos y respuestas HTTP simuladas: sugerencias, teclado, desconocido que abre buscador, búsqueda por descripción/IEAN, doble clic que agrega, Tab y regreso a Código, bloqueo de precio bajo costo, almacén 01 y ausencia de solicitudes de escritura. No se generó un pedido real. Evidencia excluida de Git en el backend: captures/ui/new-version/order-product-suggestions/.
