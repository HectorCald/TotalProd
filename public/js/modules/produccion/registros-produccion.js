let registrosProduccion = [];
let productosGlobal = [];

const DB_NAME = 'damabrava_db';
const MIS_REGISTROS_PRODUCCION_DB = 'mis_registros_produccion';
const PRODUCTO_ALM_DB = 'prductos_alm';


async function obtenerMisRegistros() {
    try {
        const registrosCache = await obtenerLocal(MIS_REGISTROS_PRODUCCION_DB, DB_NAME);
        // Si hay registros en caché, actualizar la UI inmediatamente
        if (registrosCache.length > 0) {
            registrosProduccion = registrosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
        }

        const response = await fetch('/obtener-mis-registros-produccion');
        const data = await response.json();

        if (data.success) {
            registrosProduccion = data.registros.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (registrosProduccion.length === 0) {
                console.log('no hay registros');
                renderInitialHTML();
                updateHTMLWithData();
            }

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(registrosCache) !== JSON.stringify(registrosProduccion)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();

                // Siempre actualizar el caché con los nuevos datos
                (async () => {
                    try {
                        const db = await initDB(MIS_REGISTROS_PRODUCCION_DB, DB_NAME);
                        const tx = db.transaction(MIS_REGISTROS_PRODUCCION_DB, 'readwrite');
                        const store = tx.objectStore(MIS_REGISTROS_PRODUCCION_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const registro of registrosProduccion) {
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
            return false;
        }
    } catch (error) {
        console.error('Error al obtener registros:', error);
        return false;
    }
}
async function obtenerProductos() {
    try {
        const productosCache = await obtenerLocal(PRODUCTO_ALM_DB, DB_NAME);

        if (productosCache.length > 0) {
            console.log('productoscache')
            productosGlobal = productosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }

        try {
            const response = await fetch('/obtener-productos');
            const data = await response.json();
            if (data.success) {
                productosGlobal = data.productos.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });
                if (JSON.stringify(productosCache) !== JSON.stringify(productosGlobal)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    renderInitialHTML();
                    updateHTMLWithData();
                    (async () => {
                        try {
                            const db = await initDB(PRODUCTO_ALM_DB, DB_NAME);
                            const tx = db.transaction(PRODUCTO_ALM_DB, 'readwrite');
                            const store = tx.objectStore(PRODUCTO_ALM_DB);

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
            throw error;
        }

    } catch (error) {
        console.error('Error al obtener productos:', error);
        return false;
    }
}


function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Mis registros</h1>
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
                    <button class="exportar-excel btn origin"><i class='bx bx-download'></i> <span>Descargar Excel</span></button>
                    <button class="nueva-produccion btn blue"><i class='bx bx-plus'></i> <span>Nuevo registro</span></button>
                </div>
            </div>
            
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Verificados</button>
                <button class="btn-filtro">Observados</button>
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
            <button class="exportar-excel btn origin"><i class='bx bx-download'></i> Descargar Excel</button>
            <button class="nueva-produccion btn blue"><i class='bx bx-plus'></i> Nuevo registro</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '70px';

    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
export async function mostrarMisRegistros() {
    renderInitialHTML();
    mostrarAnuncio();

    const [registrosProduccion, productos] = await Promise.all([
        obtenerProductos(),
        await obtenerMisRegistros()
    ]);
}
function updateHTMLWithData() {
    // Update productos
    const productosContainer = document.querySelector('.productos-container');
    const productosHTML = registrosProduccion.map(registro => `
        <div class="registro-item" data-id="${registro.id}">
            <div class="header">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id-flotante"><span>${registro.id}</span><span class="flotante-item ${registro.estado === 'Pendiente' ? 'red' : registro.estado === 'Verificado' ? 'green' : registro.estado === 'Ingresado' ? 'blue' : ''}">${registro.estado === 'Pendiente' ? 'Pendiente' : registro.estado === 'Verificado' ? 'Verificado' : registro.estado === 'Ingresado' ? 'Ingresado' : ''}</span></span>
                    <span class="detalle">${registro.producto} - ${registro.gramos}gr.</span>
                    <span class="pie">${registro.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosMisRegistros();
}


function eventosMisRegistros() {
    const btnExcel = document.querySelectorAll('.exportar-excel');
    const btnNueva = document.querySelectorAll('.nueva-produccion');
    const registrosAExportar = registrosProduccion;
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


    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });

    let filtroNombreActual = 'todos';
    let filtroFechaInstance = null;


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
    botonesEstado.forEach(boton => {
        if (boton.classList.contains('activado')) {
            filtroNombreActual = boton.textContent.trim().toLowerCase();
            aplicarFiltros();
        }
        boton.addEventListener('click', async () => {
            botonesEstado.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');

            const tipoFiltro = boton.textContent.trim().toLowerCase();

            if (tipoFiltro === 'pendientes') {
                filtroNombreActual = 'pendiente';
            }
            else if (tipoFiltro === 'verificados') {
                filtroNombreActual = 'verificado';
            }
            else if (tipoFiltro === 'todos') {
                filtroNombreActual = 'todos';
            }
            else if (tipoFiltro === 'observados') {
                filtroNombreActual = 'observado';
            }

            aplicarFiltros();
            await scrollToCenter(boton, boton.parentElement);
        });
    });
    function aplicarFiltros() {
        const filtroTipo = filtroNombreActual;
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = registrosProduccion.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Aplicar todos los filtros
            if (filtroTipo && filtroTipo !== 'todos') {
                if (filtroTipo === 'pendiente') {
                    mostrar = !registroData.fecha_verificacion;
                } else if (filtroTipo === 'verificado') {
                    mostrar = registroData.fecha_verificacion;
                } else if (filtroTipo === 'observado') {
                    mostrar = registroData.fecha_verificacion && registroData.observaciones !== 'Sin observaciones';
                }
            }

            if (mostrar && fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = registroData.fecha.split('/');
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];
                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }


            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.producto,
                    registroData.gramos?.toString(),
                    registroData.lote?.toString(),
                    registroData.fecha
                ].filter(Boolean).join(' ').toLowerCase();
                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        const registrosVisibles = registrosFiltrados.filter(r => r.mostrar).length;

        // Ocultar todos con una transición suave
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
        }, 200);
    }



    inputBusqueda.addEventListener('input', (e) => {
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });
    btnNueva.forEach(btn => {
        btn.addEventListener('click', mostrarFormularioProduccion);
    });
    window.info = async function (registroId) {
        const registro = registrosProduccion.find(r => r.id === registroId);
        if (!registro) return;


        const producto = productosGlobal.find(p => p.id === registro.idProducto);
        const cantidadPorGrupo = producto ? producto.cantidadxgrupo : 1;
        const numeroADividir = registro.fecha_verificacion ? registro.c_real : registro.envases_terminados;
        const tirasCompletas = Math.floor(numeroADividir / cantidadPorGrupo);
        const unidadesSueltas = numeroADividir % cantidadPorGrupo;
        const unidadesTira = producto ? (cantidadPorGrupo <= 1 ? `${tirasCompletas} und.` : `${tirasCompletas} tiras`) : 'N/A';


        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Información</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal">Detalles del registro</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</span>
            </div>

            <p class="normal">Detalles de producción</p>
            <div class="campo-vertical">
                <span class="detalle"><span class="concepto"><i class="bx bx-box"></i> Producto: </span>${registro.producto} - ${registro.gramos}gr.</span>
                <span class="detalle"><span class="concepto"><i class='bx bx-receipt'></i> Lote: </span>${registro.lote}</span>
                <span class="detalle"><span class="concepto"><i class='bx bx-cog'></i> Proceso: </span>${registro.proceso}</span>
                <span class="detalle"><span class="concepto"><i class='bx bx-bowl-hot'></i> Microondas: </span>${registro.microondas}</span>
                <span class="detalle"><span class="concepto"><i class='bx bx-check-shield'></i> Envases terminados: </span>${registro.envases_terminados}</span>
                <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha de vencimiento: </span>${registro.fecha_vencimiento}</span>
            </div>

            <p class="normal">Detalles de verificación</p>
            <div class="campo-vertical">
                <span class="detalle"><span class="concepto"><i class='bx bx-transfer'></i> Verificado:</span> ${registro.fecha_verificacion ? `${registro.c_real} Und.` : 'Pendiente'}</span>
                ${registro.fecha_verificacion ? `<span class="detalle"><span class="concepto"><i class='bx bx-calendar-check'></i> Fecha verificación:</span> ${registro.fecha_verificacion}</span>` : ''}
                ${registro.fecha_verificacion ? `<span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Cantidad</span> ${unidadesTira}</span>` : ''}
                ${registro.fecha_verificacion ? `<span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Sueltos:</span> ${unidadesSueltas} und.</span>` : ''}
                ${registro.observaciones ? `<span class="detalle"><span class="concepto"><i class='bx bx-comment-detail'></i>Observaciones: </span> ${registro.observaciones}</span>` : ''}
            </div>
        </div>
        ${tienePermiso('edicion') || tienePermiso('eliminacion') || tienePermiso('anulacion') ? `
        <div class="anuncio-botones">
            ${tienePermiso('edicion') && !registro.fecha_verificacion ? `<button class="btn-editar btn blue" data-id="${registro.id}"><i class='bx bx-edit'></i>Editar</button>` : ''}
            ${tienePermiso('eliminacion') && !registro.fecha_verificacion ? `<button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i>Eliminar</button>` : ''}
            ${registro.fecha_verificacion && tienePermiso('anulacion') ? `<button class="btn-anular btn yellow" data-id="${registro.id}"><i class='bx bx-x-circle'></i>Anular</button>` : ''}
        </div>` : ''}
        `;


        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';
        if (tienePermiso('edicion') || tienePermiso('eliminacion') || tienePermiso('anulacion')) {
            contenido.style.paddingBottom = '70px';
        }
        mostrarAnuncioSecond();
        if (tienePermiso('anulacion') && registro.fecha_verificacion) {
            const btnAnular = contenido.querySelector('.btn-anular');
            btnAnular.addEventListener('click', () => anular(registro));
        }

        if (tienePermiso('edicion') && !registro.fecha_verificacion) {
            const btnEditar = contenido.querySelector('.btn-editar');
            btnEditar.addEventListener('click', () => editar(registro));
        }
        if (tienePermiso('eliminacion') && !registro.fecha_verificacion) {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }



        function eliminar(registro) {

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Eliminar registro</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información básica</p>
                <div class="campo-vertical">
                    <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Id: </span>${registro.id}</span>
                    <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${registro.fecha}</span>
                    <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto} - ${registro.gramos}gr.</span>
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
                    const response = await fetch(`/eliminar-registro-produccion/${registroId}`, {
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
                        await obtenerMisRegistros();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Registro eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Eliminación',
                            usuarioInfo.nombre + ' elimino el registro de producción: ' + registro.producto + ' Id: ' + registro.id + ' su motivo fue: ' + motivo)
                    } else {
                        throw new Error(data.error || 'Error al eliminar el registro');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar el registro',
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
                    <h1 class="titulo">Editar registro</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer');"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Información basica</p>
                        <div class="entrada">
                            <i class='bx bx-cube'></i>
                            <div class="input">
                                <p class="detalle">Producto</p>
                                <input class="producto" type="text" value="${registro.producto}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="sugerencias" id="productos-list"></div>
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class="ri-scales-line"></i>
                                <div class="input">
                                    <p class="detalle">Gramaje</p>
                                    <input class="gramaje" type="number" value="${registro.gramos}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-barcode'></i>
                                <div class="input">
                                    <p class="detalle">Lote</p>
                                    <input class="lote" type="number" autocomplete="off" value="${registro.lote}" placeholder=" " required>
                                </div>
                            </div>
                        </div>
                        
                    <p class="normal">Información del proceso</p>
                        <div class="campo-horizontal">
                            <div class="entrada">
                                <i class='bx bx-cog'></i>
                                <div class="input">
                                    <p class="detalle">Proceso</p>
                                    <select class="select" required>
                                        <option value="${registro.proceso}" selected>${registro.proceso}</option>
                                        <option value="Seleccion">Selección</option>
                                        <option value="Cernido">Cernido</option>
                                        <option value="Ninguno">Ninguno</option>
                                    </select>
                                </div>
                            </div>
                            <div class="entrada">
                                <i class='bx bx-bowl-hot'></i>
                                <div class="input">
                                    <p class="detalle">Microondas</p>
                                    <input class="microondas" type="text" value="${registro.microondas}" autocomplete="off" placeholder=" " required>
                                </div>
                            </div>
                        </div>
                    <p class="normal">Información del acabado</p>
                        <div class="entrada">
                            <i class='bx bx-check-shield'></i>
                            <div class="input">
                                <p class="detalle">Terminados</p>
                                <input class="terminados" type="number" value="${registro.envases_terminados}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-calendar'></i>
                            <div class="input">
                                <p class="detalle">vencimiento</p>
                                <input class="vencimiento" type="month" value="${registro.fecha_vencimiento}" placeholder=" " required>
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

            const productoInput = document.querySelector('.entrada .producto');
            const sugerenciasList = document.querySelector('#productos-list');
            const gramajeInput = document.querySelector('.entrada .gramaje');

            function normalizarTexto(texto) {
                return texto
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
                    .replace(/[-\s]+/g, ""); // Eliminar guiones y espacios
            }
            productoInput.addEventListener('input', (e) => {
                const valor = normalizarTexto(e.target.value);

                sugerenciasList.innerHTML = '';

                if (valor) {
                    const sugerencias = productosGlobal.filter(p =>
                        normalizarTexto(p.producto).includes(valor)
                    ).slice(0, 5);

                    if (sugerencias.length) {
                        sugerenciasList.style.display = 'flex';
                        sugerencias.forEach(p => {
                            const div = document.createElement('div');
                            div.classList.add('item');
                            div.textContent = p.producto + ' ' + p.gramos + 'gr.';
                            div.onclick = () => {
                                productoInput.value = p.producto;
                                sugerenciasList.style.display = 'none';
                                gramajeInput.value = p.gramos;
                                window.idPro = p.id;
                                const event = new Event('focus');
                                gramajeInput.dispatchEvent(event);
                            };
                            sugerenciasList.appendChild(div);
                        });
                    }
                } else {
                    sugerenciasList.style.display = 'none';
                }
            });
            const btnEditar = contenido.querySelector('.btn-editar-registro');
            btnEditar.addEventListener('click', confirmarEdicion);

            async function confirmarEdicion() {
                const idProdducto = window.idPro;
                const producto = document.querySelector('.producto').value;
                const gramos = document.querySelector('.gramaje').value;
                const lote = document.querySelector('.lote').value;
                const proceso = document.querySelector('.select').value;
                const microondas = document.querySelector('.microondas').value;
                const envases_terminados = document.querySelector('.terminados').value;
                const fecha_vencimiento = document.querySelector('.vencimiento').value;
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
                    const response = await fetch(`/editar-registro-produccion/${registroId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idPro: idProdducto,
                            producto,
                            gramos,
                            lote,
                            proceso,
                            microondas,
                            envases_terminados,
                            fecha_vencimiento,
                            motivo
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        await obtenerMisRegistros();
                        info(registroId);
                        mostrarNotificacion({
                            message: 'Registro actualizado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Edición',
                            usuarioInfo.nombre + ' edito el registro de producción: ' + registro.producto + ' Id: ' + registro.id + ' su motivo fue: ' + motivo)
                    } else {
                        throw new Error(data.error || 'Error al actualizar el registro');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al actualizar el registro',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            }
        }
        function anular(registro) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Anular verificación</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Información del registro</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Producto: </span>${registro.producto} - ${registro.gramos}gr.</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-hash'></i> Cantidad verificada: </span>${registro.c_real}</span>
                    </div>

                    <p class="normal">Motivo de la anulación</p>
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
                            <p>Estás por anular verificación de un registro del sistema. Esta acción no lo eliminará, pero quitara la fecha y la cantidad verificada, esto prodria afectar al peso de dicho producto en almacen acopio.</p>
                        </div>
                    </div>

                </div>
                <div class="anuncio-botones">
                    <button class="btn-anular-verificacion btn red"><i class='bx bx-x-circle'></i> Anular verificación</button>
                </div>
            `;
            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            const btnAnularVerificacion = contenido.querySelector('.btn-anular-verificacion');
            btnAnularVerificacion.addEventListener('click', confirmarAnulacion);

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
                    const response = await fetch(`/anular-verificacion-produccion/${registro.id}`, {
                        method: 'PUT',
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
                        await obtenerMisRegistros();
                        info(registroId);
                        mostrarNotificacion({
                            message: 'Verificación anulada correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Información',
                            usuarioInfo.nombre + ' anulo el registro de producciòn: ' + registro.producto + ' Id: ' + registro.id + ' su motivo fue: ' + motivo)

                    } else {
                        throw new Error(data.error || 'Error al anular la verificación');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al anular la verificación',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            }
        }
    }
    btnExcel.forEach(btn => {
        btn.addEventListener('click', () => exportarArchivos('produccion', registrosAExportar));
    });
    aplicarFiltros();
}