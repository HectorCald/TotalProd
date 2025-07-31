let productos = [];
let productosAcopio = [];
let precios = [];
let clientes = [];
let proveedores = [];
let registrosProduccion = [];
let registrosAlmacen = [];
let nombresUsuariosGlobal = [];
let pagosGlobal = [];

const DB_NAME = 'damabrava_db';
const PRODUCTO_ALM_DB = 'prductos_alm';
const PRODUCTOS_AC_DB = 'productos_acopio';
const PRECIOS_ALM_DB = 'precios_alm';
const CLIENTES_DB = 'clientes';
const PROVEEDOR_DB = 'proveedores';
const REGISTROS_PRODUCCION = 'registros_produccion';
const NOMBRES_PRODUCCION = 'nombres_produccion';
const REGISTROS_ALM_DB = 'registros_almacen';
const PAGOS_DB = 'pagos';


async function obtenerPagos() { 
    try {
        mostrarCarga('.carga-obtener');
        const pagosCache = await obtenerLocal(PAGOS_DB, DB_NAME);

        if (pagosCache.length > 0) {
            pagosGlobal = pagosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        try {

            const response = await fetch('/obtener-pagos');
            const data = await response.json();

            if (data.success) {
                pagosGlobal = data.pagos.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

                if (pagosGlobal.length === 0) {
                    console.log('no hay registros');
                    renderInitialHTML();
                    updateHTMLWithData();
                }

                if (JSON.stringify(pagosCache) !== JSON.stringify(pagosGlobal)) {
                    console.log('Diferencias encontradas, actualizando UI');

                    (async () => {
                        try {
                            const db = await initDB(PAGOS_DB, DB_NAME);
                            const tx = db.transaction(PAGOS_DB, 'readwrite');
                            const store = tx.objectStore(PAGOS_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of pagosGlobal) {
                                await store.put({
                                    id: item.id,
                                    data: item,
                                    timestamp: Date.now()
                                });
                            }

                            console.log('Caché actualizado correctamente');
                        } catch (error) {
                            console.error('Error actualizando el caché:', error);
                        }
                    })();
                }
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error al obtener los pagos:', error);
        return false;
    }
}
async function cargarPagosParciales(pagoId) {
    try {
        const response = await fetch(`/obtener-pagos-parciales/${pagoId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    } 
}
async function obtenerNombresUsuarios() {
    try {
        // Primero intentar obtener del caché local
        const nombresCache = await obtenerLocal(NOMBRES_PRODUCCION, DB_NAME);

        // Si hay nombres en caché, actualizar la UI inmediatamente
        if (nombresCache.length > 0) {
            nombresUsuariosGlobal = nombresCache;
        }

        // Si no hay caché, obtener del servidor
        const response = await fetch('/obtener-nombres-usuarios');
        const data = await response.json();

        if (data.success) {
            // Procesar nombres: tomar solo la primera palabra
            const nombresProcesados = data.nombres.map(usuario => ({
                ...usuario,
                nombre: usuario.nombre.split(' ')[0] || usuario.nombre // Solo el primer nombre
            }));

            nombresUsuariosGlobal = nombresProcesados;

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(nombresCache) !== JSON.stringify(nombresProcesados)) {
                console.log('Diferencias encontradas en nombres, actualizando UI');

                // Actualizar el caché en segundo plano
                (async () => {
                    try {
                        const db = await initDB(NOMBRES_PRODUCCION, DB_NAME);
                        const tx = db.transaction(NOMBRES_PRODUCCION, 'readwrite');
                        const store = tx.objectStore(NOMBRES_PRODUCCION);

                        // Limpiar todos los nombres existentes
                        await store.clear();

                        // Guardar los nuevos nombres
                        for (const nombre of nombresUsuariosGlobal) {
                            await store.put({
                                id: nombre.id,
                                data: nombre,
                                timestamp: Date.now()
                            });
                        }

                        console.log('Caché de nombres actualizado correctamente');
                    } catch (error) {
                        console.error('Error actualizando el caché de nombres:', error);
                    }
                })();
            }

            return true;
        }
        throw new Error('Error al obtener nombres de usuarios');
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}
async function obtenerRegistrosAlmacen() {
    try {
        const registrosCacheAlmacen = await obtenerLocal(REGISTROS_ALM_DB, DB_NAME);

        // Si hay registros en caché, actualizar la UI inmediatamente
        if (registrosCacheAlmacen.length > 0) {
            registrosAlmacen = registrosCacheAlmacen.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        const response = await fetch('/obtener-movimientos-almacen');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar de más reciente a más antiguo
            registrosAlmacen = data.movimientos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Orden descendente por número de ID
            });

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(registrosCacheAlmacen) !== JSON.stringify(registrosAlmacen)) {
                console.log('Diferencias encontradas, actualizando UI');

                (async () => {
                    try {
                        const db = await initDB(REGISTROS_ALM_DB, DB_NAME);
                        const tx = db.transaction(REGISTROS_ALM_DB, 'readwrite');
                        const store = tx.objectStore(REGISTROS_ALM_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const registro of registrosAlmacen) {
                            await store.put({
                                id: registro.id,
                                data: registro,
                                timestamp: Date.now()
                            });
                        }

                        console.log('Caché actualizado correctamente');
                    } catch (error) {
                        console.error('Error actualizando el caché:', error);
                    }

                })();
            }



            return true;
        } else {
            throw new Error(data.error || 'Error al obtener los productos');
        }
    } catch (error) {
        console.error('Error al obtener registros:', error);
        mostrarNotificacion({
            message: 'Error al obtener registros',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}
async function obtenerRegistrosProduccion() {
    try {
        const registrosCache = await obtenerLocal(REGISTROS_PRODUCCION, DB_NAME);

        // Si hay registros en caché, actualizar la UI inmediatamente
        if (registrosCache.length > 0) {
            registrosProduccion = registrosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        const response = await fetch('/obtener-registros-produccion');
        const data = await response.json();

        if (data.success) {
            registrosProduccion = data.registros.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (registrosProduccion.length === 0) {
                console.log('no hay registros');
            }

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(registrosCache) !== JSON.stringify(registrosProduccion)) {
                console.log('Diferencias encontradas, actualizando UI');

                // Siempre actualizar el caché con los nuevos datos
                (async () => {
                    try {
                        const db = await initDB(REGISTROS_PRODUCCION, DB_NAME);
                        const tx = db.transaction(REGISTROS_PRODUCCION, 'readwrite');
                        const store = tx.objectStore(REGISTROS_PRODUCCION);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of registrosProduccion) {
                            await store.put({
                                id: item.id,
                                data: item,
                                timestamp: Date.now()
                            });
                        }

                        console.log('Caché actualizado correctamente');
                    } catch (error) {
                        console.error('Error actualizando el caché:', error);
                    }
                })();
            }
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener registros:', error);
        return false;
    }
}
async function obtenerProveedores() {
    try {

        const proveedoresCache = await obtenerLocal(PROVEEDOR_DB, DB_NAME);

        if (proveedoresCache.length > 0) {
            proveedores = proveedoresCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        try {

            const response = await fetch('/obtener-proovedores');
            const data = await response.json();

            if (data.success) {
                proveedores = data.proovedores.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

                if (JSON.stringify(proveedoresCache) !== JSON.stringify(proveedores)) {
                    console.log('Diferencias encontradas, actualizando UI');

                    (async () => {
                        try {
                            const db = await initDB(PROVEEDOR_DB, DB_NAME);
                            const tx = db.transaction(PROVEEDOR_DB, 'readwrite');
                            const store = tx.objectStore(PROVEEDOR_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of proveedores) {
                                await store.put({
                                    id: item.id,
                                    data: item,
                                    timestamp: Date.now()
                                });
                            }

                            console.log('Caché actualizado correctamente');
                        } catch (error) {
                            console.error('Error actualizando el caché:', error);
                        }
                    })();
                }
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        return false;
    }
}
async function obtenerClientes() {
    try {
        const clientesCache = await obtenerLocal(CLIENTES_DB, DB_NAME);

        if (clientesCache.length > 0) {
            clientes = clientesCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }
        try {

            const response = await fetch('/obtener-clientes');
            const data = await response.json();

            if (data.success) {
                clientes = data.clientes.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

                if (JSON.stringify(clientesCache) !== JSON.stringify(clientes)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    (async () => {
                        try {
                            const db = await initDB(CLIENTES_DB, DB_NAME);
                            const tx = db.transaction(CLIENTES_DB, 'readwrite');
                            const store = tx.objectStore(CLIENTES_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of clientes) {
                                await store.put({
                                    id: item.id,
                                    data: item,
                                    timestamp: Date.now()
                                });
                            }

                            console.log('Caché actualizado correctamente');
                        } catch (error) {
                            console.error('Error actualizando el caché:', error);
                        }
                    })();
                }
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        return false;
    }
}
async function obtenerPrecios() {
    try {

        const preciosAlmCachce = await obtenerLocal(PRECIOS_ALM_DB, DB_NAME);

        if (preciosAlmCachce.length > 0) {
            precios = preciosAlmCachce.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }
        try {
            const response = await fetch('/obtener-precios');
            const data = await response.json();

            if (data.success) {
                precios = data.precios.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });
                if (JSON.stringify(preciosAlmCachce) !== JSON.stringify(precios)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    (async () => {
                        try {
                            const db = await initDB(PRECIOS_ALM_DB, DB_NAME);
                            const tx = db.transaction(PRECIOS_ALM_DB, 'readwrite');
                            const store = tx.objectStore(PRECIOS_ALM_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of precios) {
                                await store.put({
                                    id: item.id,
                                    data: item,
                                    timestamp: Date.now()
                                });
                            }

                            console.log('Caché actualizado correctamente');
                        } catch (error) {
                            console.error('Error actualizando el caché:', error);
                        }
                    })();
                }
                return true;
            } else {
                return false;
            }

        } catch (error) {
            throw error;
        }

    } catch (error) {
        return false;
    } finally {

    }
}
async function obtenerAlmacenAcopio() {
    try {

        const productosAcopioCache = await obtenerLocal(PRODUCTOS_AC_DB, DB_NAME);

        if (productosAcopioCache.length > 0) {
            productosAcopio = productosAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }
        const response = await fetch('/obtener-productos-acopio');
        const data = await response.json();

        if (data.success) {
            productosAcopio = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(productosAcopioCache) !== JSON.stringify(productosAcopio)) {
                console.log('Diferencias encontradas, actualizando UI');
                (async () => {
                    try {
                        const db = await initDB(PRODUCTOS_AC_DB, DB_NAME);
                        const tx = db.transaction(PRODUCTOS_AC_DB, 'readwrite');
                        const store = tx.objectStore(PRODUCTOS_AC_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of productosAcopio) {
                            await store.put({
                                id: item.id,
                                data: item,
                                timestamp: Date.now()
                            });
                        }

                        console.log('Caché actualizado correctamente');
                    } catch (error) {
                        console.error('Error actualizando el caché:', error);
                    }
                })();
            }
            return true;
        } else {
            return false;
        }


    } catch (error) {
        console.error('Error al obtener los pagos:', error);
        return false;
    }
}
async function obtenerAlmacenGeneral() {
    try {
        const productosCache = await obtenerLocal(PRODUCTO_ALM_DB, DB_NAME);

        if (productosCache.length > 0) {
            productos = productosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        try {
            const response = await fetch('/obtener-productos');
            const data = await response.json();
            if (data.success) {
                productos = data.productos.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

                if (productos.length === 0) {
                    console.log('no hay registros');
                }

                if (JSON.stringify(productosCache) !== JSON.stringify(productos)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    try {
                        const db = await initDB(PRODUCTO_ALM_DB, DB_NAME);
                        const tx = db.transaction(PRODUCTO_ALM_DB, 'readwrite');
                        const store = tx.objectStore(PRODUCTO_ALM_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of productos) {
                            await store.put({
                                id: item.id,
                                data: item,
                                timestamp: Date.now()
                            });
                        }

                        console.log('Caché actualizado correctamente');
                    } catch (error) {
                        console.error('Error actualizando el caché:', error);
                    }
                }

                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error al obtener productos:', error);
        return false;
    } finally {
        ocultarCarga('.carga-obtener');
    }
}


function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');

    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Reportes</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio');"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="busqueda">
                <div class="entrada">
                    <i class='bx bx-calendar'></i>
                    <div class="input">
                        <p class="detalle">Período del reporte</p>
                        <input type="text" class="fecha-reporte" readonly>
                    </div>
                </div>
                
                <div class="acciones-grande">
                    <button class="btn-generar-reporte btn origin"><i class='bx bx-file-pdf'></i> <span>Generar Reporte</span></button>
                </div>
            </div>
            
            <div class="modulos-reporte">
                <p class="normal">Seleccionar módulos para incluir en el reporte:</p>
                <div class="checkboxes-modulos">
                    <label class="checkbox-item">
                        <input type="checkbox" class="modulo-checkbox" value="produccion">
                        <span class="checkmark"></span>
                        <i class='bx bxs-factory'></i>
                        <span>Producción</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" class="modulo-checkbox" value="almacen">
                        <span class="checkmark"></span>
                        <i class='bx bx-package'></i>
                        <span>Almacén</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" class="modulo-checkbox" value="acopio">
                        <span class="checkmark"></span>
                        <i class='bx bx-store'></i>
                        <span>Acopio</span>
                    </label>
                </div>
            </div>

            <div class="estado-carga" style="display: none;">
                <div class="carga-info">
                    <i class='bx bx-loader-alt bx-spin'></i>
                    <p>Cargando datos para el reporte...</p>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-generar-reporte btn origin"><i class='bx bx-file-pdf'></i> Generar Reporte</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '70px';
    
    setTimeout(() => {
        configuracionesEntrada();
        configurarReportes();
    }, 100);
}
export async function mostrarReportes(){
    renderInitialHTML();
    mostrarAnuncio();
    
    // Solo cargar datos básicos necesarios para la interfaz
    const [almacen, produccion, almacenAcopio, pagos, precios, proovedores, clientes, nombresUsuarios] = await Promise.all([
        await obtenerPagos(),
        await obtenerRegistrosProduccion(),
        await obtenerRegistrosAlmacen(),
        await obtenerAlmacenAcopio(),
        await obtenerPrecios(),
        await obtenerProveedores(),
        await obtenerClientes(),
        await obtenerNombresUsuarios(),
        await obtenerAlmacenGeneral(),
    ]);
}
function configurarReportes() {
    // Configurar selector de fechas con flatpickr
    const fechaInput = document.querySelector('.fecha-reporte');
    if (fechaInput) {
        flatpickr(fechaInput, {
            mode: "range",
            dateFormat: "d/m/Y",
            locale: "es",
            rangeSeparator: " hasta ",
            placeholder: "Seleccionar período",
            onChange: function(selectedDates) {
                if (selectedDates.length === 2) {
                    fechaInput.classList.add('con-fecha');
                } else {
                    fechaInput.classList.remove('con-fecha');
                }
            }
        });
    }

    // Configurar eventos de los botones de generar reporte
    const btnGenerarReporte = document.querySelectorAll('.btn-generar-reporte');
    btnGenerarReporte.forEach(btn => {
        btn.addEventListener('click', generarReporte);
    });

    // Configurar eventos de los checkboxes
    const checkboxesModulos = document.querySelectorAll('.modulo-checkbox');
    const checkboxesOpciones = document.querySelectorAll('.opcion-checkbox');
    
    checkboxesModulos.forEach(checkbox => {
        checkbox.addEventListener('change', validarSeleccionModulos);
    });
    
    checkboxesOpciones.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            console.log('Opción seleccionada:', this.value, this.checked);
        });
    });
    
    // Validación inicial - deshabilitar botón hasta que se seleccione un módulo
    validarSeleccionModulos();
}
function validarSeleccionModulos() {
    const modulosSeleccionados = document.querySelectorAll('.modulo-checkbox:checked');
    const btnGenerar = document.querySelector('.btn-generar-reporte');
    
    if (modulosSeleccionados.length === 0) {
        btnGenerar.disabled = true;
        btnGenerar.style.opacity = '0.5';
        // Removido el mostrarNotificacion para evitar spam de notificaciones
    } else {
        btnGenerar.disabled = false;
        btnGenerar.style.opacity = '1';
    }
}
async function generarReporte() {
    console.log('=== INICIANDO GENERACIÓN DE REPORTE ===');
    
    const fechaInput = document.querySelector('.fecha-reporte');
    const modulosSeleccionados = Array.from(document.querySelectorAll('.modulo-checkbox:checked')).map(cb => cb.value);
    const opcionesSeleccionadas = Array.from(document.querySelectorAll('.opcion-checkbox:checked')).map(cb => cb.value);
    
    console.log('Fecha input:', fechaInput?.value);
    console.log('Módulos seleccionados:', modulosSeleccionados);
    console.log('Opciones seleccionadas:', opcionesSeleccionadas);
    console.log('Checkboxes encontrados:', document.querySelectorAll('.modulo-checkbox').length);
    console.log('Checkboxes marcados:', document.querySelectorAll('.modulo-checkbox:checked').length);
    
    // Validar que se haya seleccionado un período
    if (!fechaInput.value) {
        console.log('ERROR: No hay fecha seleccionada');
        mostrarNotificacion({
            message: 'Debe seleccionar un período para el reporte',
            type: 'warning',
            duration: 3000
        });
        return;
    }
    
    // Validar que se haya seleccionado al menos un módulo
    if (modulosSeleccionados.length === 0) {
        console.log('ERROR: No hay módulos seleccionados');
        console.log('Todos los checkboxes:', document.querySelectorAll('.modulo-checkbox'));
        console.log('Checkboxes marcados:', document.querySelectorAll('.modulo-checkbox:checked'));
        mostrarNotificacion({
            message: 'Debe seleccionar al menos un módulo',
            type: 'warning',
            duration: 3000
        });
        return;
    }
    
    console.log('Validaciones pasadas, procediendo con generación...');
    
    try {
        mostrarCarga('.carga-procesar');
        
        // Parsear fechas del período seleccionado
        const fechas = fechaInput.value.split(' a ');
        console.log('Fechas separadas:', fechas);
        
        if (fechas.length !== 2) {
            console.error('Formato de fecha inválido:', fechaInput.value);
            mostrarNotificacion({
                message: 'Formato de fecha inválido',
                type: 'error',
                duration: 3000
            });
            return;
        }
        
        const fechaInicio = parsearFecha(fechas[0]);
        const fechaFin = parsearFecha(fechas[1]);
        
        if (!fechaInicio || !fechaFin) {
            console.error('Error parseando fechas');
            mostrarNotificacion({
                message: 'Error al procesar las fechas',
                type: 'error',
                duration: 3000
            });
            return;
        }
        
        console.log('Fechas parseadas:', { fechaInicio, fechaFin });
        
        // SOLO PRODUCCIÓN - simplificado
        if (modulosSeleccionados.includes('produccion')) {
            console.log('Procesando datos de PRODUCCIÓN...');
            const datosProduccion = await procesarDatosProduccion(fechaInicio, fechaFin);
            console.log('Datos de producción procesados:', datosProduccion);
            
            // Generar PDF solo con producción
            await generarPDFReporte({ produccion: datosProduccion }, fechaInput.value);
            
            mostrarNotificacion({
                message: 'Reporte de producción generado correctamente',
                type: 'success',
                duration: 3000
            });
        } else {
            console.log('No se seleccionó producción');
            mostrarNotificacion({
                message: 'Por ahora solo está disponible el reporte de producción',
                type: 'info',
                duration: 3000
            });
        }
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        mostrarNotificacion({
            message: 'Error al generar el reporte: ' + error.message,
            type: 'error',
            duration: 3500
        });
    } finally {
        ocultarCarga('.carga-procesar');
    }
}


function parsearFecha(fechaStr) {
    console.log('Parseando fecha:', fechaStr);
    if (!fechaStr || typeof fechaStr !== 'string') {
        console.error('Fecha inválida:', fechaStr);
        return null;
    }
    
    const [dia, mes, anio] = fechaStr.trim().split('/');
    console.log('Componentes de fecha:', { dia, mes, anio });
    return new Date(anio, mes - 1, dia);
}
function convertirGramosAUnidad(gramos) {
    if (gramos >= 1000) {
        return `${(gramos / 1000).toFixed(2)} kg`;
    } else {
        return `${gramos} g`;
    }
}
async function procesarDatosProduccion(fechaInicio, fechaFin) {
    console.log('=== PROCESANDO DATOS DE PRODUCCIÓN ===');
    console.log('Fecha inicio:', fechaInicio);
    console.log('Fecha fin:', fechaFin);
    console.log('Total registros de producción disponibles:', registrosProduccion.length);
    
    // Filtrar registros de producción por período
    const registrosFiltrados = registrosProduccion.filter(registro => {
        console.log('Procesando registro:', registro.id, 'fecha:', registro.fecha);
        
        // Validar que tenga fecha
        if (!registro.fecha) {
            console.log('Registro sin fecha:', registro.id);
            return false;
        }
        
        try {
            const fechaPart = registro.fecha; // No hay coma, es solo fecha
            console.log('Fecha part:', fechaPart);
            
            if (!fechaPart) {
                console.log('Fecha part vacía para registro:', registro.id);
                return false;
            }
            
            const [dia, mes, anio] = fechaPart.trim().split('/');
            console.log('Componentes fecha registro:', { dia, mes, anio });
            
            if (!dia || !mes || !anio) {
                console.log('Componentes de fecha incompletos para registro:', registro.id);
                return false;
            }
            
            const fechaRegistro = new Date(anio, mes - 1, dia);
            const estaEnRango = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            
            console.log('Fecha registro:', fechaRegistro, 'En rango:', estaEnRango);
            
            return estaEnRango;
        } catch (error) {
            console.error('Error procesando fecha del registro:', registro.id, error);
            return false;
        }
    });
    
    console.log(`Registros de producción en el período: ${registrosFiltrados.length}`);
    console.log('Primeros 3 registros filtrados:', registrosFiltrados.slice(0, 3));
    
    // 1. Agrupar por producto (cantidad producida)
    const produccionPorProducto = {};
    registrosFiltrados.forEach(registro => {
        console.log('Procesando productos del registro:', registro.id);
        console.log('ID Producto:', registro.idProducto);
        console.log('Producto:', registro.producto);
        console.log('Gramos:', registro.gramos);
        console.log('Envases terminados:', registro.envases_terminados);
        console.log('C real:', registro.c_real);
        console.log('Fecha verificación:', registro.fecha_verificacion);
        
        // Validar que tenga idProducto
        if (!registro.idProducto) {
            console.log('Registro sin idProducto:', registro.id);
            return;
        }
        
        try {
            const productoId = registro.idProducto.trim();
            
            // Determinar la cantidad: si hay fecha_verificacion usar c_real, sino envases_terminados
            let cantidad = 0;
            if (registro.fecha_verificacion && registro.fecha_verificacion.trim()) {
                // Si hay fecha de verificación, usar c_real
                cantidad = parseInt(registro.c_real) || 0;
                console.log(`Usando c_real: ${cantidad} (con fecha verificación)`);
            } else {
                // Si no hay fecha de verificación, usar envases_terminados
                cantidad = parseInt(registro.envases_terminados) || 0;
                console.log(`Usando envases_terminados: ${cantidad} (sin fecha verificación)`);
            }
            
            if (productoId && cantidad > 0) {
                if (!produccionPorProducto[productoId]) {
                    produccionPorProducto[productoId] = {
                        nombre: registro.producto || 'Sin nombre',
                        gramos: registro.gramos || '0',
                        cantidadTotal: 0
                    };
                }
                produccionPorProducto[productoId].cantidadTotal += cantidad;
                console.log(`Agregando ${cantidad} unidades de ${productoId} (${registro.producto}) - ${registro.gramos}g`);
            }
        } catch (error) {
            console.error('Error procesando productos del registro:', registro.id, error);
        }
    });
    
    console.log('Producción por producto:', produccionPorProducto);
    
    // 2. Agrupar por materia prima consumida (usando idProducto)
    const materiaPrimaConsumida = {};
    console.log('=== DIAGNÓSTICO MATERIA PRIMA ===');
    console.log('Total productos en almacén general:', productos.length);
    console.log('Total productos en acopio:', productosAcopio.length);
    console.log('Primeros 3 productos almacén:', productos.slice(0, 3));
    console.log('Primeros 3 productos acopio:', productosAcopio.slice(0, 3));
    console.log('=== TODOS LOS PRODUCTOS DE ACOPIO CON GRAMAJES ===');
    productosAcopio.forEach((prod, index) => {
        console.log(`${index + 1}. ID: ${prod.id} - Nombre: ${prod.producto} - Gramos: ${prod.gramos} (tipo: ${typeof prod.gramos})`);
    });
    
    registrosFiltrados.forEach(registro => {
        if (registro.idProducto) {
            try {
                const productoId = registro.idProducto.trim();
                console.log(`\n--- Procesando materia prima para registro ${registro.id} ---`);
                console.log('ID Producto de producción:', productoId);
                console.log('Producto de producción:', registro.producto);
                
                // Determinar la cantidad producida: si hay fecha_verificacion usar c_real, sino envases_terminados
                let cantidadProducida = 0;
                if (registro.fecha_verificacion && registro.fecha_verificacion.trim()) {
                    cantidadProducida = parseInt(registro.c_real) || 0;
                } else {
                    cantidadProducida = parseInt(registro.envases_terminados) || 0;
                }
                
                console.log('Cantidad producida:', cantidadProducida);
                
                if (productoId && cantidadProducida > 0) {
                    // Buscar el producto en almacén general para obtener acopio_id
                    const productoAlmacen = productos.find(p => p.id === productoId);
                    console.log('Producto encontrado en almacén:', productoAlmacen);
                    
                    if (productoAlmacen && productoAlmacen.acopio_id) {
                        console.log('acopio_id encontrado:', productoAlmacen.acopio_id);
                        
                        // Buscar el producto de acopio para obtener gramaje
                        const productoAcopio = productosAcopio.find(pa => pa.id === productoAlmacen.acopio_id);
                        console.log('Producto encontrado en acopio:', productoAcopio);
                        
                        if (productoAcopio) {
                            const nombreMateriaPrima = productoAcopio.producto || 'Sin nombre';
                            // El gramaje viene del registro de producción, NO del producto de acopio
                            const gramajeMateriaPrima = parseInt(registro.gramos) || 0;
                            
                            console.log('=== DETALLE PRODUCTO ACOPIO ===');
                            console.log('Producto acopio completo:', productoAcopio);
                            console.log('Gramaje del registro de producción:', registro.gramos);
                            console.log('Gramaje parseado:', gramajeMateriaPrima);
                            console.log('Nombre materia prima:', nombreMateriaPrima);
                            
                            // Calcular cantidad total en gramos de materia prima consumida
                            const cantidadGramos = cantidadProducida * gramajeMateriaPrima;
                            
                            console.log(`✓ Materia prima: ${nombreMateriaPrima} (${gramajeMateriaPrima}g por unidad) - Cantidad producida: ${cantidadProducida} - Gramos totales consumidos: ${cantidadGramos}g`);
                            
                            // Agrupar por NOMBRE del producto de acopio, no por acopio_id
                            if (!materiaPrimaConsumida[nombreMateriaPrima]) {
                                materiaPrimaConsumida[nombreMateriaPrima] = {
                                    nombre: nombreMateriaPrima,
                                    gramos: gramajeMateriaPrima,
                                    cantidadGramos: 0
                                };
                            }
                            materiaPrimaConsumida[nombreMateriaPrima].cantidadGramos += cantidadGramos;
                        } else {
                            console.log(`❌ No se encontró producto de acopio con ID: ${productoAlmacen.acopio_id}`);
                            console.log('IDs disponibles en acopio:', productosAcopio.map(p => p.id));
                        }
                    } else {
                        console.log(`❌ No se encontró producto en almacén con ID: ${productoId} o no tiene acopio_id`);
                        console.log('IDs disponibles en almacén:', productos.map(p => p.id));
                    }
                } else {
                    console.log('❌ Producto sin ID o cantidad 0');
                }
            } catch (error) {
                console.error('Error procesando materia prima del registro:', registro.id, error);
            }
        }
    });
    
    console.log('Materia prima consumida:', materiaPrimaConsumida);
        
    
    // 4. Agrupar por operario (usando user)
    const produccionPorOperario = {};
    registrosFiltrados.forEach(registro => {
        const operario = registro.user || 'Sin operario';
        
        if (registro.idProducto) {
            try {
                const productoId = registro.idProducto.trim();
                
                // Determinar la cantidad: si hay fecha_verificacion usar c_real, sino envases_terminados
                let cantidad = 0;
                if (registro.fecha_verificacion && registro.fecha_verificacion.trim()) {
                    cantidad = parseInt(registro.c_real) || 0;
                } else {
                    cantidad = parseInt(registro.envases_terminados) || 0;
                }
                
                if (productoId && cantidad > 0) {
                    if (!produccionPorOperario[operario]) {
                        produccionPorOperario[operario] = {
                            total: 0,
                            productos: {}
                        };
                    }
                    
                    produccionPorOperario[operario].total += cantidad;
                    
                    if (!produccionPorOperario[operario].productos[productoId]) {
                        produccionPorOperario[operario].productos[productoId] = {
                            nombre: registro.producto || 'Sin nombre',
                            gramos: registro.gramos || '0',
                            cantidad: 0
                        };
                    }
                    produccionPorOperario[operario].productos[productoId].cantidad += cantidad;
                }
            } catch (error) {
                console.error('Error procesando operario del registro:', registro.id, error);
            }
        }
    });
    
    console.log('Producción por operario:', produccionPorOperario);
    
    const resultado = {
        totalRegistros: registrosFiltrados.length,
        produccionPorProducto,
        materiaPrimaConsumida,
        produccionPorOperario,
        registrosFiltrados
    };
    
    console.log('Resultado final de procesamiento:', resultado);
    return resultado;
}
async function procesarDatosAlmacen(fechaInicio, fechaFin) {
    // Implementar lógica similar para almacén
    const registrosFiltrados = registrosAlmacen.filter(registro => {
        const [fechaPart] = registro.fecha_hora.split(',');
        const [dia, mes, anio] = fechaPart.trim().split('/');
        const fechaRegistro = new Date(anio, mes - 1, dia);
        return fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
    });
    
    return {
        totalRegistros: registrosFiltrados.length,
        registrosFiltrados
    };
}
async function procesarDatosAcopio(fechaInicio, fechaFin) {
    // Implementar lógica similar para acopio
    return {
        totalRegistros: 0,
        registrosFiltrados: []
    };
}
async function generarPDFReporte(reporteData, periodo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración inicial - aprovechar mejor el espacio
    doc.setFontSize(18);
    doc.text('REPORTE DE PRODUCCIÓN', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Período: ${periodo}`, 105, 25, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 32, { align: 'center' });
    
    let yPosition = 40; // Empezar más abajo para aprovechar mejor el espacio
    
    // Sección de Producción
    if (reporteData.produccion) {
        const prod = reporteData.produccion;
        
        doc.setFontSize(14);
        doc.text('PRODUCCIÓN', 10, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.text(`Total de registros: ${prod.totalRegistros}`, 10, yPosition);
        yPosition += 8;
        
        // Producción por producto - TABLA CON ENCABEZADOS
        if (Object.keys(prod.produccionPorProducto).length > 0) {
            doc.setFontSize(12);
            doc.text('Cantidad producida por producto:', 10, yPosition);
            yPosition += 8;
            
            // Ordenar productos alfabéticamente
            const productosOrdenados = Object.entries(prod.produccionPorProducto)
                .sort(([,a], [,b]) => a.nombre.localeCompare(b.nombre));
            
            // Crear tabla automática
            const tableData = productosOrdenados.map(([productoId, datos]) => [
                datos.nombre,
                convertirGramosAUnidad(parseInt(datos.gramos)),
                `${datos.cantidadTotal} unidades`
            ]);
            
            if (doc.autoTable) {
                doc.autoTable({
                    head: [['Producto', 'Gramaje', 'Cantidad']],
                    body: tableData,
                    startY: yPosition,
                    theme: 'grid',
                    headStyles: { 
                        fillColor: [80, 80, 80], 
                        textColor: 255, 
                        fontStyle: 'bold',
                        lineColor: [0, 0, 0], 
                        lineWidth: 0.1, 
                        halign: 'center' 
                    },
                    styles: { 
                        font: 'helvetica', 
                        fontSize: 9, 
                        cellPadding: 2, 
                        lineColor: [0, 0, 0], 
                        lineWidth: 0.2, 
                        textColor: [0, 0, 0] 
                    },
                    margin: { left: 15, right: 15 },
                    columnStyles: {
                        0: { cellWidth: 70 }, // Producto
                        1: { cellWidth: 30 }, // Gramaje
                        2: { cellWidth: 50 }  // Cantidad
                    }
                });
                yPosition = doc.lastAutoTable.finalY + 8;
            } else {
                // Fallback manual
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('Producto', 15, yPosition);
                doc.text('Gramaje', 90, yPosition);
                doc.text('Cantidad', 130, yPosition);
                yPosition += 6;
                
                doc.line(15, yPosition, 190, yPosition);
                yPosition += 6;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                productosOrdenados.forEach(([productoId, datos]) => {
                    if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                    doc.text(datos.nombre, 15, yPosition);
                    doc.text(convertirGramosAUnidad(parseInt(datos.gramos)), 90, yPosition);
                    doc.text(`${datos.cantidadTotal} unidades`, 130, yPosition);
                    yPosition += 6;
                });
                yPosition += 8;
            }
        }
        
        // Materia prima consumida - NUEVA PÁGINA
        if (Object.keys(prod.materiaPrimaConsumida).length > 0) {
                doc.addPage();
                yPosition = 20;
            
            doc.setFontSize(14);
            doc.text('Materia prima consumida:', 10, yPosition);
            yPosition += 8;
            
            // Ordenar materia prima alfabéticamente
            const materiaPrimaOrdenada = Object.entries(prod.materiaPrimaConsumida)
                .sort(([,a], [,b]) => a.nombre.localeCompare(b.nombre));
            
            // Crear tabla automática
            const tableDataMP = materiaPrimaOrdenada.map(([mpNombre, datos]) => [
                datos.nombre,
                convertirGramosAUnidad(datos.cantidadGramos)
            ]);
            
            if (doc.autoTable) {
                doc.autoTable({
                    head: [['Producto', 'Peso usado']],
                    body: tableDataMP,
                    startY: yPosition,
                    theme: 'grid',
                    headStyles: { 
                        fillColor: [80, 80, 80], 
                        textColor: 255, 
                        fontStyle: 'bold',
                        lineColor: [0, 0, 0], 
                        lineWidth: 0.1, 
                        halign: 'center' 
                    },
                    styles: { 
                        font: 'helvetica', 
                        fontSize: 9, 
                        cellPadding: 2, 
                        lineColor: [0, 0, 0], 
                        lineWidth: 0.2, 
                        textColor: [0, 0, 0] 
                    },
                    margin: { left: 15, right: 15 }
                });
                yPosition = doc.lastAutoTable.finalY + 8;
            } else {
                // Fallback manual
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('Producto', 15, yPosition);
                doc.text('Peso usado', 120, yPosition);
                yPosition += 6;
                
                doc.line(15, yPosition, 190, yPosition);
                yPosition += 6;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                materiaPrimaOrdenada.forEach(([mpNombre, datos]) => {
                    if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                    doc.text(datos.nombre, 15, yPosition);
                    doc.text(convertirGramosAUnidad(datos.cantidadGramos), 120, yPosition);
                    yPosition += 6;
            });
            }
        }
        
        // Producción por operario - NUEVA PÁGINA
        if (Object.keys(prod.produccionPorOperario).length > 0) {
                doc.addPage();
                yPosition = 20;
            
            doc.setFontSize(14);
            doc.text('Producción por operario:', 10, yPosition);
            yPosition += 8;
            
            // Ordenar operarios por cantidad total de unidades producidas (de mayor a menor)
            const operariosOrdenados = Object.entries(prod.produccionPorOperario)
                .sort(([,a], [,b]) => b.total - a.total);
            
            // Crear tabla automática
            const tableDataOp = operariosOrdenados.map(([operario, datos]) => {
                // Buscar el nombre completo del usuario
                const usuarioCompleto = nombresUsuariosGlobal.find(u => u.user === operario);
                const nombreMostrar = usuarioCompleto ? 
                    `${usuarioCompleto.nombre} (${operario})` : 
                    operario;
                
                return [
                    nombreMostrar,
                    `${datos.total} unidades`
                ];
            });
            
            if (doc.autoTable) {
                doc.autoTable({
                    head: [['Operario', 'Cantidad total']],
                    body: tableDataOp,
                    startY: yPosition,
                    theme: 'grid',
                    headStyles: { 
                        fillColor: [80, 80, 80], 
                        textColor: 255, 
                        fontStyle: 'bold',
                        lineColor: [0, 0, 0], 
                        lineWidth: 0.1, 
                        halign: 'center' 
                    },
                    styles: { 
                        font: 'helvetica', 
                        fontSize: 9, 
                        cellPadding: 2, 
                        lineColor: [0, 0, 0], 
                        lineWidth: 0.2, 
                        textColor: [0, 0, 0] 
                    },
                    margin: { left: 15, right: 15 }
                });
                yPosition = doc.lastAutoTable.finalY + 8;
            } else {
                // Fallback manual
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('Operario', 15, yPosition);
                doc.text('Cantidad total', 120, yPosition);
                yPosition += 6;
                
                doc.line(15, yPosition, 190, yPosition);
                yPosition += 6;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                operariosOrdenados.forEach(([operario, datos]) => {
                    if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                    
                    // Buscar el nombre completo del usuario
                    const usuarioCompleto = nombresUsuariosGlobal.find(u => u.user === operario);
                    const nombreMostrar = usuarioCompleto ? 
                        `${usuarioCompleto.nombre} (${operario})` : 
                        operario;
                    
                    doc.text(nombreMostrar, 15, yPosition);
                    doc.text(`${datos.total} unidades`, 120, yPosition);
                    yPosition += 6;
                });
            }
            
            // Detalles de productos por operario - TABLAS SEPARADAS POR OPERARIO
            yPosition += 8;
            doc.setFontSize(11);
            doc.text('Detalle de productos por operario:', 10, yPosition);
            yPosition += 8;
            
            // Crear tabla separada para cada operario
            operariosOrdenados.forEach(([operario, datos]) => {
                // Buscar el nombre completo del usuario
                const usuarioCompleto = nombresUsuariosGlobal.find(u => u.user === operario);
                const nombreMostrar = usuarioCompleto ? 
                    `${usuarioCompleto.nombre} (${operario})` : 
                    operario;
                
                // Ordenar productos alfabéticamente
                const productosOrdenados = Object.entries(datos.productos)
                    .sort(([,a], [,b]) => a.nombre.localeCompare(b.nombre));
                
                // Crear tabla automática para este operario
                const tableDataOperario = productosOrdenados.map(([productoId, productoData]) => [
                    productoData.nombre,
                    convertirGramosAUnidad(parseInt(productoData.gramos)),
                    `${productoData.cantidad} unidades`
                ]);
                
                if (doc.autoTable) {
                    // Título del operario
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text(nombreMostrar, 15, yPosition);
                    yPosition += 6;
                    
                    // Tabla de productos del operario
                    doc.autoTable({
                        head: [['Producto', 'Gramaje', 'Cantidad']],
                        body: tableDataOperario,
                        startY: yPosition,
                        theme: 'grid',
                        headStyles: { 
                            fillColor: [80, 80, 80], 
                            textColor: 255, 
                            fontStyle: 'bold',
                            lineColor: [0, 0, 0], 
                            lineWidth: 0.1, 
                            halign: 'center' 
                        },
                        styles: { 
                            font: 'helvetica', 
                            fontSize: 9, 
                            cellPadding: 2, 
                            lineColor: [0, 0, 0], 
                            lineWidth: 0.2, 
                            textColor: [0, 0, 0] 
                        },
                        margin: { left: 15, right: 15 },
                        columnStyles: {
                            0: { cellWidth: 70 }, // Producto
                            1: { cellWidth: 30 }, // Gramaje
                            2: { cellWidth: 50 }  // Cantidad
                        }
                    });
                    yPosition = doc.lastAutoTable.finalY + 12; // Más espacio entre operarios
                } else {
                    // Fallback manual
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text(nombreMostrar, 15, yPosition);
                    yPosition += 8;
                    
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text('Producto', 15, yPosition);
                    doc.text('Gramaje', 90, yPosition);
                    doc.text('Cantidad', 130, yPosition);
                    yPosition += 6;
                    
                    doc.line(15, yPosition, 190, yPosition);
                    yPosition += 6;
                    
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(9);
                    productosOrdenados.forEach(([productoId, productoData]) => {
                        if (yPosition > 280) {
                        doc.addPage();
                        yPosition = 20;
                    }
                        doc.text(productoData.nombre, 15, yPosition);
                        doc.text(convertirGramosAUnidad(parseInt(productoData.gramos)), 90, yPosition);
                        doc.text(`${productoData.cantidad} unidades`, 130, yPosition);
                        yPosition += 6;
                    });
                    yPosition += 8; // Espacio entre operarios
                }
            });
        }
    }
    
    // Guardar el PDF
    const nombreArchivo = `Reporte_Produccion_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
}