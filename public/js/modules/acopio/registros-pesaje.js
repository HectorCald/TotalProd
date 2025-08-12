let registrosPesa = [];
const DB_NAME = 'damabrava_db';
const REGISTROS_PESAJE_DB = 'registros_pesaje';

async function obtenerRegistrosPesaje() {
    try {

        const registrosPesajeCache = await obtenerLocal(REGISTROS_PESAJE_DB, DB_NAME);

        if (registrosPesajeCache.length > 0) {
            registrosPesa = registrosPesajeCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
            console.log('actulizando desde el cache')
        }
        mostrarCargaDiscreta('Buscando nueva información...');
        const response = await fetch('/obtener-registros-pesaje');
        const data = await response.json();

        if (data.success) {
            registrosPesa = data.registros.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (registrosPesa.length === 0) {
                console.log('no hay registros');
                renderInitialHTML();
                updateHTMLWithData();
            }

            if (JSON.stringify(registrosPesa) !== JSON.stringify(registrosPesajeCache)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();
                setTimeout(() => {
                    ocultarCargaDiscreta();
                }, 1000);
                
                (async () => {
                    try {
                        const db = await initDB(REGISTROS_PESAJE_DB, DB_NAME);
                        const tx = db.transaction(REGISTROS_PESAJE_DB, 'readwrite');
                        const store = tx.objectStore(REGISTROS_PESAJE_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of registrosPesa) {
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
            else{
                setTimeout(() => {
                    ocultarCargaDiscreta();
                }, 1000);
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


export async function registrosPesajeAlmacen() {
    renderInitialHTML();
    mostrarAnuncio();

    const [obtnerRegistros] = await Promise.all([
        await obtenerRegistrosPesaje(),
    ]);
}
function renderInitialHTML() {
    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Registros pesaje</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno almacen-general">
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
                    <button class="exportar-excel btn origin"><i class='bx bx-download'></i> <span>Descargar registros</span></button>
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
            <button class="exportar-excel btn origin"><i class='bx bx-download'></i> Descargar registros</button>
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
    const productosHTML = registrosPesa.map(registro => `
        <div class="registro-item" data-id="${registro.id}">
            <div class="header">
                <i class='bx bx-package'></i>
                <div class="info-header">
                    <span class="id-flotante"><span>${registro.id}</span></span>
                    <span class="detalle">${registro.nombre}</span>
                    <span class="pie">${registro.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosRegistrosPesaje();
}


function eventosRegistrosPesaje() {
    const btnExcel = document.querySelectorAll('.exportar-excel');
    const registrosAExportar = registrosPesa;
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

    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });
    function aplicarFiltros() {

        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = registrosPesa.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };
            let mostrar = true;

            // Filtro de fechas
            if (mostrar && fechasSeleccionadas.length === 2) {
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
                    registroData.nombre,
                    registroData.fecha,
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


    inputBusqueda.addEventListener('input', () => {
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });

    window.info = function (registroId) {
        const registro = registrosPesa.find(r => r.id === registroId);
        if (!registro) return;

        const productos = (registro.productos || '').split(';');
        const idProductos = (registro.idProductos || '').split(';');
        const sistemaBruto = (registro.sistemaBruto || '').split(';');
        const sistemaPrima = (registro.sistemaPrima || '').split(';');
        const fisicoPrima = (registro.fisicoPrima || '').split(';');
        const fisicoBruto = (registro.fisicoBruto || '').split(';');
        const diferenciaPrima = (registro.diferenciaPrima || '').split(';');
        const diferenciaBruto = (registro.diferenciaBruto || '').split(';');

        const contenido = document.querySelector('.anuncio-second .contenido');
        const infoHTML = `
            <div class="encabezado">
                <h1 class="titulo">Información de Pesaje</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno verificar-registro">
                <p class="normal">Información básica</p>
                <div class="campo-vertical">
                    <span class="detalle"><span class="concepto"><i class='bx bx-hash'></i> ID:</span> ${registro.id}</span>
                    <span class="detalle"><span class="concepto"><i class='bx bx-label'></i> Nombre:</span> ${registro.nombre || 'Sin nombre'}</span>
                    <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha:</span> ${registro.fecha}</span>
                    <span class="detalle"><span class="concepto"><i class='bx bx-comment-detail'></i> Observaciones:</span> ${registro.observaciones || 'Sin observaciones'}</span>
                </div>
                <p class="normal">Productos pesados</p>
                ${productos.map((producto, index) => {
                const difPrima = parseFloat(diferenciaPrima[index]) || 0;
                const difBruto = parseFloat(diferenciaBruto[index]) || 0;
                const colorDiferenciaPrima = difPrima > 0 ? '#4CAF50' : difPrima < 0 ? '#f44336' : '#2196F3';
                const colorDiferenciaBruto = difBruto > 0 ? '#4CAF50' : difBruto < 0 ? '#f44336' : '#2196F3';
                return `
                        <div class="campo-vertical">
                            <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Producto:</span> ${producto}</span>
                            <div style="display: flex; flex-direction: column; margin-top: 10px; gap: 8px;">
                                <div style="display: flex; justify-content: space-between; gap: 10px; padding: 8px; background: rgb(46, 46, 46); border-radius: 5px;">
                                    <span class="detalle"><span class="concepto" style="color: orange;"><i class='bx bx-weight'></i> Peso Bruto:</span></span>
                                    <span class="detalle"><span class="concepto">Sistema: ${sistemaBruto[index] || '0'}Kg.</span></span>
                                    <span class="detalle"><span class="concepto">Físico: ${fisicoBruto[index] || '0'}Kg.</span></span>
                                    <span class="detalle" style="color: ${colorDiferenciaBruto}"><span class="concepto" style="color: ${colorDiferenciaBruto}">Dif: ${difBruto > 0 ? '+' : ''}${difBruto}Kg.</span></span>
                                </div>
                                <div style="display: flex; justify-content: space-between; gap: 10px; padding: 8px; background: rgb(46, 46, 46); border-radius: 5px;">
                                    <span class="detalle"><span class="concepto" style="color: var(--success);"><i class='bx bx-weight'></i> Peso Prima:</span></span>
                                    <span class="detalle"><span class="concepto">Sistema: ${sistemaPrima[index] || '0'}Kg.</span></span>
                                    <span class="detalle"><span class="concepto">Físico: ${fisicoPrima[index] || '0'}Kg.</span></span>
                                    <span class="detalle" style="color: ${colorDiferenciaPrima}"><span class="concepto" style="color: ${colorDiferenciaPrima}">Dif: ${difPrima > 0 ? '+' : ''}${difPrima}Kg.</span></span>
                                </div>
                            </div>
                        </div>
                    `;
            }).join('')}
            </div>
            <div class="anuncio-botones">
                ${tienePermiso('edicion') ? `<button class="btn-editar btn blue" data-id="${registro.id}"><i class='bx bx-edit'></i>Editar</button>` : ''}
                ${tienePermiso('eliminacion') ? `<button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i>Eliminar</button>` : ''}
                <button class="btn-sobre-escribir btn orange" data-id="${registro.id}"><i class='bx bx-revision'></i>Remplazar</button>
            </div>
        `;

        contenido.innerHTML = infoHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        if (tienePermiso('edicion')) {
            const btnEditar = contenido.querySelector('.btn-editar');
            btnEditar.addEventListener('click', () => editar(registro));
        }
        if (tienePermiso('eliminacion')) {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(registro));
        }

        const btnSobre = contenido.querySelector('.btn-sobre-escribir');
        btnSobre.addEventListener('click', () => sobreescribir(registro));


        function eliminar(registro) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const eliminarHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Eliminar Pesaje</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Información del pesaje a eliminar</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-hash'></i> ID:</span> ${registro.id}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-label'></i> Nombre:</span> ${registro.nombre || 'Sin nombre'}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha:</span> ${registro.fecha}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-comment-detail'></i> Observaciones:</span> ${registro.observaciones || 'Sin observaciones'}</span>
                    </div>
                    <p class="normal">Ingresa el motivo de la eliminación</p>
                    <div class="entrada">
                        <i class='bx bx-message-square-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo de eliminación</p>
                            <input type="text" class="motivo-eliminacion" placeholder=" " required>
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
                    <button id="confirmar-eliminacion" class="btn red"><i class='bx bx-trash'></i> Confirmar eliminación</button>
                </div>
            `;

            contenido.innerHTML = eliminarHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            document.getElementById('confirmar-eliminacion').addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-eliminacion').value.trim();
                if (!motivo) {
                    mostrarNotificacion({
                        message: 'Por favor, ingresa el motivo de eliminación',
                        type: 'warning',
                        duration: 3000
                    });
                    return;
                }

                try {
                    mostrarCarga('.carga-procesar');
                    const response = await fetch(`/eliminar-pesaje/${registro.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerRegistrosPesaje();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Registro eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Eliminación',
                            usuarioInfo.nombre + ' elimino el registro pesaje con el nombre de: ' + registro.nombre + ' con el id: ' + registro.id + ' por el motivo de: ' + motivo)
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
            });
        }
        function editar(registro) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const editarHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Editar Pesaje</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Información basica</p>
                    <div class="campo-vertical">
                        <span class="detalle"><span class="concepto"><i class='bx bx-hash'></i> ID:</span> ${registro.id}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha:</span> ${registro.fecha}</span>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-label'></i>
                        <div class="input">
                            <p class="detalle">Nombre del pesaje</p>
                            <input class="nombre-pesaje" type="text" value="${registro.nombre || ''}" required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="observaciones" type="text" value="${registro.observaciones || ''}" required>
                        </div>
                    </div>
                    <p class="normal">Igresa el motivo de la edición</p>
                    <div class="entrada">
                        <i class='bx bx-message-square-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo de edición</p>
                            <input type="text" class="motivo-edicion" placeholder=" " required>
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
                    <button id="guardar-edicion" class="btn blue"><i class='bx bx-save'></i> Guardar cambios</button>
                </div>
            `;

            contenido.innerHTML = editarHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            document.getElementById('guardar-edicion').addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-edicion').value.trim();
                const nombreEditado = document.querySelector('.nombre-pesaje').value.trim();
                const observacionesEditadas = document.querySelector('.observaciones').value.trim();

                if (!motivo) {
                    mostrarNotificacion({
                        message: 'Por favor, ingresa el motivo de edición',
                        type: 'warning',
                        duration: 3000
                    });
                    return;
                }

                if (!nombreEditado) {
                    mostrarNotificacion({
                        message: 'Por favor, ingresa el nombre del conteo',
                        type: 'warning',
                        duration: 3000
                    });
                    return;
                }

                try {
                    mostrarCarga('.carga-procesar');
                    const response = await fetch(`/editar-pesaje/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nombre: nombreEditado,
                            observaciones: observacionesEditadas,
                            motivo
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerRegistrosPesaje();
                        info(registroId);
                        mostrarNotificacion({
                            message: 'Registro actualizado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Edición',
                            usuarioInfo.nombre + ' edito el registro pesaje con el nombre de: ' + registro.nombre + ' con el id: ' + registro.id + ' por el motivo de: ' + motivo)
                    } else {
                        throw new Error(data.error || 'Error al actualizar el pesaje');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al actualizar el pesaje',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }
        async function sobreescribir(registro) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const [fecha, hora] = registro.fecha.split(',').map(item => item.trim());

            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Sobreescribir inventario de acopio</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Información del pesaje</p>
                    <div class="campo-horizontal">
                        <div class="campo-vertical">
                            <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Id: </span>${registro.id}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-calendar'></i> Fecha: </span>${fecha}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-time'></i> Hora: </span>${hora}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-user'></i> Operario: </span>${registro.nombre}</span>
                        </div>
                    </div>

                    <p class="normal">Motivo de la sobreescritura</p>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Motivo</p>
                            <input class="motivo-sobreescritura" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="info-sistema">
                        <i class='bx bx-info-circle'></i>
                        <div class="detalle-info">
                            <p>Estás por sobre escribir los pesos de prima y bruto en el almacén acopio con los pesos físicos de este registro. Se detectará el último lote de cada producto y se reemplazará con el peso físico, eliminando los lotes anteriores. Esta acción no se puede deshacer.</p>
                        </div>
                    </div>

                </div>
                <div class="anuncio-botones">
                    <button class="btn-confirmar-sobreescritura btn red"><i class='bx bx-edit'></i> Confirmar sobreescritura</button>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            const btnConfirmarSobreescritura = contenido.querySelector('.btn-confirmar-sobreescritura');
            btnConfirmarSobreescritura.addEventListener('click', async () => {
                const motivo = document.querySelector('.motivo-sobreescritura').value.trim();

                if (!motivo) {
                    mostrarNotificacion({
                        message: 'Debe ingresar el motivo de la sobreescritura',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                try {
                    mostrarCarga('.carga-procesar');
                    const response = await fetch(`/sobreescribir-inventario-acopio/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await mostrarAlmacenAcopio();
                        mostrarNotificacion({
                            message: 'Inventario de acopio actualizado correctamente con pesos físicos',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                        'Administración',
                        'Información',
                        usuarioInfo.nombre + ' sobre escribio el stock del almacen acopio en base al registro pesaje con el nombre de: '+registro.nombre+' con el id: '+registro.id+' por el motivo de: '+motivo)
                    } else {
                        throw new Error(data.error);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al sobreescribir el inventario de acopio',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }
    };
    btnExcel.forEach(btn => {
        btn.addEventListener('click', () => exportarArchivos('pesaje', registrosAExportar));
    })
    aplicarFiltros();
}