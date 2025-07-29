let pagosGlobal = [];

const DB_NAME = 'damabrava_db';
const PAGOS_DB = 'pagos';


async function obtenerPagos() {
    try {
        const pagosCache = await obtenerLocal(PAGOS_DB, DB_NAME);

        if (pagosCache.length > 0) {
            pagosGlobal = pagosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
            console.log('actualizando desde el cache(Pagos)')
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
                    renderInitialHTML();
                    updateHTMLWithData();

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
        mostrarCarga('.carga-obtener');
        const response = await fetch(`/obtener-pagos-parciales/${pagoId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    } finally {
        ocultarCarga('.carga-obtener');
    }
}


function renderInitialHTML() {
    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Pagos</h1>
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
                    <button class="exportar-excel btn origin"><i class='bx bx-download'></i> <span>Descargar</span></button>
                    <button class="nuevo-pago-generico btn especial"><i class='bx bx-dollar-circle'></i> <span>Nuevo pago</span></button>
                </div>
            </div>
            
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Pagados</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Anulados</button>
                <select class="tipo">
                    <option value="todos" selected>Todos</option>
                    <option value="genericos">Genericos</option>
                    <option value="produccion">Producción</option>
                    <option value="almacen">Almacen</option>
                    <option value="Acopio">Acopio</option>
                </select>
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
            <button class="exportar-excel btn origin"><i class='bx bx-download'></i> Descargar registros</button>
            <button class="nuevo-pago-generico btn especial"><i class='bx bx-dollar-circle'></i> Nuevo pago</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '70px';
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
export async function mostrarPagos() {
    renderInitialHTML();
    mostrarAnuncio();

    const [pagos] = await Promise.all([
        await obtenerPagos()
    ]);
}
function updateHTMLWithData() {
    const productosContainer = document.querySelector('.productos-container');
    const productosHTML = pagosGlobal.map(registro => `
        <div class="registro-item" data-id="${registro.id}">
            <div class="header">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id-flotante"><span>${registro.id}</span><span class="flotante-item ${registro.estado === 'Pendiente' ? 'red' : registro.estado === 'Pagado' ? 'green' : 'orange'}">${registro.estado === 'Pendiente' ? 'Pendiente' : registro.estado === 'Pagado' ? 'Pagado' : 'Anulado'}</span></span>
                    <span class="detalle">${registro.nombre_pago} (${registro.beneficiario})</span>
                    <span class="pie">${registro.fecha}<span class="flotante-item neutro">Bs. ${registro.total}</span></span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosPagos();
}


function eventosPagos() {
    const btnExcel = document.querySelectorAll('.exportar-excel');
    const registrosAExportar = pagosGlobal;
    const btnNuevoPago = document.querySelectorAll('.nuevo-pago-generico');
    const botonesNombre = document.querySelectorAll('.etiquetas-filter .btn-filtro');
    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');
    const selectTipo = document.querySelector('.tipo');

    const inputBusqueda = document.querySelector('.search');
    const items = document.querySelectorAll('.registro-item');
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
    let filtroNombreActual = 'Todos';
    let filtroEstadoActual = 'Todos';
    let filtroTipoActual = 'Todos'; // Nuevo

    selectTipo.addEventListener('change', function () {
        filtroTipoActual = this.value;
        aplicarFiltros();
    });
    selectTipo.addEventListener('focus', function () {
        scrollToCenter(this, this.parentElement);
    });

    function aplicarFiltros() {
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = pagosGlobal.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Filtro por tipo
            if (filtroTipoActual !== 'todos') {
                switch (filtroTipoActual) {
                    case 'genericos':
                        mostrar = registroData.tipo === 'generico';
                        break;
                    case 'produccion':
                        mostrar = registroData.tipo === 'produccion';
                        break;
                    case 'almacen':
                        mostrar = registroData.tipo === 'almacen';
                        break;
                    case 'Acopio':
                        mostrar = registroData.tipo === 'Acopio';
                        break;
                }
            }

            // Filtro por estado
            if (mostrar && filtroEstadoActual && filtroEstadoActual !== 'Todos') {
                if (filtroEstadoActual === 'Pendientes') {
                    mostrar = registroData.estado === 'Pendiente';
                } else if (filtroEstadoActual === 'Pagados') {
                    mostrar = registroData.estado === 'Pagado';
                } else if (filtroEstadoActual === 'Anulados') {
                    mostrar = registroData.estado === 'Anulado';
                }
            }

            // Filtro por nombre (mantener existente)
            if (mostrar && filtroNombreActual && filtroNombreActual !== 'Todos') {
                mostrar = registroData.nombre === filtroNombreActual;
            }

            // Filtro por fecha (mantener existente)
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

            // Filtro por búsqueda (mantener existente)
            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.nombre_pago,
                    registroData.beneficiario,
                    registroData.fecha,
                    registroData.justificativos,
                    registroData.tipo
                ].filter(Boolean).join(' ').toLowerCase();

                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        // Resto del código de animación (mantener existente)
        const registrosVisibles = registrosFiltrados.filter(r => r.mostrar).length;

        items.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        setTimeout(() => {
            items.forEach(registro => {
                registro.style.display = 'none';
            });

            registrosFiltrados.forEach(({ elemento, mostrar }, index) => {
                if (mostrar) {
                    elemento.style.display = 'flex';
                    elemento.style.opacity = '0';
                    elemento.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        elemento.style.opacity = '1';
                        elemento.style.transform = 'translateY(0)';
                    }, 20);
                }
            });

            if (mensajeNoEncontrado) {
                mensajeNoEncontrado.style.display = registrosVisibles === 0 ? 'block' : 'none';
            }
        }, 100);
    }

    botonesNombre.forEach(boton => {
        if (boton.classList.contains('activado')) {
            filtroNombreActual = boton.textContent.trim();
            aplicarFiltros();
        }
        boton.addEventListener('click', () => {
            botonesNombre.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroNombreActual = boton.textContent.trim();
            scrollToCenter(boton, boton.parentElement);
            aplicarFiltros();
        });
    });
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

    window.info = function (pagoId) {
        const pago = pagosGlobal.find(p => p.id === pagoId);
        if (!pago) return;

        const contenido = document.querySelector('.anuncio-second .contenido');
        let registrationHTML;

        if (pago.tipo === 'generico' || pago.tipo === 'Acopio') {
            // Template para pagos genéricos
            registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Información</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="relleno verificar-registro">
                    <p class="normal">Información</p>
                    <div class="campo-vertical">
                        <div class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Nombre: </span>${pago.nombre_pago}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-user'></i> Beneficiario: </span>${pago.beneficiario}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${pago.fecha}</div>
                    </div>
    
                    <p class="normal">Detalles del pago</p>
                    <div class="campo-vertical">
                        <div class="detalle"><span class="concepto"><i class='bx bx-detail'></i> Concepto: </span></div>
                        <div class="detalle" style="padding-left:20px;width: 100%;">${pago.justificativos}</div>
                        <hr style="margin: 10px 0; opacity: 0.2;">
                        <div class="detalle"><span class="concepto"><i class='bx bx-dollar'></i> Monto Base: </span>Bs. ${pago.subtotal}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-minus-circle'></i> Descuento: </span>Bs. ${pago.descuento}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-plus-circle'></i> Aumento: </span>Bs. ${pago.aumento}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-dollar-circle'></i> Total: </span>Bs. ${pago.total}</div>
                        ${pago.observaciones ? `<div class="detalle"><span class="concepto"><i class='bx bx-comment-detail'></i> Observaciones: </span></div>
                           <div class="detalle" style="padding-left:20px;width: 100%;">${pago.observaciones}</div>` : ''}
                    </div>
    
                    <p class="normal">Información administrativa</p>
                    <div class="campo-vertical">
                        <div class="detalle"><span class="concepto"><i class='bx bx-user-check'></i> Registrado por: </span>${pago.pagado_por}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-check-circle'></i> Estado: </span>${pago.estado}</div>
                    </div>
                </div>
                    <div class="anuncio-botones">
                        ${pago.estado !== 'Anulado' ? ` <button class="btn-anular btn orange"><i class='bx bx-x-circle'></i> Anular</button>` : ''}
                        ${pago.estado === 'Pendiente' ? ` <button class="btn-pagar btn green"><i class='bx bx-dollar'></i> Pagar</button>` : ` <button class="btn-pagar btn blue"><i class='bx bx-show'></i> Ver pagos</button>`}
                    </div>
            `;
        } else {
            // Procesar justificativos para pagos normales (existente)
            const justificativosFormateados = pago.justificativos.split(';').map(j => {
                const [producto, valores] = j.split('(');
                const [envasado, etiquetado, sellado, cernido] = valores.replace(')', '').split(',');

                return {
                    producto,
                    envasado: parseFloat(envasado),
                    etiquetado: parseFloat(etiquetado),
                    sellado: parseFloat(sellado),
                    cernido: parseFloat(cernido),
                    total: parseFloat(envasado) + parseFloat(etiquetado) + parseFloat(sellado) + parseFloat(cernido)
                };
            });

            const totales = justificativosFormateados.reduce((acc, j) => {
                acc.envasado += j.envasado;
                acc.etiquetado += j.etiquetado;
                acc.sellado += j.sellado;
                acc.cernido += j.cernido;
                return acc;
            }, { envasado: 0, etiquetado: 0, sellado: 0, cernido: 0 });

            // Template para pagos normales (mantener el existente)
            registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Información</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno verificar-registro">
                <p class="normal">Información</p>
                <div class="campo-vertical">
                    <div class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Nombre: </span>${pago.nombre_pago}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-user'></i> Beneficiario: </span>${pago.beneficiario}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${pago.fecha}</div>
                </div>

                <p class="normal">Detalles del pago</p>
                <div class="campo-vertical">
                    <div class="detalle"><span class="concepto"><i class='bx bx-package'></i> Total Envasado: </span>Bs. ${totales.envasado.toFixed(2)}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-tag'></i> Total Etiquetado: </span>Bs. ${totales.etiquetado.toFixed(2)}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-purchase-tag'></i> Total Sellado: </span>Bs. ${totales.sellado.toFixed(2)}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-filter'></i> Total Cernido: </span>Bs. ${totales.cernido.toFixed(2)}</div>
                    <hr style="margin: 10px 0; opacity: 0.2;">
                    <div class="detalle"><span class="concepto"><i class='bx bx-dollar'></i> Subtotal: </span>Bs. ${pago.subtotal}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-minus-circle'></i> Descuento: </span>Bs. ${pago.descuento}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-plus-circle'></i> Aumento: </span>Bs. ${pago.aumento}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-dollar-circle'></i> Total: </span>Bs. ${pago.total}</div>
                    ${pago.observaciones ? `<div class="detalle"><span class="concepto"><i class='bx bx-comment-detail'></i> Observaciones: </span></div>
                        <div class="detalle" style="padding-left:20px;width: 100%;">${pago.observaciones}</div>
                        ` : ''}
                    
                </div>

                <p class="normal">Detalle de justificativos</p>
                <div class="tabla-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Envasado</th>
                                <th>Etiquetado</th>
                                <th>Sellado</th>
                                <th>Cernido</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${justificativosFormateados.map(j => `
                                <tr>
                                    <td>${j.producto}</td>
                                    <td>Bs. ${j.envasado.toFixed(2)}</td>
                                    <td>Bs. ${j.etiquetado.toFixed(2)}</td>
                                    <td>Bs. ${j.sellado.toFixed(2)}</td>
                                    <td>Bs. ${j.cernido.toFixed(2)}</td>
                                    <td><strong>Bs. ${j.total.toFixed(2)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <p class="normal">Información administrativa</p>
                <div class="campo-vertical">
                    <div class="detalle"><span class="concepto"><i class='bx bx-user-check'></i> Registrado por: </span>${pago.pagado_por}</div>
                </div>
            </div>
            <div class="anuncio-botones">
                ${pago.estado !== 'Anulado' ? ` <button class="btn-anular btn yellow"><i class='bx bx-x-circle'></i> Anular</button>` : ''}
                ${pago.estado === 'Pendiente' ? ` <button class="btn-pagar btn green"><i class='bx bx-dollar'></i> Pagar</button>` : ` <button class="btn-pagar btn blue"><i class='bx bx-show'></i> Ver pagos</button>`}
            </div>
        `;
        }

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        const pagarBtn = contenido.querySelector('.btn-pagar');
        const btnAnular = contenido.querySelector('.btn-anular');

        pagarBtn.addEventListener('click', () => realizarPago(pago));
        btnAnular.addEventListener('click', () => anular(pago));

        function anular(pago) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Anular pago</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno verificar-registro">
                    <p class="normal">Información</p>
                    <div class="campo-vertical">
                        <div class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Comprobante: </span>${pago.id}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-user'></i> Beneficiario: </span>${pago.beneficiario}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-dollar-circle'></i> Total: </span>Bs. ${pago.total}</div>
                    </div>
        
                    <p class="normal">Motivo de la anulación</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                </div>
                <div class="anuncio-botones">
                    <button class="btn-anular-pago btn red"><i class='bx bx-x-circle'></i> Anular pago</button>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            const btnAnularPago = contenido.querySelector('.btn-anular-pago');
            btnAnularPago.addEventListener('click', confirmarAnulacion);

            async function confirmarAnulacion() {
                const motivo = document.querySelector('.motivo').value.trim();

                if (!motivo) {
                    mostrarNotificacion({
                        message: 'Debe ingresar el motivo de la anulación',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                try {
                    mostrarCarga('.carga-procesar');
                    const response = await fetch(`/anular-pago/${pago.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerPagos();
                        info(pagoId);
                        mostrarNotificacion({
                            message: 'Pago anulado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Información',
                            usuarioInfo.nombre + ' anulo el registro de pago con el nombre de: ' + pago.nombre_pago + ' con el id: ' + pago.id + ' por el motivo de: ' + motivo)
                    } else {
                        throw new Error(data.error || 'Error al anular el pago');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al anular el pago',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            }
        }
        function realizarPago(pago) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            function redondearDecimalPersonalizado(valor) {
                const decimal = valor - Math.floor(valor);
                if (decimal < 0.5) {
                    return Math.floor(valor).toFixed(2);
                } else {
                    return Math.ceil(valor).toFixed(2);
                }
            }
            // Primero cargar los pagos parciales
            cargarPagosParciales(pago.id).then(datosPagos => {
                if (!datosPagos) return;
                const { pagosParciales, totalPagado, saldoPendiente } = datosPagos;
                const saldoPendienteOf = redondearDecimalPersonalizado(saldoPendiente);

                const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Realizar pago</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            <div class="relleno verificar-registro">
                <p class="normal">Información</p>
                <div class="campo-vertical">
                    <div class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Comprobante: </span>${pago.id}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-user'></i> Beneficiario: </span>${pago.beneficiario}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-dollar-circle'></i> Total a pagar: </span>Bs. ${pago.total}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-dollar-circle'></i> Total pagado: </span>Bs. ${totalPagado.toFixed(2)}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-dollar-circle'></i> Saldo pendiente: </span>Bs. ${saldoPendienteOf}</div>
                </div>

                ${saldoPendienteOf > 0 && pago.estado !== 'Anulado' ? `
                    <p class="normal">Detalles del pago</p>
                    <div class="entrada">
                        <i class='bx bx-dollar'></i>
                        <div class="input">
                            <p class="detalle">Cantidad a pagar</p>
                            <input class="cantidad_pago" type="number" step="0.01" min="0.01" max="${saldoPendiente}" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="observaciones" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                ` : ''}
                <p class="normal">Historial de pagos</p>
                ${pagosParciales.length > 0 ? `
                <div class="tabla-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Pagado por</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pagosParciales.map(p => `
                                <tr>
                                    <td>${p.fecha}</td>
                                    <td>Bs. ${parseFloat(p.cantidad_pagada).toFixed(2)}</td>
                                    <td>${p.pagado_por}</td>
                                    <td>${p.observaciones}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                 ` : ` <div class="no-hay"><i class='bx bx-dollar-circle'></i> <p>No hay pagos parciales registrados para este pago.</p></div>`}
            </div>
           
            ${saldoPendienteOf > 0 && pago.estado !== 'Anulado' ? `
                <div class="anuncio-botones">
                    <button class="btn-realizar-pago btn green">
                        <i class='bx bx-check-circle'></i> Realizar pago
                    </button>
                </div>
            ` : ''}
                `;

                contenido.innerHTML = registrationHTML;
                contenido.style.paddingBottom = '70px';
                if (pago.estado !== 'Anulado' && saldoPendiente !== 0) {
                    contenido.style.paddingBottom = '70px';
                }
                mostrarAnuncioTercer();

                // Solo agregar el evento si hay saldo pendiente
                if (saldoPendienteOf > 0) {
                    const btnRealizarPago = contenido.querySelector('.btn-realizar-pago');
                    btnRealizarPago.addEventListener('click', async () => {
                        const cantidad = parseFloat(document.querySelector('.cantidad_pago').value);
                        const observaciones = document.querySelector('.observaciones').value.trim();

                        if (!cantidad || cantidad <= 0 || cantidad > saldoPendienteOf) {
                            console.error('Cantidad inválida:', cantidad, 'Saldo pendiente:', saldoPendienteOf);
                            mostrarNotificacion({
                                message: 'Ingrese una cantidad válida',
                                type: 'warning',
                                duration: 3500
                            });
                            return;
                        }

                        if (!observaciones) {
                            mostrarNotificacion({
                                message: 'Ingrese las observaciones del pago',
                                type: 'warning',
                                duration: 3500
                            });
                            return;
                        }

                        try {
                            mostrarCarga('.carga-procesar');
                            const response = await fetch('/registrar-pago-parcial', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    pago_id: pago.id,
                                    pagado_por: usuarioInfo.nombre+' '+usuarioInfo.apellido,
                                    beneficiario: pago.beneficiario,
                                    cantidad_pagada: cantidad,
                                    observaciones
                                })
                            });

                            const data = await response.json();

                            if (data.success) {
                                await obtenerPagos();
                                info(pagoId);
                                cargarPagosParciales(pagoId);
                                mostrarNotificacion({
                                    message: 'Pago registrado correctamente',
                                    type: 'success',
                                    duration: 3000
                                });
                                registrarNotificacion(
                                    'Administración',
                                    'Información',
                                    usuarioInfo.nombre + ' realizo el pago de: ' + cantidad + ' a ' + pago.beneficiario)
                            } else {
                                throw new Error(data.error);
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            mostrarNotificacion({
                                message: error.message || 'Error al realizar el pago',
                                type: 'error',
                                duration: 3500
                            });
                        } finally {
                            ocultarCarga('.carga-procesar');
                        }
                    });
                }
            });
        }
    };
    btnNuevoPago.forEach(btn => {
        btn.addEventListener('click', nuevoPagoGenerico);
    })
    btnExcel.forEach(btn => {
        btn.addEventListener('click', () => exportarArchivos('pagos', registrosAExportar));
    })

    function nuevoPagoGenerico() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Nuevo Pago Genérico</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
                <form id="formNuevoPago" class="relleno">
                    <p class="normal">Información General</p>
                    <div class="entrada">
                        <i class='bx bx-purchase-tag'></i>
                        <div class="input">
                            <p class="detalle">Nombre del Pago</p>
                            <input type="text" name="nombre_pago" required>
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-user'></i>
                        <div class="input">
                            <p class="detalle">Beneficiario</p>
                            <input type="text" name="beneficiario" required placeholder=" ">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-envelope'></i>
                        <div class="input">
                            <p class="detalle">ID Beneficiario (Email)</p>
                            <input type="email" name="id_beneficiario" required placeholder=" ">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-user-check'></i>
                        <div class="input">
                            <p class="detalle">Registrado por</p>
                            <input type="text" name="pagado_por" value="${usuarioInfo.nombre} ${usuarioInfo.apellido}" readonly>
                        </div>
                    </div>
    
                    <p class="normal">Detalles del Pago</p>
                    <div class="entrada">
                        <i class='bx bx-detail'></i>
                        <div class="input">
                            <p class="detalle">Concepto del Pago</p>
                            <input type="text" name="justificativos" required>
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-dollar'></i>
                        <div class="input">
                            <p class="detalle">Monto Base</p>
                            <input type="number" name="subtotal" step="0.01" required placeholder=" " onchange="calcularTotal()">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-minus-circle'></i>
                        <div class="input">
                            <p class="detalle">Descuento</p>
                            <input type="number" name="descuento" step="0.01" value="0" placeholder=" " onchange="calcularTotal()">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-plus-circle'></i>
                        <div class="input">
                            <p class="detalle">Aumento</p>
                            <input type="number" name="aumento" step="0.01" value="0" placeholder=" " onchange="calcularTotal()">
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-dollar-circle'></i>
                        <div class="input">
                            <p class="detalle">Total a Pagar</p>
                            <input type="number" name="total" step="0.01" value="0" readonly>
                        </div>
                    </div>
    
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones </p>
                            <input type="text" name="observaciones" >
                        </div>
                    </div>
                </form>
            <div class="anuncio-botones">
                <button class="btn-guardar btn green">
                    <i class='bx bx-save'></i> Guardar Pago
                </button>
            </div>
        `;

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        // Función para calcular el total
        window.calcularTotal = function () {
            const subtotal = parseFloat(document.querySelector('input[name="subtotal"]').value) || 0;
            const descuento = parseFloat(document.querySelector('input[name="descuento"]').value) || 0;
            const aumento = parseFloat(document.querySelector('input[name="aumento"]').value) || 0;
            const total = subtotal - descuento + aumento;
            document.querySelector('input[name="total"]').value = total.toFixed(2);
        };

        // Evento para guardar el pago
        const btnGuardar = contenido.querySelector('.btn-guardar');
        btnGuardar.addEventListener('click', async () => {
            try {
                spinBoton(btnGuardar);
                const formData = new FormData(document.getElementById('formNuevoPago'));
                const data = Object.fromEntries(formData.entries());

                // Validaciones básicas
                if (!data.nombre_pago || !data.beneficiario || !data.id_beneficiario || !data.justificativos || !data.subtotal) {
                    throw new Error('Por favor complete todos los campos requeridos');
                }

                const response = await fetch('/registrar-pago', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...data,
                        subtotal: parseFloat(data.subtotal),
                        descuento: parseFloat(data.descuento),
                        aumento: parseFloat(data.aumento),
                        total: parseFloat(data.total),
                        tipo: 'generico' // Identificador para pagos genéricos
                    })
                });

                const result = await response.json();

                if (result.success) {
                    await obtenerPagos();
                    info(result.id);
                    mostrarNotificacion({
                        message: 'Pago registrado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                    registrarNotificacion(
                        'Administración',
                        'Información',
                        usuarioInfo.nombre + ' registro un nuevo pago pendiente generico')
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al registrar el pago',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                stopSpinBoton(btnGuardar);
            }
        });
    }
    aplicarFiltros();
}