let movimientos = [];
const DB_NAME = 'damabrava_db';
const MOVIMIENTOS_CAJA_DB = 'movimientos_caja';

async function obtenerMovimientosCaja() {
    try {
        const movimientosCache = await obtenerLocal(MOVIMIENTOS_CAJA_DB, DB_NAME);

        if (movimientosCache.length > 0) {
            movimientos = movimientosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
        }

        const response = await fetch('/obtener-movimientos-caja');
        const data = await response.json();

        if (data.success) {
            // Ordenar de más reciente a más antiguo por ID
            movimientos = data.movimientos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (movimientos.length === 0) {
                console.log('no hay registros');
                renderInitialHTML();
                updateHTMLWithData();
            }

            if (JSON.stringify(movimientosCache) !== JSON.stringify(movimientos)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(MOVIMIENTOS_CAJA_DB, DB_NAME);
                        const tx = db.transaction(MOVIMIENTOS_CAJA_DB, 'readwrite');
                        const store = tx.objectStore(MOVIMIENTOS_CAJA_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of movimientos) {
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
        console.error('Error al obtener movimientos caja:', error);
        return false;
    }
}


export async function mostrarCaja() {
    renderInitialHTML();
    mostrarAnuncio();

    const [movimientos] = await Promise.all([
        await obtenerMovimientosCaja(),
    ]);


}
function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Caja</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="tarjeta-credito-container">
                <div class="tarjeta-credito">
                    <div class="tarjeta-header">
                        <div class="chip"></div>
                        <div class="logo-banco">
                            <img src="/icons/icon.png" alt="logo-banco">
                        </div>
                    </div>
                    <div class="tarjeta-numero">
                        <span>TotalProd</span>
                    </div>
                    <div class="tarjeta-footer">
                        <div class="tarjeta-info">
                            <div class="tarjeta-nombre">
                                <span class="label">Nombre</span>
                                <span class="valor">DAMABRAVA</span>
                            </div>
                            <div class="tarjeta-fecha">
                                <span class="label">MOVIMIENTOS</span>
                                <span class="valor" id="total-movimientos">0</span>
                            </div>
                        </div>
                        <div class="tarjeta-saldo">
                            <span class="label">Saldo disponible</span>
                            <span class="valor" id="saldo-disponible">Bs. 0.00</span>
                        </div>
                    </div>
                </div>
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
                    <button class="nuevo-movimiento btn origin"><i class='bx bx-plus'></i> <span>Nuevo</span></button>
                    <button class="exportar-pdf btn red"><i class='bx bxs-file-pdf'></i> <span>Descargar</span></button>
                </div>
            </div>
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Ingresos</button>
                <button class="btn-filtro">Egresos</button>
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
            <button class="nuevo-movimiento btn origin"><i class='bx bx-plus'></i> <span>Nuevo</span></button>
            <button class="exportar-pdf btn red"><i class='bx bxs-file-pdf'></i> <span>Descargar</span></button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '70px';
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
function updateHTMLWithData() {
    const movimientosContainer = document.querySelector('.productos-container');
    const movimientosLimitados = movimientos.slice(0, 200);
    const movimientosHTML = movimientosLimitados.map(movimiento => `
        <div class="registro-item" data-id="${movimiento.id}">
            <div class="header">
                <i class='bx bx-money'></i>
                <div class="info-header">
                    <span class="id-flotante"><span>${movimiento.id}</span><span class="flotante-item ${movimiento.tipo === 'Ingreso' ? 'green' : 'red'}">${movimiento.tipo}</span></span>
                    <span class="detalle">${movimiento.nombre}</span>
                    <span class="pie">${movimiento.fecha}<span class="flotante-item blue">Bs. ${movimiento.monto}</span></span>
                </div>
            </div>
        </div>
    `).join('');

    const showMoreButton = movimientos.length > 250 ? `
        <div class="show-more-container" style="text-align: center; display: flex; gap: 5px; justify-content: center;align-items:center;width:100%;min-height:70px;height:100%">
            <button class="btn show-more" style="background-color: var(--primary-color); color: white; padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;width:100%;height:100%">
                <i class='bx bx-show' style="min-width:20px"></i> Mostrar +50
            </button>
            <button class="btn show-all" style="background-color: var(--primary-color); color: white; padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;width:100%;height:100%">
                <i class='bx bx-list-ul'style="min-width:20px"></i> Mostrar todos
            </button>
        </div>
    ` : '';

    movimientosContainer.innerHTML = movimientosHTML + showMoreButton;

    // Actualizar saldo y total de movimientos
    actualizarSaldo();

    eventosCaja();
}

// Función para calcular y actualizar el saldo disponible
function actualizarSaldo() {
    if (!movimientos || movimientos.length === 0) {
        document.getElementById('saldo-disponible').textContent = 'Bs. 0.00';
        document.getElementById('total-movimientos').textContent = '0';
        return;
    }

    let totalIngresos = 0;
    let totalEgresos = 0;

    // Calcular totales por tipo
    movimientos.forEach(movimiento => {
        const monto = parseFloat(movimiento.monto) || 0;

        if (movimiento.tipo === 'Ingreso') {
            totalIngresos += monto;
        } else if (movimiento.tipo === 'Egreso') {
            totalEgresos += monto;
        }
    });

    // Calcular saldo disponible
    const saldoDisponible = totalIngresos - totalEgresos;

    // Formatear el saldo con separadores de miles
    const saldoFormateado = saldoDisponible.toLocaleString('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Actualizar elementos en la UI
    const saldoElement = document.getElementById('saldo-disponible');
    const movimientosElement = document.getElementById('total-movimientos');

    if (saldoElement) {
        saldoElement.textContent = `Bs. ${saldoFormateado}`;

        // Cambiar color según el saldo
        if (saldoDisponible > 0) {
            saldoElement.style.color = 'var(--success)'; // Verde para saldo positivo
        } else if (saldoDisponible < 0) {
            saldoElement.style.color = 'var(--error)'; // Rojo para saldo negativo
        } else {
            saldoElement.style.color = 'gray'; // Gris para saldo cero
        }
    }

    if (movimientosElement) {
        movimientosElement.textContent = movimientos.length.toString();
    }

    console.log(`Saldo actualizado: Ingresos: Bs. ${totalIngresos.toFixed(2)}, Egresos: Bs. ${totalEgresos.toFixed(2)}, Saldo: Bs. ${saldoDisponible.toFixed(2)}`);
}

function eventosCaja() {
    const contenedor = document.querySelector('.anuncio .relleno');
    const agregarMovimiento = document.querySelectorAll('.nuevo-movimiento');
    const botonesTipo = document.querySelectorAll('.filtros-opciones .btn-filtro');

    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.search');
    const botonCalendario = document.querySelector('.btn-calendario');

    let filtroTipoActual = 'Todos';
    let filtroFechaInstance = null;


    function cargarMasRegistros() {
        const productosContainer = document.querySelector('.productos-container');
        const currentItems = document.querySelectorAll('.registro-item').length;
        const nextBatch = movimientos.slice(currentItems, currentItems + 50);

        if (nextBatch.length > 0) {
            const newItemsHTML = nextBatch.map(movimiento => `
                <div class="registro-item" data-id="${movimiento.id}">
                    <div class="header">
                        <i class='bx bx-money'></i>
                        <div class="info-header">
                            <span class="id-flotante"><span>${movimiento.id}</span><span class="flotante-item ${movimiento.tipo === 'Ingreso' ? 'green' : 'red'}">${movimiento.tipo}</span></span>
                            <span class="detalle">${movimiento.nombre}</span>
                            <span class="pie">${movimiento.fecha}<span class="flotante-item blue">Bs. ${movimiento.monto}</span></span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Remove the show more button
            const showMoreContainer = document.querySelector('.show-more-container');
            if (showMoreContainer) {
                showMoreContainer.remove();
            }

            // Add new items
            productosContainer.insertAdjacentHTML('beforeend', newItemsHTML);

            // Add show more button again if there are more records
            if (currentItems + nextBatch.length < movimientos.length) {
                productosContainer.insertAdjacentHTML('beforeend', `
                    <div class="show-more-container" style="text-align: center; display: flex; gap: 10px; justify-content: center;width:100%">
                        <button class="btn show-more" style="background-color: var(--primary-color); color: white; padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;width:100%;height:100%">
                            <i class='bx bx-show'></i> Mostrar +50
                        </button>
                        <button class="btn show-all" style="background-color: var(--primary-color); color: white; padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;width:100%;height:100%">
                            <i class='bx bx-list-ul'></i> Mostrar todos
                        </button>
                    </div>
                `);

                // Reattach event listeners to the new buttons
                document.querySelector('.show-more').addEventListener('click', cargarMasRegistros);
                document.querySelector('.show-all').addEventListener('click', cargarTodosLosRegistros);
                aplicarFiltros();
            }

            // Reattach event listeners to new items
            const newItems = document.querySelectorAll('.registro-item');
            newItems.forEach(item => {
                item.addEventListener('click', function () {
                    const registroId = this.dataset.id;
                    window.info(registroId);
                });
            });
        }
    }
    function cargarTodosLosRegistros() {
        const productosContainer = document.querySelector('.productos-container');
        const currentItems = document.querySelectorAll('.registro-item').length;
        const remainingRecords = movimientos.slice(currentItems);

        if (remainingRecords.length > 0) {
            const newItemsHTML = remainingRecords.map(movimiento => `
                <div class="registro-item" data-id="${movimiento.id}">
                    <div class="header">
                        <i class='bx bx-money'></i>
                        <div class="info-header">
                            <span class="id-flotante"><span>${movimiento.id}</span><span class="flotante-item ${movimiento.tipo === 'Ingreso' ? 'green' : 'red'}">${movimiento.tipo}</span></span>
                            <span class="detalle">${movimiento.nombre}</span>
                            <span class="pie">${movimiento.fecha}<span class="flotante-item blue">Bs. ${movimiento.monto}</span></span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Remove the buttons container
            const showMoreContainer = document.querySelector('.show-more-container');
            if (showMoreContainer) {
                showMoreContainer.remove();
            }

            // Add all remaining items
            productosContainer.insertAdjacentHTML('beforeend', newItemsHTML);
            aplicarFiltros();

            // Reattach event listeners to new items
            const newItems = document.querySelectorAll('.registro-item');
            newItems.forEach(item => {
                item.addEventListener('click', function () {
                    const registroId = this.dataset.id;
                    window.info(registroId);
                });
            });
        }
    }

    // Add event listeners to initial buttons
    const showMoreBtn = document.querySelector('.show-more');
    const showAllBtn = document.querySelector('.show-all');

    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', cargarMasRegistros);
    }

    if (showAllBtn) {
        showAllBtn.addEventListener('click', cargarTodosLosRegistros);
    }


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



    function aplicarFiltros() {
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');
        const items = document.querySelectorAll('.registro-item');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const movimientoData = movimientos.find(m => m.id === registro.dataset.id);
            if (!movimientoData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Lógica de filtrado existente
            if (filtroTipoActual && filtroTipoActual !== 'Todos') {
                if (filtroTipoActual === 'Ingreso') {
                    mostrar = movimientoData.tipo === 'Ingreso';
                } else if (filtroTipoActual === 'Egreso') {
                    mostrar = movimientoData.tipo === 'Egreso';
                }
            }


            if (mostrar && fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = movimientoData.fecha.split('/');
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
                    movimientoData.id,
                    movimientoData.nombre,
                    movimientoData.fecha,
                    movimientoData.monto,
                    movimientoData.tipo
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


    botonesTipo.forEach(boton => {
        if (boton.classList.contains('activado')) {
            filtroTipoActual = boton.dataset.user;
        }
        boton.addEventListener('click', () => {
            botonesTipo.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            if (boton.textContent.trim() === 'Ingresos') {
                filtroTipoActual = 'Ingreso';
            } else if (boton.textContent.trim() === 'Egresos') {
                filtroTipoActual = 'Egreso';
            } else {
                filtroTipoActual = 'Todos';
            }
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

    // Event listener para agregar nuevo movimiento
    agregarMovimiento.forEach(btn => {
        btn.addEventListener('click', () => {
            mostrarFormularioNuevoMovimiento();
        });
    });

    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });
    window.info = async function (registroId) {
        const registro = movimientos.find(r => r.id === registroId);
        if (!registro) return;


        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Información</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Detalles del registro</p>
                <div class="campo-vertical">
                    <div class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-money'></i> Monto: </span>Bs. ${registro.monto}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-money'></i> Tipo: </span>${registro.tipo}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-credit-card'></i> Forma de pago: </span>${registro.formaPago}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-money'></i> Detalle: </span>${registro.nombre}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-money'></i> Observaciones: </span>${registro.observaciones}</div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-editar btn blue" data-id="${registro.id}"><i class='bx bx-edit'></i>Editar</button>
                <button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i>Eliminar</button>
            </div>
            `;

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';




        mostrarAnuncioSecond();



        const btnEditar = contenido.querySelector('.btn-editar');
        btnEditar.addEventListener('click', () => editar(registro));

        const btnEliminar = contenido.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', () => eliminar(registro));



        function eliminar(registro) {

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Eliminar movimiento</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información del movimiento</p>
                <div class="campo-vertical">
                    <div class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Id: </span>${registro.id}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-money'></i> Monto: </span>${registro.monto}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-money'></i> Detalle: </span>${registro.nombre}</div>
                </div>
                <p class="normal">Motivo de la eliminación</p>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Motivo</p>
                        <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
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
                <button class="btn-eliminar-registro btn red"><i class="bx bx-trash"></i> Confirmar eliminación</button>
            </div>
        `;
            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            // Agregar evento al botón guardar
            const btnEliminar = contenido.querySelector('.btn-eliminar-registro');
            btnEliminar.addEventListener('click', confirmarEliminacion);

            async function confirmarEliminacion() {
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
                    const response = await fetch(`/eliminar-movimiento-caja/${registroId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerMovimientosCaja();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Movimiento eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Eliminación',
                            usuarioInfo.nombre + ' elimino el movimiento de caja: ' + registro.nombre + ' Id: ' + registro.id + ' su motivo fue: ' + motivo)
                    } else {
                        throw new Error(data.error || 'Error al eliminar el movimiento');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar el movimiento',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            }
        }
        function editar(registro) {

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Editar movimiento</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer');"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Información del movimiento</p>
                        <div class="entrada">
                            <i class='bx bx-cube'></i>
                            <div class="input">
                                <p class="detalle">Nombre o detalle</p>
                                <input class="nombre-movimiento" type="text" value="${registro.nombre}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                    <i class='bx bx-category'></i>
                    <div class="input">
                        <p class="detalle">Tipo</p>
                        <select class="tipo" required>
                            <option value="${registro.tipo}" selected>${registro.tipo}</option>
                            <option value="Ingreso">Ingreso</option>
                            <option value="Egreso">Egreso</option>
                        </select>
                    </div>
                </div>
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class="ri-scales-line"></i>
                                <div class="input">
                                    <p class="detalle">Monto</p>
                                    <input class="monto" type="number" value="${registro.monto}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-barcode'></i>
                                <div class="input">
                                    <p class="detalle">Forma de pago</p>
                                    <select class="forma-pago" required>
                                        <option value="${registro.formaPago}" selected>${registro.formaPago}</option>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Tarjeta">Tarjeta</option>
                                        <option value="Banco">Banco</option>
                                        <option value="QR">QR</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-comment-detail'></i>
                            <div class="input">
                                <p class="detalle">Observaciones</p>
                                <input class="observaciones" type="text" value="${registro.observaciones}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    <p class="normal">Motivo de la edición</p>
                        <div class="entrada">
                            <i class='bx bx-comment-detail'></i>
                            <div class="input">
                                <p class="detalle">Motivo</p>
                                <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="info-sistema">
                            <i class='bx bx-info-circle'></i>
                            <div class="detalle-info">
                                <p>Estás por editar un registro del sistema. Asegúrate de realizar los cambios correctamente, ya que podrían modificar información relacionada.</p>
                            </div>
                        </div>

                </div>
                <div class="anuncio-botones">
                    <button class="btn-editar-registro btn blue"><i class="bx bx-save"></i> Guardar cambios</button>
                </div>
            `;
            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            const nombreInput = document.querySelector('.entrada .nombre-movimiento');
            const tipoInput = document.querySelector('.entrada .tipo');
            const montoInput = document.querySelector('.entrada .monto');
            const formaPagoInput = document.querySelector('.entrada .forma-pago');
            const observacionesInput = document.querySelector('.entrada .observaciones');
            const motivoInput = document.querySelector('.entrada .motivo');


            const btnEditar = contenido.querySelector('.btn-editar-registro');
            btnEditar.addEventListener('click', confirmarEdicion);

            async function confirmarEdicion() {
                const idMovimiento = window.idMovimiento;
                const nombre = document.querySelector('.nombre-movimiento').value;
                const tipo = document.querySelector('.tipo').value;
                const monto = document.querySelector('.monto').value;
                const formaPago = document.querySelector('.forma-pago').value;
                const observaciones = document.querySelector('.observaciones').value;
                const motivo = document.querySelector('.motivo').value;
                if (!motivo) { // Solo el campo "Motivo" es obligatorio
                    mostrarNotificacion({
                        message: 'Debe ingresar el motivo de la edición',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                try {
                    mostrarCarga('.carga-procesar');
                    const response = await fetch(`/editar-movimiento-caja/${registroId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idMovimiento,
                            nombre,
                            tipo,
                            monto,
                            formaPago,
                            observaciones,
                            motivo
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerMovimientosCaja();
                        info(registroId);
                        mostrarNotificacion({
                            message: 'Movimiento actualizado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Edición',
                            usuarioInfo.nombre + ' edito el movimiento de caja: ' + registro.nombre + ' Id: ' + registro.id + ' su motivo fue: ' + motivo)
                    } else {
                        throw new Error(data.error || 'Error al actualizar el movimiento');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al actualizar el movimiento',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            }
        }
    }
    aplicarFiltros();
    function mostrarFormularioNuevoMovimiento() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const formHTML = `
            <div class="encabezado">
                <h1 class="titulo">Nuevo Movimiento</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información del movimiento</p>
                <div class="entrada">
                    <i class='bx bx-edit-alt'></i>
                    <div class="input">
                        <p class="detalle">Nombre o detalle</p>
                        <input class="nombre-movimiento" type="text" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-category'></i>
                    <div class="input">
                        <p class="detalle">Tipo</p>
                        <select class="tipo" required>
                            <option value=""></option>
                            <option value="Ingreso">Ingreso</option>
                            <option value="Egreso">Egreso</option>
                        </select>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-money'></i>
                    <div class="input">
                        <p class="detalle">Monto</p>
                        <input class="monto" type="number" step="0.01" min="0" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-credit-card'></i>
                    <div class="input">
                        <p class="detalle">Forma de pago</p>
                        <select class="forma-pago" required>
                            <option value=""></option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Banco">Banco</option>
                            <option value="QR">QR</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Observaciones</p>
                        <input class="observaciones" type="text" autocomplete="off" placeholder=" ">
                    </div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-registrar-movimiento btn origin"><i class='bx bx-save'></i> Registrar Movimiento</button>
            </div>
        `;

        contenido.innerHTML = formHTML;
        contenido.style.paddingBottom = '70px';

        setTimeout(() => {
            configuracionesEntrada();
        }, 100);

        mostrarAnuncioSecond();

        // Event listener para el botón de registrar
        const btnRegistrar = contenido.querySelector('.btn-registrar-movimiento');
        btnRegistrar.addEventListener('click', registrarMovimiento);
        async function registrarMovimiento() {
            const nombre = document.querySelector('.nombre-movimiento').value.trim();
            const tipo = document.querySelector('.tipo').value;
            const monto = document.querySelector('.monto').value;
            const formaPago = document.querySelector('.forma-pago').value;
            const observaciones = document.querySelector('.observaciones').value.trim();

            // Validaciones
            if (!nombre) {
                mostrarNotificacion({
                    message: 'Debe ingresar el nombre o detalle del movimiento',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            if (!tipo) {
                mostrarNotificacion({
                    message: 'Debe seleccionar el tipo de movimiento',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            if (!monto || parseFloat(monto) <= 0) {
                mostrarNotificacion({
                    message: 'Debe ingresar un monto válido mayor a 0',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }
            if (!formaPago) {
                mostrarNotificacion({
                    message: 'Debe seleccionar la forma de pago',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga('.carga-procesar');

                const response = await fetch('/registrar-movimiento-caja', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre,
                        tipo,
                        monto: parseFloat(monto),
                        formaPago,
                        observaciones: observaciones || 'Ninguna',
                    })
                });
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    // Cerrar el modal
                    cerrarAnuncioManual('anuncioSecond');

                    // Actualizar la lista de movimientos
                    await obtenerMovimientosCaja();

                    // Mostrar notificación de éxito
                    mostrarNotificacion({
                        message: 'Movimiento registrado exitosamente',
                        type: 'success',
                        duration: 3000
                    });

                    // Registrar notificación en el sistema
                    registrarNotificacion(
                        'Caja',
                        'Nuevo Movimiento',
                        `Se registró un ${tipo.toLowerCase()} de ${parseFloat(monto).toFixed(2)} Bs. por ${nombre}`
                    );

                } else {
                    throw new Error(data.error || 'Error al registrar el movimiento');
                }

            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al registrar el movimiento',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga('.carga-procesar');
            }
        }
    }
}