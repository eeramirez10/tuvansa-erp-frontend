# Continuar el frontend desde otro servidor

Actualizado 2026-11-17. Lee AGENTS.md y usa la skill [proscai-web-rea](../.agents/skills/proscai-web-rea/SKILL.md). No depende del historial del chat ni de OMNIS Studio.

## Repositorios y guía principal

Clonar también el backend Tuvansa ERP API. Preferiblemente será una carpeta hermana llamada tuvansa-erp-api; si se elige otra ruta, localizarla sin asumir un usuario Windows fijo.

La guía completa de REA y las cuatro skills de observación/captura/migración están en el backend:

- [REA-START-HERE](../../tuvansa-erp-api/docs/REA-START-HERE.md): versiones, entorno, seguridad del destino y texto para el nuevo agente.
- [REA-MODULE-MAP](../../tuvansa-erp-api/docs/REA-MODULE-MAP.md): cobertura documental y cómo localizar SQL/contratos.
- [REA-SQL-CAPTURE](../../tuvansa-erp-api/docs/REA-SQL-CAPTURE.md): general_log, conexión OMNIS, extracción y restauración.
- [REA-WORK-RECORD](../../tuvansa-erp-api/docs/REA-WORK-RECORD.md): ficha por acción y evidencia.

Si se clonaron en rutas diferentes, abrir los mismos archivos dentro de la raíz backend real. El origen del repositorio es https://github.com/eeramirez10/tuvansa-erp-api; los enlaces de carpeta hermana no exigen una organización fija.

Un git clone recibe únicamente commits publicados en la rama seleccionada. Deben publicarse las skills y los cambios funcionales que se quieran llevar; los cambios locales y capturas no viajan. Comprobar branch, SHA y git status de **ambos** repositorios. No asumir que el main remoto contiene los cambios más recientes de esta sesión.

## Configuración y observación

Instalar las dependencias con la versión pnpm de packageManager y pnpm install --frozen-lockfile. Crear .env local a partir del ejemplo y definir VITE_API_BASE_URL con /api. El operador proporciona secretos sólo donde correspondan; el frontend no debe recibir credenciales MySQL/Neon ni conexiones administrativas.

Usar pnpm dev para desarrollar; verificar puerto real y CORS de la API. Una API que responde /health no garantiza que el origen esté configurado ni autoriza escrituras. Si Pedidos tiene Neon configurado, su lectura inicial puede aplicar migraciones: verificar el destino siguiendo la guía backend antes de abrirlo en el nuevo entorno.

La inspección del ERP ocurre en una sesión Windows interactiva. El runtime funciona sin Studio; se observan pantallas y SQL emitido. Si aparece login, CREDENTIALS_REQUIRED y el usuario introduce credenciales; no se registran ni capturan mientras escribe. PID, coordenadas, rutas, usuario y permisos deben revalidarse en la instalación nueva.

Comparar la vista con docs/endpoint-map.md y su documento de pantalla antes de implementar. Conservar etiquetas, flujo, proporciones y el sistema de ventanas, foco y teclado. Usar componentes shadcn con Base UI y los compartidos del proyecto.

## Estado y límites

Hay documentos para clientes, productos, pedidos, facturación, proveedores, compras, bancos, pólizas y reportes. Eso no certifica que todos los botones estén completos ni disponibles para todos los usuarios de la versión nueva. Los documentos específicos más recientes y los contratos reales son la referencia; el handoff anterior conserva contexto histórico.

Pedidos tiene cambios recientes de tipo XA/P, Duplicar y selección/precio por cliente; comprobar que el commit descargado los incluya. Cancún tiene formato propio de comisiones, pero Monto p/com sigue pendiente de su regla 0/50/100; no suplir ese dato por una suposición. La integración de validación fiscal con un proveedor externo también requiere definición. Consultar sus documentos, sin volver a investigar esas funciones cuando el encargo sea sólo otra pantalla.

Los PDFs/Excel de referencia y captures/ son privados y no se clonan. Conservar evidencia bajo captures/ del backend y publicar sólo resúmenes sin datos sensibles. No agregar archivos Firebase locales del usuario ni .env a Git.

Validar pnpm lint, pnpm typecheck y pnpm build, más los estados relevantes de la interfaz y las descargas. Publicación Firebase y cambios en main requieren un encargo específico.

## Texto inicial

```text
Lee AGENTS.md, docs/REA-START-HERE.md, docs/endpoint-map.md y el documento de la
pantalla. Usa .agents/skills/proscai-web-rea/SKILL.md. Localiza el backend y lee
su guía REA y el contrato correspondiente. El ERP del nuevo servidor es una
versión más reciente sin Studio. Primero compara la interfaz y evidencia;
no inventes endpoints ni SQL. No implementes si sólo te pido observar.
```
