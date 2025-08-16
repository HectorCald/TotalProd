let productosGlobal = [];
let nombresUsuariosGlobal = [];
let tareasGlobal = [];
let listaTareasGlobal = [];
let idsProcesosRegistrados = ''; // Variable global para almacenar IDs de procesos

// Variables para almacenar los registros de procesos
let bruto = [];
let lavado = [];
let deshidratado = [];
let molienda = [];
let acopioProceso = [];

const DB_NAME = 'damabrava_db';
const TAREAS_DB = 'tareas_acopio';
const REGISTROS_TAREAS_PROCESOS_DB = 'registros_tareas_procesos';
const PRODUCTOS_AC_DB = 'productos_acopio';
const NOMBRES_PRODUCCION = 'nombres_produccion';

// Constantes para las bases de datos de procesos
const REGISTROS_BRUTO = 'registros_bruto';
const REGISTROS_LAVADO = 'registros_lavado';
const REGISTROS_DESHIDRATADO = 'registros_deshidratado';
const REGISTROS_MOLIENDA = 'registros_molienda';
const REGISTROS_ACOPIO_PROCESO = 'registros_acopio_proceso';


async function obtenerNombresUsuarios() {
    try {
        // Primero intentar obtener del caché local
        const nombresCache = await obtenerLocal(NOMBRES_PRODUCCION, DB_NAME);

        // Si hay nombres en caché, actualizar la UI inmediatamente
        if (nombresCache.length > 0) {
            nombresUsuariosGlobal = nombresCache;
            console.log('actualizando desde el cache(Nombres)')
        }

        // Si no hay caché, obtener del servidor
        const response = await fetch('/obtener-nombres-usuarios');
        const data = await response.json();

        if (data.success) {
            // Procesar nombres: tomar solo la primera palabra
            const nombresProcesados = data.nombres.map(usuario => ({
                ...usuario,
                nombre: usuario.nombre.split(' ')[0] || usuario.nombre // Solo el primer nombre y apellido
            }));

            nombresUsuariosGlobal = nombresProcesados;

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(nombresCache) !== JSON.stringify(nombresProcesados)) {
                console.log('Diferencias encontradas en nombres, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();

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
async function obtenerAcopioProceso() {
    try {

        const registrosAcopioProcesoCache = await obtenerLocal(REGISTROS_ACOPIO_PROCESO, DB_NAME);

        if (registrosAcopioProcesoCache.length > 0) {
            acopioProceso = registrosAcopioProcesoCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
        }

        const response = await fetch('/obtener-registros-acopio-proceso');
        const data = await response.json();

        if (data.success) {
            acopioProceso = data.acopioProceso.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });;

            if (acopioProceso.length === 0) {
                console.log('no hay registros');
                renderInitialHTML();
                updateHTMLWithData();
            }

            if (JSON.stringify(registrosAcopioProcesoCache) !== JSON.stringify(acopioProceso)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();
                (async () => {
                    try {
                        const db = await initDB(REGISTROS_ACOPIO_PROCESO, DB_NAME);
                        const tx = db.transaction(REGISTROS_ACOPIO_PROCESO, 'readwrite');
                        const store = tx.objectStore(REGISTROS_ACOPIO_PROCESO);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of acopioProceso) {
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
            return acopioProceso;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error al obtener registros de acopio-proceso:', error);
        return false;
    }
}
async function obtenerBruto() {
    try {

        const registrosAcopioCache = await obtenerLocal(REGISTROS_BRUTO, DB_NAME);

        if (registrosAcopioCache.length > 0) {
            bruto = registrosAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        const response = await fetch('/obtener-registros-bruto');
        const data = await response.json();

        if (data.success) {
            bruto = data.bruto.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });


            if (JSON.stringify(registrosAcopioCache) !== JSON.stringify(bruto)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();
                (async () => {
                    try {
                        const db = await initDB(REGISTROS_BRUTO, DB_NAME);
                        const tx = db.transaction(REGISTROS_BRUTO, 'readwrite');
                        const store = tx.objectStore(REGISTROS_BRUTO);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of bruto) {
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
            return bruto;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error al obtener registros de bruto:', error);
        return false;
    }
}
async function obtenerLavado() {
    try {

        const registrosLavadoCache = await obtenerLocal(REGISTROS_LAVADO, DB_NAME);

        if (registrosLavadoCache.length > 0) {
            lavado = registrosLavadoCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        const response = await fetch('/obtener-registros-lavado');
        const data = await response.json();

        if (data.success) {
            lavado = data.lavado.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });;

            if (JSON.stringify(registrosLavadoCache) !== JSON.stringify(lavado)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();
                (async () => {
                    try {
                        const db = await initDB(REGISTROS_LAVADO, DB_NAME);
                        const tx = db.transaction(REGISTROS_LAVADO, 'readwrite');
                        const store = tx.objectStore(REGISTROS_LAVADO);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of lavado) {
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
            return lavado;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error al obtener registros de lavado:', error);
        return false;
    }
}
async function obtenerDeshidratado() {
    try {

        const registrosDeshidratadoCache = await obtenerLocal(REGISTROS_DESHIDRATADO, DB_NAME);

        if (registrosDeshidratadoCache.length > 0) {
            deshidratado = registrosDeshidratadoCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        const response = await fetch('/obtener-registros-deshidratado');
        const data = await response.json();

        if (data.success) {
            deshidratado = data.deshidratado.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });;

            if (JSON.stringify(registrosDeshidratadoCache) !== JSON.stringify(deshidratado)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();
                (async () => {
                    try {
                        const db = await initDB(REGISTROS_DESHIDRATADO, DB_NAME);
                        const tx = db.transaction(REGISTROS_DESHIDRATADO, 'readwrite');
                        const store = tx.objectStore(REGISTROS_DESHIDRATADO);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of deshidratado) {
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
            return deshidratado;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error al obtener registros de deshidratado:', error);
        return false;
    }
}
async function obtenerMolienda() {
    try {

        const registrosMoliendaCache = await obtenerLocal(REGISTROS_MOLIENDA, DB_NAME);

        if (registrosMoliendaCache.length > 0) {
            molienda = registrosMoliendaCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        const response = await fetch('/obtener-registros-molienda');
        const data = await response.json();

        if (data.success) {
            molienda = data.molienda.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });;

            if (JSON.stringify(registrosMoliendaCache) !== JSON.stringify(molienda)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();
                (async () => {
                    try {
                        const db = await initDB(REGISTROS_MOLIENDA, DB_NAME);
                        const tx = db.transaction(REGISTROS_MOLIENDA, 'readwrite');
                        const store = tx.objectStore(REGISTROS_MOLIENDA);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of molienda) {
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
            return molienda;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error al obtener registros de molienda:', error);
        return false;
    }
}


async function obtenerListaTareas() {
    try {

        const tareasCache = await obtenerLocal(TAREAS_DB, DB_NAME);

        if (tareasCache.length > 0) {
            listaTareasGlobal = tareasCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }


        const response = await fetch('/obtener-lista-tareas');
        const data = await response.json();

        if (data.success) {
            listaTareasGlobal = data.tareas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            if (JSON.stringify(listaTareasGlobal) !== JSON.stringify(tareasCache)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(TAREAS_DB, DB_NAME);
                        const tx = db.transaction(TAREAS_DB, 'readwrite');
                        const store = tx.objectStore(TAREAS_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of listaTareasGlobal) {
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
        console.error('Error al obtener lista de tareas:', error);
        return false;
    }
}
async function obtenerProductos() {
    try {
        const productosAcopioCache = await obtenerLocal(PRODUCTOS_AC_DB, DB_NAME);

        if (productosAcopioCache.length > 0) {
            productosGlobal = productosAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }
        const response = await fetch('/obtener-productos-acopio');
        const data = await response.json();

        if (data.success) {
            productosGlobal = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(productosAcopioCache) !== JSON.stringify(productosGlobal)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(PRODUCTOS_AC_DB, DB_NAME);
                        const tx = db.transaction(PRODUCTOS_AC_DB, 'readwrite');
                        const store = tx.objectStore(PRODUCTOS_AC_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of productosGlobal) {
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
async function obtenerTareas() {
    try {
        const registrosTareasCache = await obtenerLocal(REGISTROS_TAREAS_PROCESOS_DB, DB_NAME);

        if (registrosTareasCache.length > 0) {
            tareasGlobal = registrosTareasCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
        }
        mostrarCargaDiscreta('Buscando nueva información...');
        const response = await fetch('/obtener-tareas');
        const data = await response.json();

        if (data.success) {
            // Ordenar de más reciente a más antiguo por ID
            tareasGlobal = data.tareas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (tareasGlobal.length === 0) {
                console.log('no hay registros');
                renderInitialHTML();
                updateHTMLWithData();
            }

            if (JSON.stringify(registrosTareasCache) !== JSON.stringify(tareasGlobal)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();
                setTimeout(() => {
                    ocultarCargaDiscreta();
                }, 1000);

                (async () => {
                    try {
                        const db = await initDB(REGISTROS_TAREAS_PROCESOS_DB, DB_NAME);
                        const tx = db.transaction(REGISTROS_TAREAS_PROCESOS_DB, 'readwrite');
                        const store = tx.objectStore(REGISTROS_TAREAS_PROCESOS_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of tareasGlobal) {
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
            } else {
                setTimeout(() => {
                    ocultarCargaDiscreta();
                }, 1000);
            }

            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        return false;
    }
}


export async function procesarProducto() {
    renderInitialHTML();
    mostrarAnuncio();

    const [lista, productos, tareas, nombres] = await Promise.all([
        obtenerNombresUsuarios(),
        obtenerListaTareas(),
        obtenerProductos(),
        await obtenerTareas(),
    ]);
}
function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Procesar Producto</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="busqueda">
                <div class="entrada">
                    <i class='bx bx-search'></i>
                    <div class="input">
                        <p class="detalle">Buscar</p>
                        <input type="text" class="search" placeholder="">
                    </div>
                    <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
                </div>

                <div class="acciones-grande">
                    <button class="exportar-excel btn origin"><i class='bx bx-download'></i><span>Descargar</span></button>
                    <button class="nuevo-registro btn especial"><i class='bx bx-file'></i><span>Iniciar</span></button>
                    <button class="btn-lista-tareas btn especial"><i class='bx bx-task'></i><span>Lista</span></button>
                </div>
            </div>
            
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Finalizados</button>
            </div>
            <div class="productos-container">
                ${Array(10).fill().map(() => `
                    <div class="skeleton-producto">
                        <div class="skeleton-header">
                            <div class="skeleton skeleton-img"></div>
                            <div class="skeleton-content">
                                <div class="skeleton skeleton-line"></div>
                                <div class="skeleton skeleton-line"></div>
                                <div class="skeleton skeleton-line"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="no-encontrado" style="display: none; text-align: center; color: #555; font-size: 1.1rem;padding:20px">
                <i class='bx bx-file-blank' style="font-size: 50px;opacity:0.5"></i>
                <p style="text-align: center; color: #555;">¡Ups!, No se encontraron registros segun tu busqueda o filtrado.</p>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="exportar-excel btn origin"><i class='bx bx-download'></i>Descargar</button>
            <button class="nuevo-registro btn especial"><i class='bx bx-file'></i>Nueva</button>
            <button class="btn-lista-tareas btn especial"><i class='bx bx-task'></i>Lista</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '70px';
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
function updateHTMLWithData() {
    function calcularTiempoProceso(horaInicio, horaFin) {
        function convertirHoraAMinutos(hora) {
            let [h, m] = hora.split(":").map(Number);
            return h * 60 + m;
        }

        const inicioMin = convertirHoraAMinutos(horaInicio);
        const finMin = convertirHoraAMinutos(horaFin);
        const diff = finMin - inicioMin;

        // Convertir a formato legible
        const horas = Math.floor(diff / 60);
        const minutos = diff % 60;

        if (horas === 0) {
            return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
        } else if (minutos === 0) {
            return `${horas} hora${horas !== 1 ? 's' : ''}`;
        } else {
            return `${horas} hora${horas !== 1 ? 's' : ''} ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
        }
    }

    // Update productos
    const productosContainer = document.querySelector('.productos-container');
    const productosHTML = tareasGlobal.map(registro => `
        <div class="registro-item" data-id="${registro.id}">
            <div class="header">
                <i class='bx bx-task'></i>
                <div class="info-header">
                    <span class="id-flotante"><span class="id">${registro.id}</span><span class="flotante-item ${registro.hora_fin ? 'green' : 'red'}">${registro.hora_fin ? calcularTiempoProceso(registro.hora_inicio, registro.hora_fin) : 'Pendiente'}</span></span>
                    <span class="detalle">${registro.producto}</span>
                    <span class="pie">${registro.operador}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosTareas();
}


function eventosTareas() {
    const btnExcel = document.querySelectorAll('.exportar-excel');
    const btnNuevaTarea = document.querySelectorAll('.nuevo-registro');
    const btnListaTareas = document.querySelectorAll('.btn-lista-tareas');
    const registrosAExportar = tareasGlobal;

    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');


    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');

    const contenedor = document.querySelector('.anuncio .relleno');
    contenedor.addEventListener('scroll', () => {
        const yaExiste = contenedor.querySelector('.scroll-top');

        if (contenedor.scrollTop > 100) {
            if (!yaExiste) {
                const boton = document.createElement('button');
                boton.className = 'scroll-top';
                boton.innerHTML = '<i class="fas fa-arrow-up"></i>';
                boton.onclick = () => scrollToTop('.anuncio .relleno');
                contenedor.appendChild(boton);
            }
        } else {
            // Si vuelve arriba, ocultamos el botón si existe
            if (yaExiste) {
                yaExiste.remove();
            }
        }
    });

    let filtroFechaInstance = null;
    let filtroEstadoActual = 'Todos';

    function aplicarFiltros() {
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const items = document.querySelectorAll('.registro-item');
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = tareasGlobal.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Lógica de filtrado existente
            if (filtroEstadoActual && filtroEstadoActual !== 'Todos') {
                if (filtroEstadoActual === 'Pendientes') {
                    mostrar = registroData.hora_fin === null || registroData.hora_fin === '';
                } else if (filtroEstadoActual === 'Finalizados') {
                    mostrar = registroData.hora_fin !== '';
                }
            }

            if (mostrar && fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = registroData.fecha.split('/');
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];

                fechaRegistro.setHours(0, 0, 0, 0);
                fechaInicio.setHours(0, 0, 0, 0);
                fechaFin.setHours(23, 59, 59, 999);

                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }

            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.producto,
                    registroData.fecha,
                ].filter(Boolean).join(' ').toLowerCase();

                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        const registrosVisibles = registrosFiltrados.filter(r => r.mostrar).length;

        // Animación de ocultamiento
        items.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        // Esperar a que termine la animación de ocultamiento
        setTimeout(() => {
            items.forEach(registro => {
                registro.style.display = 'none';
            });

            // Mostrar los filtrados con animación escalonada
            registrosFiltrados.forEach(({ elemento, mostrar }, index) => {
                if (mostrar) {
                    elemento.style.display = 'flex';
                    elemento.style.opacity = '0';
                    elemento.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        elemento.style.opacity = '1';
                        elemento.style.transform = 'translateY(0)';
                    }, 20); // Efecto cascada suave
                }
            });

            // Actualizar mensaje de no encontrado
            if (mensajeNoEncontrado) {
                mensajeNoEncontrado.style.display = registrosVisibles === 0 ? 'block' : 'none';
            }
        }, 100);
    }
    botonesEstado.forEach(boton => {
        if (boton.classList.contains('activado')) {
            filtroEstadoActual = boton.textContent.trim();
            aplicarFiltros();
        }
        boton.addEventListener('click', () => {
            botonesEstado.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroEstadoActual = boton.textContent.trim();
            scrollToCenter(boton, boton.parentElement);
            aplicarFiltros();
        });
    });
    botonCalendario.addEventListener('click', async () => {
        if (!filtroFechaInstance) {
            filtroFechaInstance = flatpickr(botonCalendario, {
                mode: "range",
                dateFormat: "d/m/Y",
                locale: "es",
                rangeSeparator: " hasta ",
                onChange: function (selectedDates) {
                    if (selectedDates.length === 2) {
                        aplicarFiltros();
                        botonCalendario.classList.add('con-fecha');
                    } else if (selectedDates.length <= 1) {
                        botonCalendario.classList.remove('con-fecha');
                    }
                },
                onClose: function (selectedDates) {
                    if (selectedDates.length <= 1) {
                        aplicarFiltros();
                        botonCalendario.classList.remove('con-fecha');
                    }
                }
            });
        }
        filtroFechaInstance.open();
    });
    inputBusqueda.addEventListener('input', () => {
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });


    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });
    window.info = async function (registroId) {
        const registro = tareasGlobal.find(r => r.id === registroId);
        if (!registro) return;
        // Función para calcular tiempo del proceso
        function calcularTiempoProceso(horaInicio, horaFin) {
            function convertirHoraAMinutos(hora) {
                let [h, m] = hora.split(":").map(Number);
                return h * 60 + m;
            }

            const inicioMin = convertirHoraAMinutos(horaInicio);
            const finMin = convertirHoraAMinutos(horaFin);
            const diff = finMin - inicioMin;

            // Convertir a formato legible
            const horas = Math.floor(diff / 60);
            const minutos = diff % 60;

            if (horas === 0) {
                return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
            } else if (minutos === 0) {
                return `${horas} hora${horas !== 1 ? 's' : ''}`;
            } else {
                return `${horas} hora${horas !== 1 ? 's' : ''} ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
            }
        }
        function calcularTiempoEntreProcesos(tiemposProcesados, index) {
            if (index === 0) {
                // Para el primer proceso, calcular desde hora_inicio
                return calcularTiempoProceso(registro.hora_inicio, tiemposProcesados[index]);
            } else {
                // Para procesos subsiguientes, calcular desde el proceso anterior
                return calcularTiempoProceso(tiemposProcesados[index - 1], tiemposProcesados[index]);
            }
        }
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Detalles de la Tarea</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="relleno">
                <p class="normal">Información General</p>
                <div class="campo-vertical">
                    <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> ID: </span>${registro.id}</span>
                    <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</span>
                    <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Producto: </span>${registro.producto}</span>
                </div>

                <p class="normal">Horario</p>
                <div class="campo-horizontal">
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora Inicio: </span>${registro.hora_inicio}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora Fin: </span>${registro.hora_fin || 'Pendiente'}</span>
                        ${registro.hora_fin ? `
                            <span class="detalle"><span class="concepto"><i class='bx bx-timer'></i> Tiempo Total: </span>
                                ${calcularTiempoProceso(registro.hora_inicio, registro.hora_fin)}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <p class="normal">Procedimientos</p>
                                                                                    ${registro.procedimientos ? registro.procedimientos.split(';').map((proc, index) => {
            const procData = proc.trim();
            if (!procData) return '';

            // Obtener el tiempo y peso correspondiente a este proceso
            const tiempos = registro.tiempo_procesado ? registro.tiempo_procesado.split(';') : [];
            const pesos = registro.peso_procesado ? registro.peso_procesado.split(';') : [];
            const horasFinales = registro.tiempo_procesado ? registro.tiempo_procesado.split(';') : [];

            // Calcular el tiempo real del proceso
            let tiempoProceso = 'No calculado';
            if (horasFinales[index] && horasFinales.length > 0) {
                tiempoProceso = calcularTiempoEntreProcesos(horasFinales, index);
            } else if (tiempos[index]) {
                // Si ya tenemos el tiempo calculado, usarlo
                tiempoProceso = tiempos[index];
            }

            const pesoProceso = pesos[index] || 'No registrado';

            return `
                <div class="campo-vertical">
                    <span class="detalle">
                        <span class="concepto"><i class='bx bx-cog'></i> Proceso: </span>${procData}
                    </span>
                    <span class="detalle">
                        <span class="concepto"><i class='bx bx-time'></i> Tiempo: </span>${tiempoProceso}
                    </span>
                    <span class="detalle">
                        <span class="concepto"><i class='bx bx-list-check''></i> Peso Final: </span>${pesoProceso} kg
                    </span>
                </div>
                                                    `;
        }).join('') : '<div class="campo-vertical"><span class="detalle">Sin procedimientos registrados</span></div>'}
                <p class="normal">Registros de procesos</p>
                <button class="btn-ver-tablas btn-info ">Ver tablas de procesos</button>
                <p class="normal">Personal y Observaciones</p>
                <div class="campo-vertical">
                    <span class="detalle"><span class="concepto"><i class='bx bx-user'></i> Operador: </span>${registro.operador}</span>
                    <span class="detalle"><span class="concepto"><i class='bx bx-comment-detail'></i> Observaciones: </span>${registro.observaciones || 'Sin observaciones'}</span>
                </div>
            </div>
            <div class="anuncio-botones">
                ${!registro.hora_fin ? `
                <button class="btn-ver-procesos btn orange">
                    <i class='bx bx-plus'></i> Procesos
                </button>
                    <button class="btn-finalizar btn green">
                        <i class='bx bx-check-circle'></i> Finalizar
                    </button>
                ` : ''}
                ${!registro.hora_fin || !registro.tiempo_procesado ? `
                <button class="btn-eliminar btn red">
                    <i class="bx bx-trash"></i> Eliminar
                </button>
                ` : ''}
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        if (!registro.hora_fin) {
            contenido.style.paddingBottom = '70px';
        }
        mostrarAnuncioSecond();

        const btnFinalizar = contenido.querySelector('.btn-finalizar');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => finalizarTarea(registro));
        }
        const btnEliminar = contenido.querySelector('.btn-eliminar');
        if (btnEliminar) {
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }

        const btnVerProcesos = contenido.querySelector('.btn-ver-procesos');
        if (btnVerProcesos) {
            btnVerProcesos.addEventListener('click', () => agregarProceso(registro));
        }

        const btnVerTablas = contenido.querySelector('.btn-ver-tablas');
        if (btnVerTablas) {
            btnVerTablas.addEventListener('click', () => verTablasProcesos(registro));
        }



        function eliminar(registro) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Eliminar Tarea</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="relleno">
                    <p class="normal">Información General</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> ID: </span>${registro.id}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Producto: </span>${registro.producto}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora Inicio: </span>${registro.hora_inicio}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-user'></i> Operador: </span>${registro.operador}</span>
                    </div>
        
                    <p class="normal">Motivo de la eliminación</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo" type="text" required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Vas a eliminar un registro del sistema. Esta acción no se puede deshacer y podría afectar a otros registros relacionados. Asegúrate de que deseas continuar.</p>
                        </div>
                    </div>

                </div>
                <div class="anuncio-botones">
                    <button class="btn-eliminar-registro btn red">
                        <i class="bx bx-trash"></i> Confirmar eliminación
                    </button>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            // Agregar evento al botón eliminar
            const btnEliminar = contenido.querySelector('.btn-eliminar-registro');
            btnEliminar.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo').value.trim();
                if (!motivo) {
                    mostrarNotificacion({
                        message: 'Debe ingresar el motivo de la eliminación',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                try {
                    mostrarCarga('.carga-procesar');

                    const response = await fetch(`/eliminar-tarea/${registro.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerTareas();
                        updateHTMLWithData();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Tarea eliminada correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    }

                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar la tarea',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }
        function finalizarTarea(registro) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                     <h1 class="titulo">Finalizar Tarea</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="relleno">
                    <p class="normal">Información General</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> ID: </span>${registro.id}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Producto: </span>${registro.producto}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora Inicio: </span>${registro.hora_inicio}</span>
                    </div>
        
                     <p class="normal">Formularios de Procesos</p>
                     <div class="formularios-procesos" style="display: flex; flex-direction: column; gap: 5px;">
                         <button class="btn-formulario btn-info" data-proceso="bruto">
                             <i class='bx bx-file'></i> Formulario de Bruto
                    </button>
                         <button class="btn-formulario btn-info" data-proceso="lavado">
                             <i class='bx bx-droplet'></i> Formulario de Lavado
                         </button>
                         <button class="btn-formulario btn-info" data-proceso="deshidratado">
                             <i class='bx bx-sun'></i> Formulario de Deshidratado
                         </button>
                        <button class="btn-formulario btn-info" data-proceso="molienda">
                             <i class='bx bx-cog'></i> Formulario de Molienda
                         </button>
                         <button class="btn-formulario btn-info" data-proceso="productos">
                             <i class='bx bx-package'></i> Formulario de Productos
                    </button>
                </div>
                     
                     ${idsProcesosRegistrados ? `
                     <p class="normal">Procesos Registrados</p>
                    <div class="campo-vertical">
                         <span class="detalle"><span class="concepto"><i class='bx bx-list-check'></i> IDs: </span>${idsProcesosRegistrados}</span>
                    </div>
                     ` : ''}
        
                    <p class="normal">Observaciones</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input type="text" class="observaciones">
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por finalizar una tarea. Asegúrate de llenar los campos necesarios y con la información correcta, ya que esta accion no se puede deshacer.</p>
                        </div>
                    </div>

                </div>
                <div class="anuncio-botones">
                    <button class="btn-finalizar-tarea btn green">
                        <i class='bx bx-check-circle'></i> Finalizar Tarea
                    </button>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            const btnFinalizar = document.querySelector('.btn-finalizar-tarea');

            // Agregar eventos a los botones de formularios
            const botonesFormularios = contenido.querySelectorAll('.btn-formulario');
            botonesFormularios.forEach(boton => {
                boton.addEventListener('click', () => {
                    const proceso = boton.dataset.proceso;
                    mostrarFormularioProceso(registro, proceso, registro.producto);
                    setTimeout(() => {
                        configuracionesEntrada();
                    }, 100);
                });
            });

            btnFinalizar.addEventListener('click', async () => {

                if (registro.procedimientos.length === 0 || registro.procedimientos === '') {
                    mostrarNotificacion({
                        message: 'No hay procedimientos registrados',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }
                try {
                    const observaciones = contenido.querySelector('.observaciones').value;
                    const ahora = new Date();
                    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

                    console.log('Enviando IDs de procesos:', idsProcesosRegistrados);

                    mostrarCarga('.carga-procesar');

                    const response = await fetch(`/finalizar-tarea/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            observaciones: observaciones || '',
                            hora_fin: horaActual,
                            ids_procesos: idsProcesosRegistrados || ''
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        // Limpiar la variable global de IDs de procesos al finalizar la tarea
                        idsProcesosRegistrados = '';

                        mostrarNotificacion({
                            message: 'Tarea finalizada correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        mostrarCarga('.carga-procesar');
                        // Obtener el último peso de los procesos
                        const pesosProcesos = registro.peso_procesado ? registro.peso_procesado.split(';').filter(p => p.trim()) : [];
                        const ultimoPeso = pesosProcesos.length > 0 ? pesosProcesos[pesosProcesos.length - 1] : registro.peso_inicial;

                        await mostrarIngresosAcopio(registro.id_producto, '', ultimoPeso, 'Materia Prima');
                    }

                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al finalizar la tarea',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }
        function agregarProceso(registro) {
            // Función para calcular tiempo del proceso
            function calcularTiempoProceso(horaInicio, horaFin) {
                function convertirHoraAMinutos(hora) {
                    let [h, m] = hora.split(":").map(Number);
                    return h * 60 + m;
                }

                const inicioMin = convertirHoraAMinutos(horaInicio);
                const finMin = convertirHoraAMinutos(horaFin);
                const diff = finMin - inicioMin;

                // Convertir a formato legible
                const horas = Math.floor(diff / 60);
                const minutos = diff % 60;

                if (horas === 0) {
                    return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
                } else if (minutos === 0) {
                    return `${horas} hora${horas !== 1 ? 's' : ''}`;
                } else {
                    return `${horas} hora${horas !== 1 ? 's' : ''} ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
                }
            }

            // Función para calcular tiempo entre procesos consecutivos
            function calcularTiempoEntreProcesos(tiemposProcesados, index) {
                if (index === 0) {
                    // Para el primer proceso, calcular desde hora_inicio
                    return calcularTiempoProceso(registro.hora_inicio, tiemposProcesados[index]);
                } else {
                    // Para procesos subsiguientes, calcular desde el proceso anterior
                    return calcularTiempoProceso(tiemposProcesados[index - 1], tiemposProcesados[index]);
                }
            }
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Agregar Proceso</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="relleno">
                    <p class="normal">Información General</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> ID: </span>${registro.id}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Producto: </span>${registro.producto}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora Inicio: </span>${registro.hora_inicio}</span>
                    </div>
                    <p class="normal">Procedimientos</p>
                                                                                   ${registro.procedimientos ? registro.procedimientos.split(';').map((proc, index) => {
                const procData = proc.trim();
                if (!procData) return '';

                // Obtener el tiempo y peso correspondiente a este proceso
                const tiempos = registro.tiempo_procesado ? registro.tiempo_procesado.split(';') : [];
                const pesos = registro.peso_procesado ? registro.peso_procesado.split(';') : [];
                const horasFinales = registro.tiempo_procesado ? registro.tiempo_procesado.split(';') : [];

                // Calcular el tiempo real del proceso
                let tiempoProceso = 'No calculado';
                if (horasFinales[index] && horasFinales.length > 0) {
                    tiempoProceso = calcularTiempoEntreProcesos(horasFinales, index);
                } else if (tiempos[index]) {
                    // Si ya tenemos el tiempo calculado, usarlo
                    tiempoProceso = tiempos[index];
                }

                const pesoProceso = pesos[index] || 'No registrado';

                return `
                             <div class="campo-vertical">
                                 <span class="detalle">
                                     <span class="concepto"><i class='bx bx-cog'></i> Proceso: </span>${procData}
                                 </span>
                                 <span class="detalle">
                                     <span class="concepto"><i class='bx bx-time'></i> Tiempo: </span>${tiempoProceso}
                                 </span>
                                 <span class="detalle">
                                     <span class="concepto"><i class='bx bx-list-check''></i> Peso Final: </span>${pesoProceso} kg
                                 </span>
                             </div>
                                                  `;
            }).join('') : '<div class="campo-vertical"><span class="detalle">Sin procedimientos registrados</span></div>'}
                    <p class="normal">Proceso</p>
                    <div class="entrada">
                        <i class='bx bx-task'></i>
                        <div class="input">
                            <p class="detalle">Tareas</p>
                            <input class="tarea" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                        <div class="sugerencias" id="tareas-list"></div>
                    </div>
                    
                    <p class="normal">Peso Final del Proceso</p>
                    <div class="entrada">
                        <i class='bx bx-list-check''></i>
                        <div class="input">
                            <p class="detalle">Peso</p>
                            <input type="number" class="peso-final-proceso">
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por finalizar una tarea. Asegúrate de llenar los campos necesarios y con la información correcta, ya que esta accion no se puede deshacer.</p>
                        </div>
                    </div>

                </div>
                <div class="anuncio-botones">
                    <button class="btn-agregar-proceso btn blue">
                        <i class='bx bx-plus'></i> Agregar proceso
                    </button>
                    <button class="btn-guardar-cambios btn green">
                        <i class='bx bx-save'></i> Guardar Cambios
                    </button>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            const productoInput = document.querySelector('.entrada .tarea');
            const sugerenciasList = document.querySelector('#tareas-list');
            const btnAgregarProceso = document.querySelector('.btn-agregar-proceso');

            productoInput.addEventListener('input', (e) => {
                const valor = normalizarTexto(e.target.value);

                sugerenciasList.innerHTML = '';

                if (valor) {
                    const sugerencias = listaTareasGlobal.filter(p =>
                        normalizarTexto(p.tarea).includes(valor)
                    );

                    if (sugerencias.length) {
                        sugerenciasList.style.display = 'flex';
                        sugerencias.forEach(p => {
                            const div = document.createElement('div');
                            div.classList.add('item');
                            div.textContent = p.tarea;
                            div.onclick = () => {
                                productoInput.value = p.tarea;
                                sugerenciasList.style.display = 'none';
                                window.idPro = p.id;
                            };
                            sugerenciasList.appendChild(div);
                        });
                    }
                } else {
                    sugerenciasList.style.display = 'none';
                }
            });
            btnAgregarProceso.addEventListener('click', async () => {
                try {
                    const pesoFinal = document.querySelector('.peso-final-proceso').value;
                    const proceso = productoInput.value.trim();
                    const ahora = new Date();
                    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
                    console.log('pesoFinal', pesoFinal);

                    if (!proceso) {
                        mostrarNotificacion({
                            message: 'Debe seleccionar un proceso',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }
                    if (!pesoFinal) {
                        mostrarNotificacion({
                            message: 'Debe ingresar el peso final del proceso',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }

                    mostrarCarga('.carga-procesar');

                    // Preparar los datos concatenando con los existentes
                    const procedimientosActuales = registro.procedimientos ? registro.procedimientos.split(';').filter(p => p.trim()) : [];
                    const pesosActuales = registro.peso_procesado ? registro.peso_procesado.split(';').filter(p => p.trim()) : [];
                    const tiemposActuales = registro.tiempo_procesado ? registro.tiempo_procesado.split(';').filter(p => p.trim()) : [];

                    console.log(registro.tiempo_procesado);

                    // Agregar el nuevo proceso
                    procedimientosActuales.push(proceso);
                    pesosActuales.push(pesoFinal);
                    tiemposActuales.push(horaActual);

                    console.log(tiemposActuales);

                    const response = await fetch(`/agregar-proceso/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            proceso: procedimientosActuales.join(';'),
                            peso_final: pesosActuales.join(';'),
                            tiempo_procesado: tiemposActuales.join(';')
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerTareas();
                        info(registro.id)
                        mostrarNotificacion({
                            message: 'Proceso agregado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    }

                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al agregar el proceso',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }

        // Función para mostrar formularios de procesos
        function mostrarFormularioProceso(registro, tipoProceso, producto) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            let titulo = '';
            let formularioHTML = '';

            switch (tipoProceso) {
                case 'bruto':
                    titulo = 'Formulario de Bruto';
                    formularioHTML = `
                         <p class="normal">Datos del Bruto</p>
                         <div class="entrada">
                             <i class="bx bx-package"></i>
                             <div class="input">
                                 <p class="detalle">Producto</p>
                                 <input class="producto" type="text" value="${producto}" autocomplete="off" placeholder=" " required>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-barcode'></i>
                                 <div class="input">
                                     <p class="detalle">Lote</p>
                                     <input type="text" class="lote" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-package'></i>
                                 <div class="input">
                                     <p class="detalle">Tipo</p>
                                     <select class="tipo" required>
                                         <option value=""></option>
                                         <option value="Ingreso">Ingreso</option>
                                         <option value="Salida">Salida</option>
                                     </select>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-user'></i>
                                 <div class="input">
                                     <p class="detalle">Proveedor</p>
                                     <input type="text" class="proveedor" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-package'></i>
                                 <div class="input">
                                     <p class="detalle">Nº Bolsas</p>
                                     <input type="number" class="num-bolsas" required>
                                 </div>
                             </div>                        
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-box'></i>
                                 <div class="input">
                                     <p class="detalle">Peso Inicial (Kg)</p>
                                     <input type="number" step="0.1" class="peso-inicial" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-box'></i>
                                 <div class="input">
                                     <p class="detalle">Peso Final (Kg)</p>
                                     <input type="number" step="0.1" class="peso-final" required>
                                 </div>
                             </div>
                         </div>
                         <div class="entrada">
                             <i class='bx bx-cog'></i>
                             <div class="input">
                                 <p class="detalle">Proceso</p>
                                 <input type="text" class="proceso" required>
                             </div>
                         </div>
                         <div class="entrada">
                             <i class='bx bx-user-check'></i>
                             <div class="input">
                                 <p class="detalle">Responsable</p>
                                 <input type="text" class="responsable" value="${usuarioInfo.nombre + ' ' + usuarioInfo.apellido}" readonly>
                             </div>
                         </div>
                     `;
                    break;

                case 'lavado':
                    titulo = 'Formulario de Lavado';
                    formularioHTML = `
                         <p class="normal">Datos del Lavado</p>
                         <div class="entrada">
                             <i class='bx bx-box'></i>
                             <div class="input">
                                 <p class="detalle">Producto</p>
                                 <input type="text" class="producto" value="${producto}" required>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-barcode'></i>
                                 <div class="input">
                                     <p class="detalle">Lote</p>
                                     <input type="text" class="lote" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-box'></i>
                                 <div class="input">
                                     <p class="detalle">Peso Inicial (Kg)</p>
                                     <input type="number" step="0.1" class="peso-inicial" required>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-droplet'></i>
                                 <div class="input">
                                     <p class="detalle">Cont. de Desinf. (ml)</p>
                                     <input type="number" step="0.1" class="conce-desif" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-droplet'></i>
                                 <div class="input">
                                     <p class="detalle">% de Cloro Usado</p>
                                     <input type="number" step="0.1" value="5.5" class="cloro-usado" required>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-droplet'></i>
                                 <div class="input">
                                     <p class="detalle">Cantidad de Agua (L)</p>
                                     <input type="number" step="0.1" class="cntd-agua" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-time'></i>
                                 <div class="input">
                                     <p class="detalle">T. de Inmersión(m)</p>
                                     <input type="number" step="0.1" value="1" class="tiempo-inmersion" required>
                                 </div>
                             </div>
                         </div>
                         <div class="entrada">
                             <i class='bx bx-user-check'></i>
                             <div class="input">
                                 <p class="detalle">Responsable</p>
                                 <input type="text" class="responsable" value="${usuarioInfo.nombre + ' ' + usuarioInfo.apellido}" readonly>
                             </div>
                         </div>
                     `;
                    break;

                case 'deshidratado':
                    titulo = 'Formulario de Deshidratado';
                    formularioHTML = `
                         <p class="normal">Datos del Deshidratado</p>
                         <div class="entrada">
                             <i class='bx bx-box'></i>
                             <div class="input">
                                 <p class="detalle">Producto</p>
                                 <input type="text" class="producto" value="${producto}" required>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-barcode'></i>
                                 <div class="input">
                                     <p class="detalle">Lote</p>
                                     <input type="text" class="lote" required>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-time'></i>
                                 <div class="input">
                                     <p class="detalle">Hora de Ingreso</p>
                                     <input type="time" class="hora-ingreso" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-time'></i>
                                 <div class="input">
                                     <p class="detalle">Hora de Salida</p>
                                     <input type="time" class="hora-salida" required>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class="fas fa-thermometer-empty"></i>
                                 <div class="input">
                                     <p class="detalle">Temp. Ingreso (°C)</p>
                                     <input type="number" step="0.1" class="temp-ingreso" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class="fas fa-thermometer-empty"></i>
                                 <div class="input">
                                     <p class="detalle">Temp. Salida (°C)</p>
                                     <input type="number" step="0.1" class="temp-salida" required>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-calendar'></i>
                                 <div class="input">
                                     <p class="detalle">Fecha Salida</p>
                                     <input type="date" class="fecha-salida" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-droplet'></i>
                                 <div class="input">
                                     <p class="detalle">% de Humedad</p>
                                     <input type="number" step="0.1" class="humedad" required>
                                 </div>
                             </div>
                         </div>
                         <div class="entrada">
                             <i class='bx bx-user-check'></i>
                             <div class="input">
                                 <p class="detalle">Responsable</p>
                                 <input type="text" class="responsable" value="${usuarioInfo.nombre + ' ' + usuarioInfo.apellido}" readonly>
                             </div>
                         </div>
                     `;
                    break;

                case 'molienda':
                    titulo = 'Formulario de Molienda';
                    formularioHTML = `
                         <p class="normal">Datos de la Molienda</p>
                         <div class="entrada">
                             <i class='bx bx-box'></i>
                             <div class="input">
                                 <p class="detalle">Producto</p>
                                 <input type="text" class="producto" value="${producto}" required>
                             </div>
                         </div>
                         <div class="entrada">
                             <i class='bx bx-cube'></i>
                             <div class="input">
                                 <p class="detalle">Producto Decidido</p>
                                 <input type="text" class="producto-decidido" required>
                             </div>
                             <div class="sugerencias" id="productos-list"></div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-barcode'></i>
                                 <div class="input">
                                     <p class="detalle">Lote</p>
                                     <input type="text" class="lote" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-repeat'></i>
                                 <div class="input">
                                     <p class="detalle">Moliendas</p>
                                     <input type="number" value="3" class="moliendas" required>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-box'></i>
                                 <div class="input">
                                     <p class="detalle">Peso Entregado (Kg)</p>
                                     <input type="number" step="0.1" class="peso-entregado" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-box'></i>
                                 <div class="input">
                                     <p class="detalle">Peso Recibido (Kg)</p>
                                     <input type="number" step="0.1" class="peso-recibido" required>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-refresh'></i>
                                 <div class="input">
                                     <p class="detalle">Cantd Reproceso</p>
                                     <input type="number" class="cantd-reproceso" value="2" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-minus-circle'></i>
                                 <div class="input">
                                     <p class="detalle">Pérdida (Kg)</p>
                                     <input type="number" step="0.01" class="perdida" required>
                                 </div>
                             </div>
                         </div>
                         <div class="entrada">
                             <i class='bx bx-user-check'></i>
                             <div class="input">
                                 <p class="detalle">Responsable</p>
                                 <input type="text" class="responsable" value="${usuarioInfo.nombre + ' ' + usuarioInfo.apellido}" readonly>
                             </div>
                         </div>
                     `;
                    break;

                case 'productos':
                    titulo = 'Formulario de Productos';
                    formularioHTML = `
                         <p class="normal">Datos del Producto Final</p>
                         <div class="entrada">
                             <i class='bx bx-box'></i>
                             <div class="input">
                                 <p class="detalle">Producto</p>
                                 <input type="text" class="producto" value="${producto}" required>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-barcode'></i>
                                 <div class="input">
                                     <p class="detalle">Lote</p>
                                     <input type="text" class="lote" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-package'></i>
                                 <div class="input">
                                     <p class="detalle">Tipo</p>
                                     <select class="tipo" required>
                                         <option value=""></option>
                                         <option value="Ingreso">Ingreso</option>
                                         <option value="Salida">Salida</option>
                                     </select>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-cube'></i>
                                 <div class="input">
                                     <p class="detalle">Tipo de Producto</p>
                                     <select class="tipo-producto" required>
                                         <option value=""></option>
                                         <option value="Molienda">Molido</option>
                                         <option value="Deshidratado">Entero</option>
                                     </select>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-package'></i>
                                 <div class="input">
                                     <p class="detalle">Nº Bolsas</p>
                                     <input type="number" class="num-bolsas" required>
                                 </div>
                             </div>
                         </div>
                         <div class="campo-horizontal">
                             <div class="entrada">
                                 <i class='bx bx-box'></i>
                                 <div class="input">
                                     <p class="detalle">Peso Registrado (Kg)</p>
                                     <input type="number" step="0.1" class="peso-regis" required>
                                 </div>
                             </div>
                             <div class="entrada">
                                 <i class='bx bx-map'></i>
                                 <div class="input">
                                     <p class="detalle">Destino</p>
                                     <select class="destino" required>
                                         <option value=""></option>
                                         <option value="Almacen">Almacen</option>
                                         <option value="Pedido">Pedido</option>
                                         <option value="Venta">Venta</option>
                                         <option value="Consumo">Consumo</option>
                                         <option value="Otros">Otros</option>
                                     </select>
                                 </div>
                             </div>
                         </div>
                         <div class="entrada">
                             <i class='bx bx-user-check'></i>
                             <div class="input">
                                 <p class="detalle">Responsable</p>
                                 <input type="text" class="responsable" value="${usuarioInfo.nombre + ' ' + usuarioInfo.apellido}" readonly>
                             </div>
                         </div>
                     `;
                    break;
            }

            const formularioCompleto = `
                 <div class="encabezado">
                     <h1 class="titulo">${titulo}</h1>
                     <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')">
                         <i class="fas fa-arrow-right"></i>
                     </button>
                 </div>
                 <div class="relleno">
                     
                     ${formularioHTML}
                     
                     <div class="info-sistema">
                         <i class='bx bx-info-circle'></i>
                         <div class="detalle-info">
                             <p>Completa todos los campos del formulario para registrar el proceso de ${titulo.toLowerCase()}.</p>
                         </div>
                     </div>
                 </div>
                 <div class="anuncio-botones">
                     <button class="btn-registrar-proceso btn green" data-proceso="${tipoProceso}">
                         <i class='bx bx-save'></i> Registrar ${titulo.split(' ')[2]}
                     </button>
                 </div>
             `;

            contenido.innerHTML = formularioCompleto;
            contenido.style.paddingBottom = '70px';

            // Agregar evento al botón de registrar
            const btnRegistrar = contenido.querySelector('.btn-registrar-proceso');
            btnRegistrar.addEventListener('click', () => registrarProceso(registro, tipoProceso));

            // Configurar sugerencias de productos para los campos de producto
            const productoInputs = contenido.querySelectorAll('.entrada .producto');
            productoInputs.forEach(productoInput => {
                productoInput.addEventListener('input', (e) => {
                    const valor = normalizarTexto(e.target.value);
                    const sugerenciasList = productoInput.closest('.entrada').querySelector('.sugerencias');

                    if (sugerenciasList) {
                        sugerenciasList.innerHTML = '';

                        if (valor) {
                            const sugerencias = productosGlobal.filter(p =>
                                normalizarTexto(p.producto).includes(valor)
                            );

                            if (sugerencias.length) {
                                sugerenciasList.style.display = 'flex';
                                sugerencias.forEach(p => {
                                    const div = document.createElement('div');
                                    div.classList.add('item');
                                    div.textContent = p.producto;
                                    div.onclick = () => {
                                        productoInput.value = p.producto;
                                        sugerenciasList.style.display = 'none';
                                    };
                                    sugerenciasList.appendChild(div);
                                });
                            }
                        } else {
                            sugerenciasList.style.display = 'none';
                        }
                    }
                });
            });
        }

        // Función para registrar el proceso
        async function registrarProceso(registro, tipoProceso) {
            try {
                const formulario = document.querySelector('.anuncio-tercer .contenido');
                let datos = {};
                let endpoint = '';

                // Recopilar datos según el tipo de proceso
                switch (tipoProceso) {
                    case 'bruto':
                        datos = {
                            producto: formulario.querySelector('.producto').value,
                            lote: formulario.querySelector('.lote').value,
                            tipo: formulario.querySelector('.tipo').value,
                            proveedor: formulario.querySelector('.proveedor').value,
                            numBolsas: formulario.querySelector('.num-bolsas').value,
                            pesoInicial: formulario.querySelector('.peso-inicial').value,
                            pesoFinal: formulario.querySelector('.peso-final').value,
                            proceso: formulario.querySelector('.proceso').value,
                            responsable: formulario.querySelector('.responsable').value
                        };
                        endpoint = '/registrar-proceso-bruto';
                        break;

                    case 'lavado':
                        datos = {
                            producto: formulario.querySelector('.producto').value,
                            lote: formulario.querySelector('.lote').value,
                            pesoInicial: formulario.querySelector('.peso-inicial').value,
                            conceDesinf: formulario.querySelector('.conce-desif').value,
                            cloroUsado: formulario.querySelector('.cloro-usado').value,
                            cntdAgua: formulario.querySelector('.cntd-agua').value,
                            tiempoInmersion: formulario.querySelector('.tiempo-inmersion').value,
                            responsable: formulario.querySelector('.responsable').value
                        };
                        endpoint = '/registrar-proceso-lavado';
                        break;

                    case 'deshidratado':
                        datos = {
                            producto: formulario.querySelector('.producto').value,
                            lote: formulario.querySelector('.lote').value,
                            horaIngreso: formulario.querySelector('.hora-ingreso').value,
                            horaSalida: formulario.querySelector('.hora-salida').value,
                            tempIngreso: formulario.querySelector('.temp-ingreso').value,
                            tempSalida: formulario.querySelector('.temp-salida').value,
                            fechaSalida: formulario.querySelector('.fecha-salida').value,
                            humedad: formulario.querySelector('.humedad').value,
                            responsable: formulario.querySelector('.responsable').value
                        };
                        endpoint = '/registrar-proceso-deshidratado';
                        break;

                    case 'molienda':
                        datos = {
                            producto: formulario.querySelector('.producto').value,
                            productoDecidido: formulario.querySelector('.producto-decidido').value,
                            lote: formulario.querySelector('.lote').value,
                            molienda: formulario.querySelector('.moliendas').value,
                            pesoEntregado: formulario.querySelector('.peso-entregado').value,
                            pesoRecibido: formulario.querySelector('.peso-recibido').value,
                            cantReprocesado: formulario.querySelector('.cantd-reproceso').value,
                            perdida: formulario.querySelector('.perdida').value,
                            responsable: formulario.querySelector('.responsable').value
                        };
                        endpoint = '/registrar-proceso-molienda';
                        break;

                    case 'productos':
                        datos = {
                            producto: formulario.querySelector('.producto').value,
                            lote: formulario.querySelector('.lote').value,
                            tipo: formulario.querySelector('.tipo').value,
                            tipoProducto: formulario.querySelector('.tipo-producto').value,
                            numBolsas: formulario.querySelector('.num-bolsas').value,
                            pesoRegistrado: formulario.querySelector('.peso-regis').value,
                            destino: formulario.querySelector('.destino').value,
                            responsable: formulario.querySelector('.responsable').value
                        };
                        endpoint = '/registrar-proceso-acopio';
                        break;
                }

                // Validar que todos los campos estén llenos
                const camposVacios = Object.values(datos).some(valor => !valor.trim());
                if (camposVacios) {
                    mostrarNotificacion({
                        message: 'Debe completar todos los campos del formulario',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                mostrarCarga('.carga-procesar');

                // Enviar datos al servidor usando el endpoint correspondiente
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datos)
                });

                const data = await response.json();

                if (data.success) {
                    // Almacenar el ID del proceso registrado en la variable global
                    if (data.id) {
                        if (idsProcesosRegistrados === '') {
                            idsProcesosRegistrados = data.id;
                        } else {
                            idsProcesosRegistrados += `;${data.id}`;
                        }
                        console.log('IDs de procesos registrados:', idsProcesosRegistrados);
                    }

                    mostrarNotificacion({
                        message: `Proceso de ${tipoProceso} registrado correctamente`,
                        type: 'success',
                        duration: 3000
                    });

                    // Volver al formulario de finalizar tarea
                    finalizarTarea(registro);
                } else {
                    throw new Error(data.error || 'Error al registrar el proceso');
                }

            } catch (error) {
                console.error('Error al registrar proceso:', error);
                mostrarNotificacion({
                    message: 'Error al registrar el proceso',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga('.carga-procesar');
            }
        }
        // Función para ver las tablas de procesos
        async function verTablasProcesos(registro) {
            try {
                console.log('=== VER TABLAS DE PROCESOS ===');
                console.log('Registro de tarea:', registro);
                
                // Obtener los IDs de procesos del registro de la tarea
                const idsProcesosRegistrados = registro.id_regsitro_pro || '';
                console.log('IDs de procesos registrados:', idsProcesosRegistrados);

                if (!idsProcesosRegistrados || idsProcesosRegistrados === '') {
                    console.log('No hay IDs de procesos registrados para mostrar');
                    return;
                }

                // Separar los IDs de procesos
                const idsProcesos = idsProcesosRegistrados.split(';').filter(id => id.trim());
                console.log('IDs de procesos separados:', idsProcesos);

                // Obtener todos los registros de procesos
                const [bruto, lavado, deshidratado, molienda, acopio] = await Promise.all([
                    obtenerBruto(),
                    obtenerLavado(),
                    obtenerDeshidratado(),
                    obtenerMolienda(),
                    obtenerAcopioProceso()
                ]);

                console.log('=== REGISTROS OBTENIDOS ===');
                console.log('Bruto:', bruto);
                console.log('Lavado:', lavado);
                console.log('Deshidratado:', deshidratado);
                console.log('Molienda:', molienda);
                console.log('Acopio:', acopio);

                // Buscar los registros específicos según los IDs
                const registrosEncontrados = [];

                idsProcesos.forEach(idProceso => {
                    const tipoProceso = idProceso.substring(0, 6); // Obtener los primeros 6 caracteres
                    let registroEncontrado = null;

                    switch (tipoProceso) {
                        case 'PROBRU':
                            registroEncontrado = bruto.find(r => r.id === idProceso);
                            if (registroEncontrado) {
                                registrosEncontrados.push({
                                    tipo: 'Bruto',
                                    id: idProceso,
                                    registro: registroEncontrado
                                });
                            }
                            break;
                        case 'PROLAV':
                            registroEncontrado = lavado.find(r => r.id === idProceso);
                            if (registroEncontrado) {
                                registrosEncontrados.push({
                                    tipo: 'Lavado',
                                    id: idProceso,
                                    registro: registroEncontrado
                                });
                            }
                            break;
                        case 'PRODES':
                            registroEncontrado = deshidratado.find(r => r.id === idProceso);
                            if (registroEncontrado) {
                                registrosEncontrados.push({
                                    tipo: 'Deshidratado',
                                    id: idProceso,
                                    registro: registroEncontrado
                                });
                            }
                            break;
                        case 'PROMOL':
                            registroEncontrado = molienda.find(r => r.id === idProceso);
                            if (registroEncontrado) {
                                registrosEncontrados.push({
                                    tipo: 'Molienda',
                                    id: idProceso,
                                    registro: registroEncontrado
                                });
                            }
                            break;
                        case 'PROAC':
                            registroEncontrado = acopio.find(r => r.id === idProceso);
                            if (registroEncontrado) {
                                registrosEncontrados.push({
                                    tipo: 'Acopio',
                                    id: idProceso,
                                    registro: registroEncontrado
                                });
                            }
                            break;
                        default:
                            console.log(`Tipo de proceso no reconocido: ${tipoProceso} para ID: ${idProceso}`);
                    }
                });

                console.log('=== REGISTROS ENCONTRADOS ===');
                registrosEncontrados.forEach(item => {
                    console.log(`${item.tipo} - ${item.id}:`, item.registro);
                });

                if (registrosEncontrados.length === 0) {
                    console.log('No se encontraron registros de procesos para los IDs proporcionados');
                }

            } catch (error) {
                console.error('Error al obtener las tablas de procesos:', error);
            }
        }
    }



    btnNuevaTarea.forEach(btn => {
        btn.addEventListener('click', mostrarFormularioNuevoRegistro);
    })
    btnListaTareas.forEach(btn => {
        btn.addEventListener('click', mostrarListaTareas);
    })

    async function mostrarListaTareas() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Lista de Tareas</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="relleno">
                <p class="normal">Administrar Tareas</p>
                <div class="entrada">
                    <i class='bx bx-task'></i>
                    <div class="input">
                        <p class="detalle">Nueva Tarea</p>
                        <input class="nueva-tarea" type="text" autocomplete="off" placeholder=" " required>
                        <button class="btn-agregar-tarea"><i class='bx bx-plus'></i></button>
                    </div>
                </div>
                <p class="normal">Lista de Tareas</p>
                <div class="lista-tareas-container">
                    ${listaTareasGlobal.map(tarea => `
                        <div class="tarea-item" data-id="${tarea.id}">
                            <span class="tarea-texto">${tarea.tarea}</span>
                            <button class="btn-eliminar-tarea" data-id="${tarea.id}">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();

        // Evento para agregar nueva tarea
        const btnAgregar = contenido.querySelector('.btn-agregar-tarea');
        const inputTarea = contenido.querySelector('.nueva-tarea');

        btnAgregar.addEventListener('click', async () => {
            const tarea = inputTarea.value.trim();
            if (!tarea) {
                mostrarNotificacion({
                    message: 'Ingrese una tarea',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga('.carga-procesar');

                const response = await fetch('/agregar-tarea-lista', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tarea })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    mostrarNotificacion({
                        message: 'Tarea agregada correctamente',
                        type: 'success',
                        duration: 3000
                    });
                    await obtenerListaTareas();
                    mostrarListaTareas();
                }

            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al agregar la tarea',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga('.carga-procesar');
            }
        });

        // Eventos para eliminar tareas
        const btnsEliminar = contenido.querySelectorAll('.btn-eliminar-tarea');
        btnsEliminar.forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                try {
                    mostrarCarga('.carga-procesar');

                    const response = await fetch(`/eliminar-tarea-lista/${id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        mostrarNotificacion({
                            message: 'Tarea eliminada correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        await obtenerListaTareas();
                        mostrarListaTareas();
                    }

                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar la tarea',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        });
    }

    function mostrarFormularioNuevoRegistro() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const ahora = new Date();
        const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Nueva Tarea</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="relleno">
                <p class="normal">Seleccionar Producto</p>
                <div class="entrada">
                    <i class="bx bx-package"></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                    </div>
                    <div class="sugerencias" id="productos-list"></div>
                </div>
                <p class="normal">Peso Inicial</p>
                <div class="entrada">
                    <i class="bx bx-list-check"></i>
                    <div class="input">
                        <p class="detalle">Peso Inicial</p>
                        <input class="peso-inicial" type="number" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <p class="normal">Selecciona al operador</p>
                <div class="entrada">
                    <i class="bx bx-user"></i>
                    <div class="input">
                        <p class="detalle">Operador</p>
                        <select class="operador" required>
                            ${nombresUsuariosGlobal.map(nombre => `
                                <option value="${nombre.nombre}">${nombre.nombre}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-registrar btn green">
                    <i class="bx bx-play-circle"></i> Iniciar Tarea
                </button>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        const productoInput = document.querySelector('.entrada .producto');
        const sugerenciasList = document.querySelector('#productos-list');
        const pesoInicialInput = document.querySelector('.peso-inicial');
        const operadorInput = document.querySelector('.operador');

        productoInput.addEventListener('input', (e) => {
            const valor = normalizarTexto(e.target.value);
            sugerenciasList.innerHTML = '';

            if (valor) {
                const sugerencias = productosGlobal.filter(p =>
                    normalizarTexto(p.producto).includes(valor)
                );

                if (sugerencias.length) {
                    sugerenciasList.style.display = 'flex';
                    sugerencias.forEach(p => {
                        const div = document.createElement('div');
                        div.classList.add('item');
                        div.textContent = p.producto;
                        div.onclick = () => {
                            productoInput.value = p.producto;
                            sugerenciasList.style.display = 'none';
                            window.idPro = p.id;
                        };
                        sugerenciasList.appendChild(div);
                    });
                }
            } else {
                sugerenciasList.style.display = 'none';
            }
        });

        const btnRegistrar = contenido.querySelector('.btn-registrar');
        btnRegistrar.addEventListener('click', async () => {
            // Limpiar la variable global de IDs de procesos al iniciar nueva tarea
            idsProcesosRegistrados = '';
            try {
                const productoSeleccionado = productoInput.value.trim();
                const pesoInicial = pesoInicialInput.value.trim();
                const idPro = window.idPro;
                const operadorSeleccionado = operadorInput.value.trim();

                if (!productoSeleccionado || !operadorSeleccionado) {
                    mostrarNotificacion({
                        message: 'Debe seleccionar un producto y un operador',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                mostrarCarga('.carga-procesar');

                const response = await fetch('/registrar-tarea', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        producto: productoSeleccionado,
                        peso_inicial: pesoInicial,
                        hora_inicio: horaActual,
                        operador: operadorSeleccionado,
                        id_pro: idPro
                    })
                });

                const data = await response.json();

                if (data.success) {
                    await obtenerTareas();
                    cerrarAnuncioManual('anuncioSecond');
                    updateHTMLWithData();
                    mostrarNotificacion({
                        message: 'Tarea iniciada correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error(data.error);
                }

            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al crear la tarea',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga('.carga-procesar');
            }
        });
    }
    btnExcel.forEach(btn => {
        btn.addEventListener('click', () => exportarArchivos('tareas', registrosAExportar));
    })
    aplicarFiltros();
}