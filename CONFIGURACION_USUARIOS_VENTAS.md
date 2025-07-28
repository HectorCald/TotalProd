# Configuración del Sistema de Usuarios Ventas

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# ==================== VARIABLES PARA USUARIOS VENTAS ====================

# ID de la hoja maestra donde se registran todos los usuarios de ventas
# Esta debe ser una Google Spreadsheet con una hoja llamada "Usuarios"
# que contenga las columnas: ID | NOMBRE | TELEFONO | ESTADO | EMAIL | CONTRASEÑA | MEMBRESIA | SPREADSHEET
SPREADSHEET_SUPER_VENTAS=tu_spreadsheet_id_aqui

# ID del folder de Google Drive donde se crearán las spreadsheets de los usuarios ventas
# Cada usuario ventas tendrá su propia spreadsheet en este folder
VENTAS_FOLDER=tu_folder_id_aqui
```

## Configuración de Google Sheets

### 1. Crear la Hoja Maestra de Usuarios Ventas

1. Crea una nueva Google Spreadsheet
2. Crea una hoja llamada "Usuarios"
3. Agrega los siguientes encabezados en la primera fila:
   - A1: ID
   - B1: NOMBRE
   - C1: TELEFONO
   - D1: ESTADO
   - E1: EMAIL
   - F1: CONTRASEÑA
   - G1: MEMBRESIA
   - H1: SPREADSHEET

4. Copia el ID de la spreadsheet (de la URL) y agrégalo a `SPREADSHEET_SUPER_VENTAS`

### 2. Crear el Folder de Ventas

1. En Google Drive, crea una carpeta llamada "Sistema Ventas"
2. Copia el ID de la carpeta (de la URL) y agrégalo a `VENTAS_FOLDER`

## Funcionalidades Implementadas

### Backend (index.js)

1. **Función `crearSpreadsheetVentas(nombreUsuario)`**
   - Crea una nueva spreadsheet en el folder de ventas
   - Genera las hojas: Inventario, Registros, Clientes, Proveedores, Reportes, Gastos, Deudas, FCMTokens
   - Configura encabezados para cada hoja

2. **Función `generarSiguienteIdUsuarioVentas()`**
   - Genera IDs únicos en formato USERV-001, USERV-002, etc.

3. **Endpoint `/registrar-usuario-ventas`**
   - Registra un nuevo usuario ventas
   - Crea su spreadsheet personalizada
   - Guarda el registro en la hoja maestra

4. **Endpoint `/cambiar-estado-usuario-ventas`**
   - Activa/desactiva usuarios ventas

5. **Endpoint `/usuarios-ventas`**
   - Lista todos los usuarios ventas

6. **Login modificado**
   - Ahora verifica tanto usuarios ventas como usuarios de empresas

### Frontend (login.js)

1. **Registro modificado**
   - Cuando se selecciona "Ventas" en el paso 2, usa el endpoint de usuarios ventas
   - Cuando se selecciona "ID Personalizado", usa el endpoint normal

## Flujo de Registro

1. Usuario llena información personal (Paso 1)
2. Usuario selecciona tipo de aplicación:
   - **Ventas**: Se registra como usuario ventas
   - **ID Personalizado**: Se registra como usuario de empresa
3. Usuario configura credenciales (Paso 3)
4. Sistema crea la cuenta según el tipo seleccionado

## Estructura de Spreadsheets de Usuarios Ventas

Cada usuario ventas tendrá su propia spreadsheet con las siguientes hojas:

- **Inventario**: ID | Producto | Cantidad | Precio | Categoría | Fecha
- **Registros**: ID | Fecha | Tipo | Descripción | Cantidad | Usuario
- **Clientes**: ID | Nombre | Teléfono | Email | Dirección | Estado
- **Proveedores**: ID | Nombre | Teléfono | Email | Productos | Estado
- **Reportes**: ID | Fecha | Tipo | Descripción | Total | Usuario
- **Gastos**: ID | Fecha | Descripción | Categoría | Monto | Usuario
- **Deudas**: ID | Cliente | Monto | Fecha_Vencimiento | Estado | Descripción
- **FCMTokens**: ID | Token | Email | Fecha_Registro | Estado

## Permisos Requeridos

Asegúrate de que tu Service Account tenga permisos para:
- Leer y escribir en la hoja maestra de usuarios ventas
- Crear archivos en el folder de ventas
- Crear y modificar spreadsheets

## Notas Importantes

1. Los usuarios ventas se crean con estado "Inactivo" por defecto
2. Cada usuario ventas tiene membresía "Básico" por defecto
3. El sistema usa tu autenticación de Google Drive existente
4. Los IDs se generan automáticamente en secuencia
5. El login verifica primero usuarios ventas, luego usuarios de empresas 