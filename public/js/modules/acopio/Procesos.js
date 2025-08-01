let bruto = [];
let lavado = [];
let deshidratado = [];
let molienda = [];
let acopioProceso = [];
let tipoRegistroActual = 'bruto'; // Por defecto mostrar bruto
// Hacer accesible globalmente para la función de exportar
window.tipoRegistroActual = tipoRegistroActual;
let movimientosAcopio = [];
let productosGlobal = [];

const DB_NAME = 'damabrava_db';
const REGISTROS_BRUTO = 'registros_bruto';
const REGISTROS_LAVADO = 'registros_lavado';
const REGISTROS_DESHIDRATADO = 'registros_deshidratado';
const REGISTROS_MOLIENDA = 'registros_molienda';
const REGISTROS_ACOPIO_PROCESO = 'registros_acopio_proceso';
const PRODUCTOS_AC_DB = 'productos_acopio';


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
            return true;
        } else {
            return false;
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
            return true;
        } else {
            return false;
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
            return true;
        } else {
            return false;
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
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener registros de molienda:', error);
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
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener registros de acopio-proceso:', error);
        return false;
    }
}



export async function mostrarProcesos() {
    renderInitialHTML();
    mostrarAnuncio();

    const [obtnerBruto, obtnerLavado, obtnerDeshidratado, obtnerMolienda, obtnerProductos, obtnerAcopioProceso] = await Promise.all([
        obtenerBruto(),
        obtenerLavado(),
        obtenerDeshidratado(),
        obtenerMolienda(),
        obtenerProductos(),
        await obtenerAcopioProceso(),
    ]);
}
function renderInitialHTML() {
    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `
        <div class="encabezado">
            <h1 class="titulo">Procesos</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="book" style="width: 100%; min-height: 90px; flex-wrap: nowrap; overflow-x: auto;">
                    <button class="btn-proceso activado orange">
                        <i class='bx bx-book' style="color: orange"></i>
                        <span>Materia Prima en Bruto</span>
                    </button>
                    <button class="btn-proceso green">
                        <i class='bx bx-book' style="color: var(--success)"></i>
                        <span>Lavado y Desinfección</span>
                    </button>
                    <button class="btn-proceso red">
                        <i class='bx bx-book' style="color: var(--error);"></i>
                        <span>Registro de Deshidratado</span>
                    </button>
                    <button class="btn-proceso origin">
                        <i class='bx bx-book' style="color: var(--tercer-color);"></i>
                        <span>Registro de Molienda</span>
                    </button>
                    <button class="btn-proceso blue">
                        <i class='bx bx-book' style="color: rgb(81, 142, 255);"></i>
                        <span>Registro de Acopio</span>
                    </button>
                </div>
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
                        <button class="nuevo-registro btn origin"><i class='bx bx-plus'></i> <span>Registrar</span></button>
                        <button class="exportar-pdf btn red"><i class='bx bxs-file-pdf'></i> <span>Descargar PDF</span></button>
                    </div>
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
                <button class="nuevo-registro btn origin"><i class='bx bx-plus'></i> <span>Registrar</span></button>
                <button class="exportar-pdf btn red"><i class='bx bxs-file-pdf'></i> <span>Descargar PDF</span></button>
            </div>
        `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '70px';
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
function updateHTMLWithData() {
    const productosContainer = document.querySelector('.productos-container');

    // Mostrar TODOS los registros en el DOM para poder filtrarlos después
    const todosLosRegistros = [...bruto, ...lavado, ...deshidratado, ...molienda, ...acopioProceso];

        const productosHTML = todosLosRegistros.map(registro => `
        <div class="registro-item" data-id="${registro.id}">
            <div class="header">
                <i class='bx bx-file'></i>
                <div class="info-header">
                        <span class="id-flotante"><span>${registro.id}</span>${registro.tipo ? ` <span class="flotante-item blue">${registro.tipo}</span>` : ''}</span>
                        <span class="detalle">${registro.nombre || registro.nombreMovimiento || registro.producto || 'Sin nombre'}</span>
                    <span class="pie">${registro.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');
        productosContainer.innerHTML = productosHTML;
    eventosProcesos();
}


function eventosProcesos() {
    const items = document.querySelectorAll('.registro-item');
    const nuevoRegistro = document.querySelectorAll('.nuevo-registro');
    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');
    const botonExportarPDF = document.querySelectorAll('.exportar-pdf');
    const registrosAExportar = movimientosAcopio;

    // Agregar eventos a los botones de tipo de registro
    const btnProcesos = document.querySelectorAll('.btn-proceso');
    btnProcesos.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // Remover clase activado de todos los botones
            btnProcesos.forEach(b => b.classList.remove('activado'));
            // Agregar clase activado al botón clickeado
            btn.classList.add('activado');

            // Cambiar el tipo de registro actual
            const tipos = ['bruto', 'lavado', 'deshidratado', 'molienda', 'acopio'];
            tipoRegistroActual = tipos[index];
            window.tipoRegistroActual = tipoRegistroActual; // Actualizar variable global

            cerrarAnuncioManual('anuncioSecond');

            aplicarFiltros();
        });
    });

    const contenedor = document.querySelector('.anuncio .relleno');
    movimientosAcopio = [...bruto, ...lavado, ...deshidratado, ...molienda, ...acopioProceso];
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

    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
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

    botonExportarPDF.forEach(boton => {
        boton.addEventListener('click', () => {
            // Usar los datos actuales de movimientosAcopio
            exportarArchivosPDF('acopio-procesos', movimientosAcopio)
        });
    });


    function aplicarFiltros() {
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Obtener los elementos del DOM actualizados
        const itemsActuales = document.querySelectorAll('.registro-item');

        const registrosFiltrados = Array.from(itemsActuales).map(registro => {
            const registroData = movimientosAcopio.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Primero filtrar por tipo de registro actual
            switch (tipoRegistroActual) {
                case 'bruto':
                    mostrar = registroData.id.startsWith('PROBRU-');
                    break;
                case 'lavado':
                    mostrar = registroData.id.startsWith('PROLAV-');
                    break;
                case 'deshidratado':
                    mostrar = registroData.id.startsWith('PRODES-');
                    break;
                case 'molienda':
                    mostrar = registroData.id.startsWith('PROMOL-');
                    break;
                case 'acopio':
                    mostrar = registroData.id.startsWith('PROAC-');
                    break;
                default:
                    mostrar = registroData.id.startsWith('PROBRU-');
            }

            // Si no coincide con el tipo actual, no mostrar
            if (!mostrar) return { elemento: registro, mostrar: false };

            // Filtro de fechas
            if (fechasSeleccionadas.length === 2) {
                const [fechaPart] = registroData.fecha.split(','); // Dividir por coma primero
                const [dia, mes, anio] = fechaPart.trim().split('/'); // Quitar espacios y dividir
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];
                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }

            // Filtro de búsqueda
            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.nombreMovimiento,
                    registroData.tipo,
                    registroData.fecha,
                    registroData.producto,
                    registroData.observaciones
                ].filter(Boolean).join(' ').toLowerCase();
                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        const registrosVisibles = registrosFiltrados.filter(r => r.mostrar).length;

        // Ocultar todos con una transición suave
        itemsActuales.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        // Esperar a que termine la animación de ocultamiento
        setTimeout(() => {
            itemsActuales.forEach(registro => {
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
        }, 200);
    }

    inputBusqueda.addEventListener('input', (e) => {
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });


    window.info = function (registroId) {
        const registro = movimientosAcopio.find(r => r.id === registroId);
        if (!registro) return;

        // Determinar el tipo de registro basado en el ID
        let tipoRegistro = '';
        if (registro.id.startsWith('PROBRU-')) tipoRegistro = 'bruto';
        else if (registro.id.startsWith('PROLAV-')) tipoRegistro = 'lavado';
        else if (registro.id.startsWith('PRODES-')) tipoRegistro = 'deshidratado';
        else if (registro.id.startsWith('PROMOL-')) tipoRegistro = 'molienda';
        else if (registro.id.startsWith('PROAC-')) tipoRegistro = 'acopio';

        const contenido = document.querySelector('.anuncio-second .contenido');

        // Generar campos específicos según el tipo de registro
        let camposHTML = '';

        switch (tipoRegistro) {
            case 'bruto':
                camposHTML = `
                    <p class="normal">Información básica</p>
            <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Tipo: </span>${registro.tipo || 'N/A'}</span>
            </div>
                    
                    <p class="normal">Detalles del proveedor</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-user'></i> Proveedor: </span>${registro.proveedor || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Nº Bolsas: </span>${registro.nBolsas || 'N/A'}</span>
                    </div>
                    
                    <p class="normal">Información de peso</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Inicial: </span>${registro.pesoInicial || 'N/A'} Kg</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Final: </span>${registro.pesoFinal || 'N/A'} Kg</span>
                    </div>
                    
                    <p class="normal">Proceso</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-cog'></i> Proceso: </span>${registro.proceso || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-user-check'></i> Responsable: </span>${registro.responsable || 'N/A'}</span>
            </div>
                `;
                break;

            case 'lavado':
                camposHTML = `
                <p class="normal">Información básica</p>
                <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                    </div>
                    
                    <p class="normal">Información de peso</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Inicial: </span>${registro.pesoInicial || 'N/A'} Kg</span>
                    </div>
                    
                    <p class="normal">Detalles de desinfección</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-droplet'></i> Cont. de Desinf.: </span>${registro.conDesinfeccion || 'N/A'} ml</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-droplet'></i> % de Cloro Usado: </span>${registro.cloroUsado || 'N/A'}%</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-droplet'></i> Cantidad de Agua: </span>${registro.aguaUsada || 'N/A'} L</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Tiempo de Inmersión: </span>${registro.tiempoInmersion || 'N/A'} min</span>
                    </div>
                    
                    <p class="normal">Responsable</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-user-check'></i> Responsable: </span>${registro.responsable || 'N/A'}</span>
                    </div>
                `;
                break;

            case 'deshidratado':
                camposHTML = `
                    <p class="normal">Información básica</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                    </div>
                    
                    <p class="normal">Horarios</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora de Ingreso: </span>${registro.horaIngreso || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora de Salida: </span>${registro.horaSalida || 'N/A'}</span>
                    </div>
                    
                    <p class="normal">Temperaturas</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class="fas fa-thermometer-empty"></i> Temp. Ingreso: </span>${registro.tempIngreso || 'N/A'}°C</span>
                        <span class="detalle"><span class="concepto"><i class="fas fa-thermometer-empty"></i> Temp. Salida: </span>${registro.tempSalida || 'N/A'}°C</span>
                    </div>
                    
                    <p class="normal">Información adicional</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha Salida: </span>${registro.fechaSalida || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-droplet'></i> % de Humedad: </span>${registro.porHumedad || 'N/A'}%</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-user-check'></i> Responsable: </span>${registro.responsable || 'N/A'}</span>
                    </div>
                `;
                break;

            case 'molienda':
                camposHTML = `
                    <p class="normal">Información básica</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-cube'></i> Producto Decidido: </span>${registro.productoDecidido || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                    </div>
                    
                    <p class="normal">Información de molienda</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-repeat'></i> Moliendas: </span>${registro.moliendas || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-refresh'></i> Cantd. Reproceso: </span>${registro.ctdReprocesado || 'N/A'}</span>
                    </div>
                    
                    <p class="normal">Información de peso</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Entregado: </span>${registro.pesoEntregado || 'N/A'} Kg</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Recibido: </span>${registro.pesoRecibido || 'N/A'} Kg</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-minus-circle'></i> Pérdida: </span>${registro.perdida || 'N/A'} Kg</span>
                    </div>
                    
                    <p class="normal">Responsable</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-user-check'></i> Responsable: </span>${registro.responsable || 'N/A'}</span>
                    </div>
                `;
                break;

            case 'acopio':
                camposHTML = `
                    <p class="normal">Información básica</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Tipo: </span>${registro.tipo || 'N/A'}</span>
                </div>
    
                <p class="normal">Detalles del producto</p>
                <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-cube'></i> Tipo-Producto: </span>${registro.tipoProducto || 'N/A'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Nº Bolsas: </span>${registro.numBolsas || 'N/A'}</span>
                </div>
    
                    <p class="normal">Información de peso y destino</p>
                <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Regis.: </span>${registro.pesoRegistrado || 'N/A'} Kg</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-map'></i> Destino: </span>${registro.destino || 'N/A'}</span>
                </div>
    
                    <p class="normal">Responsable</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-user-check'></i> Responsable: </span>${registro.responsable || 'N/A'}</span>
                    </div>
                `;
                break;
        }

        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Información del registro - ${tipoRegistro.charAt(0).toUpperCase() + tipoRegistro.slice(1)}</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">ID del registro</p>
                <div class="campo-vertical">
                    <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> ID: </span>${registro.id}</span>
                </div>
                
                ${camposHTML}
            </div>
            <div class="anuncio-botones">
                <button class="btn-editar btn blue" data-id="${registro.id}"><i class="bx bx-edit"></i>Editar</button>
                <button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i>Eliminar</button>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        contenido.style.paddingBottom = '70px';


        mostrarAnuncioSecond();

        const btnEliminar = contenido.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', () => eliminar(registro));
        const btnEditar = contenido.querySelector('.btn-editar');
        btnEditar.addEventListener('click', () => editar(registro));

        async function eliminar(registro) {
            // Determinar el tipo de registro basado en el ID
            let tipoRegistro = '';
            if (registro.id.startsWith('PROBRU-')) tipoRegistro = 'bruto';
            else if (registro.id.startsWith('PROLAV-')) tipoRegistro = 'lavado';
            else if (registro.id.startsWith('PRODES-')) tipoRegistro = 'deshidratado';
            else if (registro.id.startsWith('PROMOL-')) tipoRegistro = 'molienda';
            else if (registro.id.startsWith('PROAC-')) tipoRegistro = 'acopio';

            const contenido = document.querySelector('.anuncio-tercer .contenido');

            // Generar información específica según el tipo de registro
            let infoHTML = '';

            switch (tipoRegistro) {
                case 'bruto':
                    infoHTML = `
                        <div class="campo-vertical">
                            <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Tipo: </span>${registro.tipo || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-user'></i> Proveedor: </span>${registro.proveedor || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Inicial: </span>${registro.pesoInicial || 'N/A'} Kg</span>
                        </div>
                    `;
                    break;
                case 'lavado':
                    infoHTML = `
                        <div class="campo-vertical">
                            <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Inicial: </span>${registro.pesoInicial || 'N/A'} Kg</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-droplet'></i> % de Cloro: </span>${registro.cloroUsado || 'N/A'}%</span>
                        </div>
                    `;
                    break;
                case 'deshidratado':
                    infoHTML = `
                        <div class="campo-vertical">
                            <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora Ingreso: </span>${registro.horaIngreso || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-droplet'></i> % Humedad: </span>${registro.porHumedad || 'N/A'}%</span>
                        </div>
                    `;
                    break;
                case 'molienda':
                    infoHTML = `
                        <div class="campo-vertical">
                            <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-cube'></i> Producto Decidido: </span>${registro.productoDecidido || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Entregado: </span>${registro.pesoEntregado || 'N/A'} Kg</span>
                        </div>
                    `;
                    break;
                case 'acopio':
                    infoHTML = `
                        <div class="campo-vertical">
                            <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-barcode'></i> Lote: </span>${registro.lote || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Tipo: </span>${registro.tipo || 'N/A'}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-weight'></i> Peso Regis.: </span>${registro.pesoRegistrado || 'N/A'} Kg</span>
                        </div>
                    `;
                    break;
            }

            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Eliminar registro - ${tipoRegistro.charAt(0).toUpperCase() + tipoRegistro.slice(1)}</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información del registro</p>
                <div class="campo-vertical">
                    <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> ID: </span>${registro.id}</span>
                </div>
                ${infoHTML}

                <p class="normal">Motivo de la eliminación</p>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Motivo</p>
                        <input class="motivo-eliminacion" type="text" autocomplete="off" placeholder=" " required>
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
                <button class="btn-confirmar-eliminar btn red"><i class='bx bx-trash'></i> Confirmar eliminación</button>
            </div>
        `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            // Agregar evento al botón de confirmar eliminación
            const btnConfirmarEliminar = contenido.querySelector('.btn-confirmar-eliminar');
            btnConfirmarEliminar.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-eliminacion').value.trim();

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

                    // Determinar el endpoint según el tipo de registro
                    let endpoint = '';
                    switch (tipoRegistro) {
                        case 'bruto':
                            endpoint = `/eliminar-registro-bruto/${registro.id}`;
                            break;
                        case 'lavado':
                            endpoint = `/eliminar-registro-lavado/${registro.id}`;
                            break;
                        case 'deshidratado':
                            endpoint = `/eliminar-registro-deshidratado/${registro.id}`;
                            break;
                        case 'molienda':
                            endpoint = `/eliminar-registro-molienda/${registro.id}`;
                            break;
                        case 'acopio':
                            endpoint = `/eliminar-registro-acopio/${registro.id}`;
                            break;
                    }

                    const response = await fetch(endpoint, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Recargar los datos según el tipo
                        switch (tipoRegistro) {
                            case 'bruto':
                                await obtenerBruto();
                                break;
                            case 'lavado':
                                await obtenerLavado();
                                break;
                            case 'deshidratado':
                                await obtenerDeshidratado();
                                break;
                            case 'molienda':
                                await obtenerMolienda();
                                break;
                            case 'acopio':
                                await obtenerAcopioProceso();
                                break;
                        }

                        // Actualizar la vista
                        updateHTMLWithData();
                        cerrarAnuncioManual('anuncioSecond');
                        cerrarAnuncioManual('anuncioTercer');

                        mostrarNotificacion({
                            message: 'Registro eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });

                        registrarNotificacion(
                            'Administración',
                            'Eliminación',
                            usuarioInfo.nombre + ' eliminó el registro ' + registro.id + ' (' + tipoRegistro + ') por el motivo: ' + motivo
                        );
                    } else {
                        throw new Error(data.error);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: 'Error al eliminar el registro',
                        type: 'error',
                        duration: 3000
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }
        async function editar(registro) {
            // Determinar el tipo de registro basado en el ID
            let tipoRegistro = '';
            if (registro.id.startsWith('PROBRU-')) tipoRegistro = 'bruto';
            else if (registro.id.startsWith('PROLAV-')) tipoRegistro = 'lavado';
            else if (registro.id.startsWith('PRODES-')) tipoRegistro = 'deshidratado';
            else if (registro.id.startsWith('PROMOL-')) tipoRegistro = 'molienda';
            else if (registro.id.startsWith('PROAC-')) tipoRegistro = 'acopio';

            const contenido = document.querySelector('.anuncio-tercer .contenido');

            // Generar campos de edición específicos según el tipo de registro
            let camposHTML = '';

            switch (tipoRegistro) {
                case 'bruto':
                    camposHTML = `
                        <div class="entrada">
                            <i class='bx bx-box'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input class="producto" type="text" value="${registro.producto || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                            <div class="sugerencias"></div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-barcode'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote" type="text" value="${registro.lote || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Tipo</p>
                                <select class="tipo" required>
                                    <option value="Ingreso" ${registro.tipo === 'Ingreso' ? 'selected' : ''}>Ingreso</option>
                                    <option value="Salida" ${registro.tipo === 'Salida' ? 'selected' : ''}>Salida</option>
                                </select>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-user'></i>
                            <div class="input">
                                <p class="detalle">Proveedor</p>
                                <input class="proveedor" type="text" value="${registro.proveedor || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Nº Bolsas</p>
                                <input class="nBolsas" type="number" value="${registro.nBolsas || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-box'></i>
                            <div class="input">
                                <p class="detalle">Peso Inicial (Kg)</p>
                                <input class="pesoInicial" type="number" step="0.01" value="${registro.pesoInicial || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-cog'></i>
                            <div class="input">
                                <p class="detalle">Proceso</p>
                                <input class="proceso" type="text" value="${registro.proceso || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-box'></i>
                            <div class="input">
                                <p class="detalle">Peso Final (Kg)</p>
                                <input class="pesoFinal" type="number" step="0.01" value="${parseFloat(registro.pesoFinal).toFixed(2) || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    `;
                    break;
                case 'lavado':
                    camposHTML = `
                        <div class="entrada">
                            <i class='bx bx-box'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input class="producto" type="text" value="${registro.producto || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                            <div class="sugerencias"></div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-barcode'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote" type="text" value="${registro.lote || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-weight'></i>
                            <div class="input">
                                <p class="detalle">Peso Inicial (Kg)</p>
                                <input class="pesoInicial" type="number" step="0.01" value="${registro.pesoInicial || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-droplet'></i>
                            <div class="input">
                                <p class="detalle">Cont. de Desinf. (ml)</p>
                                <input class="conDesinfeccion" type="number" step="0.01" value="${registro.conDesinfeccion || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-droplet'></i>
                            <div class="input">
                                <p class="detalle">% de Cloro Usado</p>
                                <input class="cloroUsado" type="number" step="0.01" value="${registro.cloroUsado || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-droplet'></i>
                            <div class="input">
                                <p class="detalle">Cantidad de Agua (L)</p>
                                <input class="aguaUsada" type="number" step="0.01" value="${registro.aguaUsada || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-time'></i>
                            <div class="input">
                                <p class="detalle">Tiempo de Inmersión (min)</p>
                                <input class="tiempoInmersion" type="number" value="${registro.tiempoInmersion || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    `;
                    break;
                case 'deshidratado':
                    camposHTML = `
                        <div class="entrada">
                            <i class='bx bx-box'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input class="producto" type="text" value="${registro.producto || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                            <div class="sugerencias"></div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-barcode'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote" type="text" value="${registro.lote || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-time'></i>
                            <div class="input">
                                <p class="detalle">Hora de Ingreso</p>
                                <input class="horaIngreso" type="time" value="${registro.horaIngreso || ''}" required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class="fas fa-thermometer-empty"></i>
                            <div class="input">
                                <p class="detalle">Temp. Ingreso (°C)</p>
                                <input class="tempIngreso" type="number" step="0.01" value="${registro.tempIngreso || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class="fas fa-thermometer-empty"></i>
                            <div class="input">
                                <p class="detalle">Temp. Salida (°C)</p>
                                <input class="tempSalida" type="number" step="0.01" value="${registro.tempSalida || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-calendar'></i>
                            <div class="input">
                                <p class="detalle">Fecha Salida</p>
                                <input class="fechaSalida" type="date" value="${registro.fechaSalida || ''}" required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-time'></i>
                            <div class="input">
                                <p class="detalle">Hora de Salida</p>
                                <input class="horaSalida" type="time" value="${registro.horaSalida || ''}" required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-droplet'></i>
                            <div class="input">
                                <p class="detalle">% de Humedad</p>
                                <input class="porHumedad" type="number" step="0.01" value="${registro.porHumedad || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    `;
                    break;
                case 'molienda':
                    camposHTML = `
                        <div class="entrada">
                            <i class='bx bx-box'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input class="producto" type="text" value="${registro.producto || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                            <div class="sugerencias"></div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-cube'></i>
                            <div class="input">
                                <p class="detalle">Producto Decidido</p>
                                <input class="productoDecidido" type="text" value="${registro.productoDecidido || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-barcode'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote" type="text" value="${registro.lote || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-repeat'></i>
                            <div class="input">
                                <p class="detalle">Moliendas</p>
                                <input class="moliendas" type="number" value="${registro.moliendas || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-weight'></i>
                            <div class="input">
                                <p class="detalle">Peso Entregado (Kg)</p>
                                <input class="pesoEntregado" type="number" step="0.01" value="${registro.pesoEntregado || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-refresh'></i>
                            <div class="input">
                                <p class="detalle">Cantd. Reproceso</p>
                                <input class="ctdReprocesado" type="number" value="${registro.ctdReprocesado || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-weight'></i>
                            <div class="input">
                                <p class="detalle">Peso Recibido (Kg)</p>
                                <input class="pesoRecibido" type="number" step="0.01" value="${registro.pesoRecibido || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-minus-circle'></i>
                            <div class="input">
                                <p class="detalle">Pérdida (Kg)</p>
                                <input class="perdida" type="number" step="0.01" value="${registro.perdida || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>

                    `;
                    break;
                case 'acopio':
                    camposHTML = `
                        <div class="entrada">
                            <i class='bx bx-box'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input class="producto" type="text" value="${registro.producto || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                            <div class="sugerencias"></div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-barcode'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote" type="text" value="${registro.lote || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Tipo</p>
                                <input class="tipo" type="text" value="${registro.tipo || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-cube'></i>
                            <div class="input">
                                <p class="detalle">Tipo-Producto</p>
                                <input class="tipoProducto" type="text" value="${registro.tipoProducto || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Nº Bolsas</p>
                                <input class="numBolsas" type="number" value="${registro.numBolsas || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-weight'></i>
                            <div class="input">
                                <p class="detalle">Peso Regis. (Kg)</p>
                                <input class="pesoRegistrado" type="number" step="0.01" value="${registro.pesoRegistrado || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-map'></i>
                            <div class="input">
                                <p class="detalle">Destino</p>
                                <input class="destino" type="text" value="${registro.destino || ''}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>

                    `;
                    break;
            }

            const registrationHTML = `
        <div class="encabezado">
                    <h1 class="titulo">Editar registro - ${tipoRegistro.charAt(0).toUpperCase() + tipoRegistro.slice(1)}</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal">Información del registro</p>
            <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> ID: </span>${registro.id}</span>
            </div>
                    
                    <p class="normal">Campos editables</p>
                    ${camposHTML}
            </div>
                <div class="anuncio-botones">
                    <button class="btn-guardar-edicion btn blue"><i class='bx bx-save'></i> Guardar cambios</button>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            // Configurar sugerencias de productos
            const productoInputs = contenido.querySelectorAll('.producto');
            productoInputs.forEach(productoInput => {
                const sugerenciasList = productoInput.closest('.entrada').querySelector('.sugerencias');

                productoInput.addEventListener('input', () => {
                    const valor = productoInput.value.toLowerCase();
                    sugerenciasList.innerHTML = '';

                    if (valor.length > 0) {
                        const sugerencias = productosGlobal.filter(producto =>
                            producto.toLowerCase().includes(valor)
                        ).slice(0, 5);

                        sugerencias.forEach(sugerencia => {
                            const div = document.createElement('div');
                            div.className = 'sugerencia';
                            div.textContent = sugerencia;
                            div.addEventListener('click', () => {
                                productoInput.value = sugerencia;
                                sugerenciasList.innerHTML = '';
                            });
                            sugerenciasList.appendChild(div);
                        });
                    }
                });
            });

            const btnGuardarEdicion = contenido.querySelector('.btn-guardar-edicion');
            btnGuardarEdicion.addEventListener('click', async () => {
                try {
                    mostrarCarga('.carga-procesar');

                    // Recopilar todos los valores de los campos
                    const formData = {};
                    const inputs = contenido.querySelectorAll('input');
                    inputs.forEach(input => {
                        formData[input.className] = input.value;
                    });

                    // Determinar el endpoint según el tipo de registro
                    let endpoint = '';
                    switch (tipoRegistro) {
                        case 'bruto':
                            endpoint = `/editar-registro-bruto/${registro.id}`;
                            break;
                        case 'lavado':
                            endpoint = `/editar-registro-lavado/${registro.id}`;
                            break;
                        case 'deshidratado':
                            endpoint = `/editar-registro-deshidratado/${registro.id}`;
                            break;
                        case 'molienda':
                            endpoint = `/editar-registro-molienda/${registro.id}`;
                            break;
                        case 'acopio':
                            endpoint = `/editar-registro-acopio/${registro.id}`;
                            break;
                    }

                    const response = await fetch(endpoint, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Recargar los datos según el tipo
                        switch (tipoRegistro) {
                            case 'bruto':
                                await obtenerBruto();
                                break;
                            case 'lavado':
                                await obtenerLavado();
                                break;
                            case 'deshidratado':
                                await obtenerDeshidratado();
                                break;
                            case 'molienda':
                                await obtenerMolienda();
                                break;
                            case 'acopio':
                                await obtenerAcopioProceso();
                                break;
                        }

                        // Actualizar la vista
                        updateHTMLWithData();
                        cerrarAnuncioManual('anuncioSecond');
                        cerrarAnuncioManual('anuncioTercer');

                        mostrarNotificacion({
                            message: 'Registro editado correctamente',
                            type: 'success',
                            duration: 3000
                        });

                        registrarNotificacion(
                            'Administración',
                            'Edición',
                            usuarioInfo.nombre + ' editó el registro ' + registro.id + ' (' + tipoRegistro + ')'
                        );
                    } else {
                        throw new Error(data.error);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al editar el registro',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }
    }
    nuevoRegistro.forEach(btn => {
        btn.addEventListener('click', () => {
            crearNuevoRegistro();
        });
    });
    function crearNuevoRegistro() {
        const contenido = document.querySelector('.anuncio-second .contenido');

        // Definir campos según el tipo de registro actual
        let camposHTML = '';

        switch (tipoRegistroActual) {
            case 'bruto':
                camposHTML = `
            <div class="entrada">
                        <i class="bx bx-package"></i>
                <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" autocomplete="off" placeholder=" " required>
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
                camposHTML = `
                        <div class="entrada">
                            <i class='bx bx-box'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input type="text" class="producto" required>
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
                camposHTML = `
                    <div class="entrada">
                        <i class='bx bx-box'></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input type="text" class="producto" required>
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
                camposHTML = `
                    <div class="entrada">
                        <i class='bx bx-box'></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input type="text" class="producto" required>
                        </div>
                        <div class="sugerencias" id="productos-list"></div>
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

            case 'acopio':
                camposHTML = `
                    <div class="entrada">
                        <i class='bx bx-box'></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input type="text" class="producto" required>
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

        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Nuevo registro - ${tipoRegistroActual.charAt(0).toUpperCase() + tipoRegistroActual.slice(1)}</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                ${camposHTML}
        </div>
        <div class="anuncio-botones">
                <button class="btn-guardar btn origin"><i class='bx bx-save'></i> Guardar registro</button>
        </div>
    `;

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        const productoInputs = document.querySelectorAll('.entrada .producto');

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
                                    window.idPro = p.id;
                                };
                                sugerenciasList.appendChild(div);
                            });
                        } else {
                            sugerenciasList.style.display = 'none';
                        }
                    } else {
                        sugerenciasList.style.display = 'none';
                    }
                }
            });
        });

        const btnGuardar = contenido.querySelector('.btn-guardar');
        btnGuardar.addEventListener('click', async () => {

            if (tipoRegistroActual === 'bruto') {
                try {
                    const producto = document.querySelector('.producto').value;
                    const lote = document.querySelector('.lote').value;
                    const tipo = document.querySelector('.tipo').value;
                    const proveedor = document.querySelector('.proveedor').value;
                    const numBolsas = document.querySelector('.num-bolsas').value;
                    const pesoInicial = document.querySelector('.peso-inicial').value;
                    const pesoFinal = document.querySelector('.peso-final').value;
                    const proceso = document.querySelector('.proceso').value;
                    const responsable = document.querySelector('.responsable').value;

                    if (!producto || !lote || !tipo || !proveedor || !numBolsas || !pesoInicial || !pesoFinal || !proceso || !responsable) {
                        mostrarNotificacion({
                            message: 'Debe completar todos los campos',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }
                    mostrarCarga('.carga-procesar');
                    const response = await fetch('/registrar-proceso-bruto', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            producto,
                            lote,
                            tipo,
                            proveedor,
                            numBolsas,
                            pesoInicial,
                            pesoFinal,
                            proceso,
                            responsable
                        })
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerBruto();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Proceso registrado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    } else {
                        throw new Error(data.error || 'Error al registrar el proceso');
                    }

                } catch (error) {
                    console.error('Error al registrar el proceso:', error);
                    mostrarNotificacion({
                        message: 'Error al registrar el proceso',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            } else if (tipoRegistroActual === 'lavado') {
                try {
                    const producto = document.querySelector('.producto').value;
                    const lote = document.querySelector('.lote').value;
                    const pesoInicial = document.querySelector('.peso-inicial').value;
                    const conceDesinf = document.querySelector('.conce-desif').value;
                    const cloroUsado = document.querySelector('.cloro-usado').value;
                    const cntdAgua = document.querySelector('.cntd-agua').value;
                    const tiempoInmersion = document.querySelector('.tiempo-inmersion').value;
                    const responsable = document.querySelector('.responsable').value;

                    if (!producto || !lote || !pesoInicial || !conceDesinf || !cloroUsado || !cntdAgua || !tiempoInmersion || !responsable) {
                        mostrarNotificacion({
                            message: 'Debe completar todos los campos',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }
                    mostrarCarga('.carga-procesar');
                    const response = await fetch('/registrar-proceso-lavado', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            producto,
                            lote,
                            pesoInicial,
                            conceDesinf,
                            cloroUsado,
                            cntdAgua,
                            tiempoInmersion,
                            responsable
                        })
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerLavado();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Proceso registrado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    } else {
                        throw new Error(data.error || 'Error al registrar el proceso');
                    }
                } catch (error) {
                    console.error('Error al registrar el proceso:', error);
                    mostrarNotificacion({
                        message: 'Error al registrar el proceso',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            } else if (tipoRegistroActual === 'deshidratado') {
                try {
                    const producto = document.querySelector('.producto').value;
                    const lote = document.querySelector('.lote').value;
                    const horaIngreso = document.querySelector('.hora-ingreso').value;
                    const horaSalida = document.querySelector('.hora-salida').value;
                    const tempIngreso = document.querySelector('.temp-ingreso').value;
                    const tempSalida = document.querySelector('.temp-salida').value;
                    const fechaSalida = document.querySelector('.fecha-salida').value;
                    const humedad = document.querySelector('.humedad').value;
                    const responsable = document.querySelector('.responsable').value;


                    if (!producto || !lote || !horaIngreso || !horaSalida || !tempIngreso || !tempSalida || !fechaSalida || !humedad || !responsable) {
                        mostrarNotificacion({
                            message: 'Debe completar todos los campos',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }
                    mostrarCarga('.carga-procesar');
                    const response = await fetch('/registrar-proceso-deshidratado', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            producto,
                            lote,
                            horaIngreso,
                            horaSalida,
                            tempIngreso,
                            tempSalida,
                            fechaSalida,
                            humedad,
                            responsable
                        })
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerDeshidratado();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Proceso registrado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    } else {
                        throw new Error(data.error || 'Error al registrar el proceso');
                    }
                } catch (error) {
                    console.error('Error al registrar el proceso:', error);
                    mostrarNotificacion({
                        message: 'Error al registrar el proceso',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            } else if (tipoRegistroActual === 'molienda') {
                try {
                    const producto = document.querySelector('.producto').value;
                    const productoDecidido = document.querySelector('.producto-decidido').value;
                    const lote = document.querySelector('.lote').value;
                    const molienda = document.querySelector('.moliendas').value;
                    const pesoEntregado = document.querySelector('.peso-entregado').value;
                    const pesoRecibido = document.querySelector('.peso-recibido').value;
                    const cantReprocesado = document.querySelector('.cantd-reproceso').value;
                    const perdida = document.querySelector('.perdida').value;
                    const responsable = document.querySelector('.responsable').value;

                    if (!producto || !productoDecidido || !lote || !molienda || !pesoEntregado || !pesoRecibido || !cantReprocesado || !perdida || !responsable) {
                        mostrarNotificacion({
                            message: 'Debe completar todos los campos',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }
                    mostrarCarga('.carga-procesar');
                    const response = await fetch('/registrar-proceso-molienda', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            producto,
                            productoDecidido,
                            lote,
                            molienda,
                            pesoEntregado,
                            pesoRecibido,
                            cantReprocesado,
                            perdida,
                            responsable
                        })
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerMolienda();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Proceso registrado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    } else {
                        throw new Error(data.error || 'Error al registrar el proceso');
                    }
                } catch (error) {
                    console.error('Error al registrar el proceso:', error);
                    mostrarNotificacion({
                        message: 'Error al registrar el proceso',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            } else if (tipoRegistroActual === 'acopio') {
                try {
                    const producto = document.querySelector('.producto').value;
                    const lote = document.querySelector('.lote').value;
                    const tipo = document.querySelector('.tipo').value;
                    const tipoProducto = document.querySelector('.tipo-producto').value;
                    const numBolsas = document.querySelector('.num-bolsas').value;
                    const pesoRegistrado = document.querySelector('.peso-regis').value;
                    const destino = document.querySelector('.destino').value;
                    const responsable = document.querySelector('.responsable').value;

                    if (!producto || !lote || !tipo || !tipoProducto || !numBolsas || !pesoRegistrado || !destino || !responsable) {
                        mostrarNotificacion({
                            message: 'Debe completar todos los campos',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }
                    mostrarCarga('.carga-procesar');
                    const response = await fetch('/registrar-proceso-acopio', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            producto,
                            lote,
                            tipo,
                            tipoProducto,
                            numBolsas,
                            pesoRegistrado,
                            destino,
                            responsable
                        })
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerAcopioProceso();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Proceso registrado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    } else {
                        throw new Error(data.error || 'Error al registrar el proceso');
                    }
                } catch (error) {
                    console.error('Error al registrar el proceso:', error);
                    mostrarNotificacion({
                        message: 'Error al registrar el proceso',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            }
        });
    }

    aplicarFiltros();
}