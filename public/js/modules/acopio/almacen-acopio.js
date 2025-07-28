let productos = [];
let etiquetasAcopio = [];

const DB_NAME = 'damabrava_db';
const PRODUCTOS_AC_DB = 'productos_acopio';
const ETIQUETAS_AC_DB = 'etiquetas_acopio';

async function obtenerEtiquetasAcopio() {
    try {

        const etiquetasAcopioCache = await obtenerLocal(ETIQUETAS_AC_DB, DB_NAME);

        if (etiquetasAcopioCache.length > 0) {
            etiquetasAcopio = etiquetasAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
        }


        const response = await fetch('/obtener-etiquetas-acopio');
        const data = await response.json();

        if (data.success) {
            etiquetasAcopio = data.etiquetas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(etiquetasAcopioCache) !== JSON.stringify(etiquetasAcopio)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(ETIQUETAS_AC_DB, DB_NAME);
                        const tx = db.transaction(ETIQUETAS_AC_DB, 'readwrite');
                        const store = tx.objectStore(ETIQUETAS_AC_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of etiquetasAcopio) {
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
        }
        else {
            console.log('no son diferentes')
        }
        return true;

    } catch (error) {
        console.error('Error al obtener etiquetas:', error);
        return false;
    }
}
async function obtenerAlmacenAcopio() {
    try {

        const productosAcopioCache = await obtenerLocal(PRODUCTOS_AC_DB, DB_NAME);

        if (productosAcopioCache.length > 0) {
            productos = productosAcopioCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
        }
        const response = await fetch('/obtener-productos-acopio');
        const data = await response.json();

        if (data.success) {
            productos = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (productos.length === 0) {
                console.log('no hay registros');
                renderInitialHTML();
                updateHTMLWithData();
            }

            if (JSON.stringify(productosAcopioCache) !== JSON.stringify(productos)) {
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


export async function mostrarAlmacenAcopio() {
    renderInitialHTML(); // Render initial HTML immediately
    mostrarAnuncio();

    // Load data in parallel
    const [etiquetasResult, almacenGeneral] = await Promise.all([
        obtenerEtiquetasAcopio(),
        await obtenerAlmacenAcopio(),
    ]);
}
function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Almacén Acopio</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="busqueda">
                <div class="entrada">
                    <i class='bx bx-search'></i>
                    <div class="input">
                        <p class="detalle">Buscar</p>
                        <input type="text" class="search" placeholder="">
                    </div>
                </div>
                ${tienePermiso('creacion') ? `
                <div class="acciones-grande">
                    <button class="btn-crear-producto btn origin"> <i class='bx bx-plus'></i> <span>Crear</span></button>
                    <button class="btn-etiquetas btn especial"><i class='bx bx-purchase-tag'></i> <span>Etiquetas</span></button>
                    <button class="exportar-pdf btn red"><i class='bx bxs-file-pdf'></i> <span>PDF</span></button>
                </div>
                ` : ''}
            </div>
            
            <div class="filtros-opciones etiquetas-filter">
                <button class="btn-filtro todos activado">Todos</button>
                ${Array(5).fill().map(() => `
                    <div class="skeleton skeleton-etiqueta"></div>
                `).join('')}
            </div>
            <div class="filtros-opciones cantidad-filter">
                <button class="btn-filtro" title="Mayor a menor"><i class='bx bx-sort-down'></i></button>
                <button class="btn-filtro" title="Menor a mayor"><i class='bx bx-sort-up'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-a-z'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-z-a'></i></button>
                <button class="btn-filtro activado" title="Bruto">Bruto</button>
                <button class="btn-filtro" title="Prima">Prima</button>
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
                <i class='bx bx-package' style="font-size: 50px;opacity:0.5"></i>
                <p style="text-align: center; color: #555;">¡Ups!, No se encontraron productos segun tu busqueda o filtrado.</p>
            </div>
        </div>
        ${tienePermiso('creacion') ? `
        <div class="anuncio-botones">
            <button class="btn-crear-producto btn origin"> <i class='bx bx-plus'></i> Crear</button>
            <button class="btn-etiquetas btn especial"><i class='bx bx-purchase-tag'></i>  Etiquetas</button>
            <button class="exportar-pdf btn red"><i class='bx bxs-file-pdf'></i> <span>PDF</span></button>
        </div>
        ` : ''}
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '10px';
    if (tienePermiso('creacion')) {
        contenido.style.paddingBottom = '70px';
    }
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
function updateHTMLWithData() {
    const etiquetasFilter = document.querySelector('.etiquetas-filter');
    const skeletons = etiquetasFilter.querySelectorAll('.skeleton');
    skeletons.forEach(s => s.remove());

    const etiquetasExistentes = etiquetasFilter.querySelectorAll('.btn-filtro:not(.todos)');
    etiquetasExistentes.forEach(e => e.remove());

    const etiquetasHTML = etiquetasAcopio.map(etiqueta => `
        <button class="btn-filtro">${etiqueta.etiqueta}</button>
    `).join('');
    etiquetasFilter.insertAdjacentHTML('beforeend', etiquetasHTML);

    // Update productos
    const productosContainer = document.querySelector('.productos-container');
        const productosHTML = productos.map(producto => {
            // Calcular total bruto
            const totalBruto = producto.bruto.split(';')
                .filter(lote => lote.trim())
                .reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);

            return `
                <div class="registro-item" data-id="${producto.id}">
                    <div class="header">
                        <i class='bx bx-package'></i>
                        <div class="info-header">
                            <span class="id-flotante"><span>${producto.id}</span><span class="flotante-item orange stock">${totalBruto.toFixed(2)} Kg.</span></span>
                            <span class="detalle">${producto.producto}</span>
                            <span class="pie">${producto.etiquetas ? producto.etiquetas.split(';').join(' • ') : ''}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        productosContainer.innerHTML = productosHTML;
    eventosAlmacenAcopio();
}


function eventosAlmacenAcopio() {
    const botonesEtiquetas = document.querySelectorAll('.filtros-opciones.etiquetas-filter .btn-filtro');
    const botonesCantidad = document.querySelectorAll('.filtros-opciones.cantidad-filter .btn-filtro');
    const inputBusqueda = document.querySelector('.search');
    const btnPDF = document.querySelectorAll('.exportar-pdf');
    const registrosAExportar = productos;

    const btnCrearProducto = document.querySelectorAll('.btn-crear-producto');
    const btnEtiquetas = document.querySelectorAll('.btn-etiquetas');

    if (tienePermiso('creacion')) {
        btnCrearProducto.forEach(btn => {
            btn.addEventListener('click', crearProducto);
        })
        btnEtiquetas.forEach(btn => {
            btn.addEventListener('click', gestionarEtiquetas);
        })
    }
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

    const items = document.querySelectorAll('.registro-item');

    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });

    let pesoMostrado = 'bruto';
    let filtroNombreActual = localStorage.getItem('filtroEtiquetaAcopio') || 'Todos';

    botonesCantidad.forEach((boton, index) => {
        if(boton.classList.contains('activado')){
            pesoMostrado = boton.textContent.trim();
            aplicarFiltros();
        }
        boton.addEventListener('click', () => {
            // Si es botón de peso (Bruto/Prima)
            if (index === 4 || index === 5) {
                // Desactivar solo los botones de peso
                botonesCantidad[4].classList.remove('activado');
                botonesCantidad[5].classList.remove('activado');
                boton.classList.add('activado');

                pesoMostrado = index === 4 ? 'bruto' : 'prima';
                actualizarPesoMostrado();
            } else {
                // Para botones de ordenamiento (0-3)
                const botonesOrdenamiento = Array.from(botonesCantidad).slice(0, 4);
                botonesOrdenamiento.forEach(b => b.classList.remove('activado'));
                boton.classList.add('activado');
            }

            aplicarFiltros();
        });
    });
    function actualizarPesoMostrado() {
        const registros = document.querySelectorAll('.registro-item');
        registros.forEach(registro => {
            const producto = productos.find(p => p.id === registro.dataset.id);
            if (producto) {
                const total = pesoMostrado === 'bruto'
                    ? producto.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0)
                    : producto.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);

                const stockSpan = registro.querySelector('.stock');
                if (stockSpan) {
                    stockSpan.textContent = `${total.toFixed(2)} Kg.`;
                }
            }
        });
    }
    botonesEtiquetas.forEach(boton => {
        boton.classList.remove('activado');
        if (boton.textContent.trim() === filtroNombreActual) {
            boton.classList.add('activado');
        }
        boton.addEventListener('click', () => {
            botonesEtiquetas.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroNombreActual = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
            localStorage.setItem('filtroEtiquetaAcopio', filtroNombreActual);
        });
    });
    


    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });
    inputBusqueda.addEventListener('input', (e) => {
        aplicarFiltros();
    });

    function aplicarFiltros() {
        const registros = document.querySelectorAll('.registro-item');
        const busqueda = normalizarTexto(inputBusqueda.value);
        const botonCantidadActivo = document.querySelector('.filtros-opciones.cantidad-filter .btn-filtro.activado');

        // Ocultar todos con animación
        registros.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        setTimeout(() => {
            registros.forEach(registro => registro.style.display = 'none');

            // Filtrar y ordenar
            const productosFiltrados = Array.from(registros).filter(registro => {
                const producto = productos.find(p => p.id === registro.dataset.id);
                if (!producto) return false;

                const etiquetasProducto = producto.etiquetas ? producto.etiquetas.split(';').map(e => e.trim()) : [];
                let mostrar = true;

                if (filtroNombreActual !== 'Todos') {
                    mostrar = etiquetasProducto.includes(filtroNombreActual);
                }

                if (busqueda) {
                    mostrar = mostrar && (
                        normalizarTexto(producto.producto).includes(busqueda) ||
                        normalizarTexto(producto.id).includes(busqueda) ||
                        normalizarTexto(producto.etiquetas || '').includes(busqueda)
                    );
                }

                return mostrar;
            });

            // Ordenamiento
            if (botonCantidadActivo) {
                const index = Array.from(botonesCantidad).indexOf(botonCantidadActivo);
                switch (index) {
                    case 0: // Mayor a menor
                        productosFiltrados.sort((a, b) => parseFloat(b.querySelector('.stock').textContent) - parseFloat(a.querySelector('.stock').textContent));
                        break;
                    case 1: // Menor a mayor
                        productosFiltrados.sort((a, b) => parseFloat(a.querySelector('.stock').textContent) - parseFloat(b.querySelector('.stock').textContent));
                        break;
                    case 2: // A-Z
                        productosFiltrados.sort((a, b) => a.querySelector('.detalle').textContent.localeCompare(b.querySelector('.detalle').textContent));
                        break;
                    case 3: // Z-A
                        productosFiltrados.sort((a, b) => b.querySelector('.detalle').textContent.localeCompare(a.querySelector('.detalle').textContent));
                        break;
                }
            }

            const contenedor = document.querySelector('.productos-container');
            productosFiltrados.forEach(registro => {
                registro.style.display = 'flex';
                contenedor.appendChild(registro);
                setTimeout(() => {
                    registro.style.opacity = '1';
                    registro.style.transform = 'translateY(0)';
                }, 50);
            });

            // Mensaje de no encontrado
            const mensajeNoEncontrado = document.querySelector('.no-encontrado');
            mensajeNoEncontrado.style.display = productosFiltrados.length === 0 ? 'block' : 'none';
        }, 200);
    }

    window.info = function (registroId) {
        const producto = productos.find(r => r.id === registroId);
        if (!producto) return;

        // Process multiple bruto lots
        const lotesFormateadosBruto = producto.bruto.split(';')
            .filter(lote => lote.trim())
            .map(lote => {
                const [peso, numeroLote] = lote.split('-');
                return `<span class="valor">
                    <strong><i class='bx bx-package'></i> Lote ${numeroLote}: </strong>${parseFloat(peso).toFixed(2)} Kg.
                </span>`;
            })
            .join('');

        // Process multiple prima lots
        const lotesPrimaFormateados = producto.prima.split(';')
            .filter(lote => lote.trim())
            .map(lote => {
                const [peso, numeroLote] = lote.split('-');
                return `<span class="valor">
                    <strong><i class='bx bx-package'></i> Lote ${numeroLote}: </strong>${parseFloat(peso).toFixed(2)} Kg.
                </span>`;
            })
            .join('');

        // Calculate totals
        const totalBruto = producto.bruto.split(';')
            .reduce((total, lote) => total + parseFloat(lote.split('-')[0]), 0);

        const totalPrima = producto.prima.split(';')
            .reduce((total, lote) => total + parseFloat(lote.split('-')[0]), 0);

        const etiquetasFormateadas = producto.etiquetas.split(';')
            .filter(etiqueta => etiqueta.trim())
            .map(etiqueta => `<span class="valor"><strong><i class='bx bx-tag'></i> ${etiqueta}</span>`)
            .join('');

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">${producto.producto}</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond');"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información básica</p>
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${producto.id}</span>
                    <span class="nombre"><strong><i class='bx bx-cube'></i> Producto: </strong>${producto.producto}</span>
                </div>
    
                <p class="normal">Peso Bruto</p>
                <div class="campo-vertical">
                    ${lotesFormateadosBruto}
                    <span class="valor total">
                        <strong><i class='bx bx-calculator'></i> Total Bruto: </strong>${totalBruto.toFixed(2)} Kg.
                    </span>
                </div>
    
                <p class="normal">Peso Prima</p>
                <div class="campo-vertical">
                    ${lotesPrimaFormateados}
                    <span class="valor total">
                        <strong><i class='bx bx-calculator'></i> Total Prima: </strong>${totalPrima.toFixed(2)} Kg.
                    </span>
                </div>
    
                <p class="normal"><Etiquetas</p>
                <div class="campo-vertical">
                    ${etiquetasFormateadas}
                </div>
            </div>
            ${tienePermiso('edicion') || tienePermiso('eliminacion') ? `
            <div class="anuncio-botones">
            ${tienePermiso('edicion') ? `<button class="btn-editar btn blue" data-id="${producto.id}"><i class='bx bx-edit'></i>Editar</button>` : ''}
            ${tienePermiso('eliminacion') ? `<button class="btn-eliminar btn red" data-id="${producto.id}"><i class="bx bx-trash"></i>Eliminar</button>` : ''}
            </div>` : ''}
            `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        if (tienePermiso('edicion') || tienePermiso('eliminacion')) {
            contenido.style.paddingBottom = '70px';
        }
        mostrarAnuncioSecond();



        if (tienePermiso('edicion')) {
            const btnEditar = contenido.querySelector('.btn-editar');
            btnEditar.addEventListener('click', () => editar(producto));
        }
        if (tienePermiso('eliminacion')) {
            const btnEliminar = contenido.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminar(producto));
        }

        function eliminar(producto) {

            // Process multiple bruto lots
            const lotesFormateadosBruto = producto.bruto.split(';')
                .filter(lote => lote.trim())
                .map(lote => {
                    const [peso, numeroLote] = lote.split('-');
                    return `<span class="valor">
                        <strong><i class='bx bx-package'></i> Lote ${numeroLote}: </strong>${parseFloat(peso).toFixed(2)} Kg.
                    </span>`;
                })
                .join('');

            // Process multiple prima lots
            const lotesPrimaFormateados = producto.prima.split(';')
                .filter(lote => lote.trim())
                .map(lote => {
                    const [peso, numeroLote] = lote.split('-');
                    return `<span class="valor">
                        <strong><i class='bx bx-package'></i> Lote ${numeroLote}: </strong>${parseFloat(peso).toFixed(2)} Kg.
                    </span>`;
                })
                .join('');

            // Calculate totals
            const totalBruto = producto.bruto.split(';')
                .reduce((total, lote) => total + parseFloat(lote.split('-')[0]), 0);

            const totalPrima = producto.prima.split(';')
                .reduce((total, lote) => total + parseFloat(lote.split('-')[0]), 0);

            const etiquetasFormateadas = producto.etiquetas.split(';')
                .filter(etiqueta => etiqueta.trim())
                .map(etiqueta => `<span class="valor"><strong><i class='bx bx-tag'></i> ${etiqueta}</span>`)
                .join('');

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Eliminar prodcuto</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer');"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Información básica</p>
                    <div class="campo-vertical">
                        <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${producto.id}</span>
                        <span class="nombre"><strong><i class='bx bx-cube'></i> Producto: </strong>${producto.producto}</span>
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
                            <p>Vas a eliminar un producto del sistema. Esta acción no se puede deshacer y podría afectar a varios registros relacionados. Asegúrate de que deseas continuar.</p>
                        </div>
                    </div>

                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-eliminar-producto btn red"><i class="bx bx-trash"></i> Confirmar eliminación</button>
            </div>
        `;
            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();

            // Agregar evento al botón guardar
            const btnEliminarProducto = contenido.querySelector('.btn-eliminar-producto');
            btnEliminarProducto.addEventListener('click', confirmarEliminacionProducto);

            async function confirmarEliminacionProducto() {
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
                    spinBoton(btnEliminarProducto);
                    const response = await fetch(`/eliminar-producto-acopio/${registroId}`, {
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
                        await obtenerAlmacenAcopio();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Producto eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Eliminación',
                            usuarioInfo.nombre + ' elimino el producto ' + producto.producto + ' Id: ' + producto.id + ' su motivo fue: ' + motivo)
                    } else {
                        throw new Error(data.error || 'Error al eliminar el producto');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar el producto',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    stopSpinBoton(btnEliminarProducto);
                }
            }
        }
        function editar(producto) {

            // Process bruto lots
            const lotesBrutoHTML = producto.bruto.split(';')
                .map((lote, index) => {
                    const [peso, numeroLote] = lote.split('-');
                    return `
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Peso Bruto</p>
                                <input class="peso-bruto" data-lote="${numeroLote}" type="number" value="${peso}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-hash'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote-bruto" data-old-lote="${numeroLote}" type="number" value="${numeroLote}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                </div>`;
                }).join('');

            // Process prima lots
            const lotesPrimaHTML = producto.prima.split(';')
                .map((lote, index) => {
                    const [peso, numeroLote] = lote.split('-');
                    return `
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-package'></i>
                            <div class="input">
                                <p class="detalle">Peso Prima</p>
                                <input class="peso-prima" data-lote="${numeroLote}" type="number" value="${peso}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-hash'></i>
                            <div class="input">
                                <p class="detalle">Lote</p>
                                <input class="lote-prima" data-old-lote="${numeroLote}" type="number" value="${numeroLote}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    </div>`;
                }).join('');

            // Process current tags
            const etiquetasProducto = producto.etiquetas.split(';').filter(e => e.trim());
            const etiquetasHTML = etiquetasProducto.map(etiqueta => `
            <div class="etiqueta-item" data-valor="${etiqueta}">
                <i class='bx bx-purchase-tag'></i>
                <span>${etiqueta}</span>
                <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
            </div>
        `).join('');

            // Available tags (excluding selected ones)
            const etiquetasDisponibles = etiquetasAcopio
                .map(e => e.etiqueta)
                .filter(e => !etiquetasProducto.includes(e));

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Editar producto</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer');"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información básica</p>
                <div class="entrada">
                    <i class='bx bx-cube'></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <input class="producto" type="text" value="${producto.producto}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
    
                <p class="normal">Peso Bruto</p>
                ${lotesBrutoHTML}
    
                <p class="normal">Peso Prima</p>
                ${lotesPrimaHTML}
    
                <p class="normal">Etiquetas</p>
                <div class="etiquetas-container">
                    <div class="etiquetas-actuales">
                        ${etiquetasHTML}
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-purchase-tag'></i>
                    <div class="input">
                        <p class="detalle">Selecciona nueva etiqueta</p>
                        <select class="select-etiqueta" required>
                            ${etiquetasDisponibles.map(etiqueta =>
                `<option value="${etiqueta}">${etiqueta}</option>`
            ).join('')}
                        </select>
                        <button type="button" class="btn-agregar-etiqueta"><i class='bx bx-plus'></i></button>
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
                        <p>Estás por editar un registro del sistema. Asegúrate de realizar los cambios correctamente, ya que podrían modificar información relacionada con regsitros ya existentes.</p>
                    </div>
                </div>

            </div>
            <div class="anuncio-botones">
                <button class="btn-editar-producto btn blue"><i class="bx bx-save"></i> Guardar cambios</button>
            </div>
        `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';

            // Event handlers for tags
            const btnAgregarEtiqueta = contenido.querySelector('.btn-agregar-etiqueta');
            const selectEtiqueta = contenido.querySelector('.select-etiqueta');
            const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');

            btnAgregarEtiqueta.addEventListener('click', () => {
                const etiquetaSeleccionada = selectEtiqueta.value;
                if (etiquetaSeleccionada) {
                    const nuevaEtiqueta = document.createElement('div');
                    nuevaEtiqueta.className = 'etiqueta-item';
                    nuevaEtiqueta.dataset.valor = etiquetaSeleccionada;
                    nuevaEtiqueta.innerHTML = `
                    <i class='bx bx-purchase-tag'></i>
                    <span>${etiquetaSeleccionada}</span>
                    <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
                `;
                    etiquetasActuales.appendChild(nuevaEtiqueta);
                    selectEtiqueta.querySelector(`option[value="${etiquetaSeleccionada}"]`).remove();
                    selectEtiqueta.value = '';
                }
            });

            etiquetasActuales.addEventListener('click', (e) => {
                if (e.target.closest('.btn-quitar-etiqueta')) {
                    const etiquetaItem = e.target.closest('.etiqueta-item');
                    const valorEtiqueta = etiquetaItem.dataset.valor;
                    const option = document.createElement('option');
                    option.value = valorEtiqueta;
                    option.textContent = valorEtiqueta;
                    selectEtiqueta.appendChild(option);
                    etiquetaItem.remove();
                }
            });

            mostrarAnuncioTercer();

            // Add event to save button
            const btnEditarProducto = contenido.querySelector('.btn-editar-producto');
            btnEditarProducto.addEventListener('click', confirmarEdicionProducto);

            async function confirmarEdicionProducto() {
                try {
                    const productoNombre = document.querySelector('.producto').value.trim();
                    const motivo = document.querySelector('.motivo').value.trim();

                    // Get bruto lots
                    const brutoLotes = Array.from(document.querySelectorAll('.peso-bruto'))
                        .map((input, index) => {
                            const lote = document.querySelectorAll('.lote-bruto')[index].value;
                            return `${input.value}-${lote}`;
                        }).join(';');

                    // Get prima lots
                    const primaLotes = Array.from(document.querySelectorAll('.peso-prima'))
                        .map((input, index) => {
                            const lote = document.querySelectorAll('.lote-prima')[index].value;
                            return `${input.value}-${lote}`;
                        }).join(';');

                    // Get selected tags
                    const etiquetasSeleccionadas = Array.from(document.querySelectorAll('.etiqueta-item'))
                        .map(item => item.dataset.valor)
                        .join(';');

                    if (!motivo) {
                        mostrarNotificacion({
                            message: 'Ingresa el motivo de la edición',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }
                    spinBoton(btnEditarProducto);

                    const response = await fetch(`/editar-producto-acopio/${registroId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            producto: productoNombre,
                            bruto: brutoLotes,
                            prima: primaLotes,
                            etiquetas: etiquetasSeleccionadas,
                            motivo
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await obtenerAlmacenAcopio();
                        info(registroId)
                        mostrarNotificacion({
                            message: 'Producto actualizado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Edición',
                            usuarioInfo.nombre + ' edito el producto ' + producto.producto + ' su motivo fue: ' + motivo)
                    } else {
                        throw new Error(data.error || 'Error al actualizar el producto');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al procesar la operación',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    stopSpinBoton(btnEditarProducto);
                }
            }
        }
    }
    function crearProducto() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Nuevo producto</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal">Información básica</p>
            <div class="entrada">
                <i class='bx bx-cube'></i>
                <div class="input">
                    <p class="detalle">Producto</p>
                    <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                </div>
            </div>

            <p class="normal">Peso Bruto</p>
            <div class="campo-horizontal">
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Peso Bruto</p>
                        <input class="peso-bruto" type="number" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-hash'></i>
                    <div class="input">
                        <p class="detalle">Lote</p>
                        <input class="lote-bruto" type="number" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
            </div>

            <p class="normal">Peso Prima</p>
           
           <div class="campo-horizontal">
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Peso Prima</p>
                        <input class="peso-prima" type="number" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-hash'></i>
                    <div class="input">
                        <p class="detalle">Lote</p>
                        <input class="lote-prima" type="number" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
           </div>

            <p class="normal">Etiquetas</p>
            <div class="etiquetas-container">
                <div class="etiquetas-actuales">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-purchase-tag'></i>
                <div class="input">
                    <p class="detalle">Selecciona nueva etiqueta</p>
                    <select class="select-etiqueta" required>
                        <option value=""></option>
                        ${etiquetasAcopio.map(etiqueta =>
            `<option value="${etiqueta.etiqueta}">${etiqueta.etiqueta}</option>`
        ).join('')}
                    </select>
                    <button type="button" class="btn-agregar-etiqueta"><i class='bx bx-plus'></i></button>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-crear-producto btn orange"><i class="bx bx-plus"></i> Crear producto</button>
        </div>
    `;

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';

        // Event handlers for tags
        const btnAgregarEtiqueta = contenido.querySelector('.btn-agregar-etiqueta');
        const selectEtiqueta = contenido.querySelector('.select-etiqueta');
        const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');

        btnAgregarEtiqueta.addEventListener('click', () => {
            const etiquetaSeleccionada = selectEtiqueta.value;
            if (etiquetaSeleccionada) {
                const nuevaEtiqueta = document.createElement('div');
                nuevaEtiqueta.className = 'etiqueta-item';
                nuevaEtiqueta.dataset.valor = etiquetaSeleccionada;
                nuevaEtiqueta.innerHTML = `
                <i class='bx bx-purchase-tag'></i>
                <span>${etiquetaSeleccionada}</span>
                <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
            `;
                etiquetasActuales.appendChild(nuevaEtiqueta);
                selectEtiqueta.querySelector(`option[value="${etiquetaSeleccionada}"]`).remove();
                selectEtiqueta.value = '';
            }
        });

        etiquetasActuales.addEventListener('click', (e) => {
            if (e.target.closest('.btn-quitar-etiqueta')) {
                const etiquetaItem = e.target.closest('.etiqueta-item');
                const valorEtiqueta = etiquetaItem.dataset.valor;
                const option = document.createElement('option');
                option.value = valorEtiqueta;
                option.textContent = valorEtiqueta;
                selectEtiqueta.appendChild(option);
                etiquetaItem.remove();
            }
        });

        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnCrear = contenido.querySelector('.btn-crear-producto');
        btnCrear.addEventListener('click', confirmarCreacion);

        async function confirmarCreacion() {
            const producto = document.querySelector('.producto').value.trim();
            const pesoBruto = document.querySelector('.peso-bruto').value.trim();
            const loteBruto = document.querySelector('.lote-bruto').value.trim();
            const pesoPrima = document.querySelector('.peso-prima').value.trim();
            const lotePrima = document.querySelector('.lote-prima').value.trim();

            // Get selected tags
            const etiquetasSeleccionadas = Array.from(document.querySelectorAll('.etiquetas-actuales .etiqueta-item'))
                .map(item => item.dataset.valor)
                .join(';');

            if (!producto || !pesoBruto || !loteBruto || !pesoPrima || !lotePrima) {
                mostrarNotificacion({
                    message: 'Por favor complete todos los campos obligatorios',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                spinBoton(btnCrear);
                const response = await fetch('/crear-producto-acopio', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        producto,
                        pesoBruto,
                        loteBruto,
                        pesoPrima,
                        lotePrima,
                        etiquetas: etiquetasSeleccionadas
                    })
                });

                const data = await response.json();

                if (data.success) {
                    const newFila = data.id;
                    await obtenerAlmacenAcopio();
                    info(newFila)
                    mostrarNotificacion({
                        message: 'Producto creado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error(data.error || 'Error al crear el producto');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al procesar la operación',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                stopSpinBoton(btnCrear);
            }
        }
    }
    function gestionarEtiquetas() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const etiquetasHTML = etiquetasAcopio.map(etiqueta => `
            <div class="etiqueta-item" data-id="${etiqueta.id}">
                <i class='bx bx-purchase-tag'></i>
                <span>${etiqueta.etiqueta}</span>
                <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
            </div>
        `).join('');

        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Gestionar Etiquetas de Acopio</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal">Etiquetas existentes</p>
            <div class="etiquetas-container">
                <div class="etiquetas-actuales">
                    ${etiquetasHTML}
                </div>
            </div>

            <p class="normal">Agregar nueva etiqueta</p>
            <div class="entrada">
                <i class='bx bx-purchase-tag'></i>
                <div class="input">
                    <p class="detalle">Nueva etiqueta</p>
                    <input class="nueva-etiqueta" type="text" autocomplete="off" placeholder=" " required>
                    <button type="button" class="btn-agregar-etiqueta-temp"><i class='bx bx-plus'></i></button>
                </div>
            </div>
        </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        const btnAgregarTemp = contenido.querySelector('.btn-agregar-etiqueta-temp');
        const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');

        btnAgregarTemp.addEventListener('click', async () => {
            const nuevaEtiqueta = document.querySelector('.nueva-etiqueta').value.trim();
            if (nuevaEtiqueta) {
                try {
                    mostrarCarga('.carga-procesar');
                    const response = await fetch('/agregar-etiqueta-acopio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ etiqueta: nuevaEtiqueta })
                    });

                    if (!response.ok) throw new Error('Error al agregar etiqueta');

                    const data = await response.json();
                    if (data.success) {
                        await obtenerEtiquetasAcopio();
                        gestionarEtiquetas();
                        document.querySelector('.nueva-etiqueta').value = '';
                        mostrarNotificacion({
                            message: 'Etiqueta agregada correctamente',
                            type: 'success',
                            duration: 3000
                        });

                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al procesar la operación',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            }
        });

        etiquetasActuales.addEventListener('click', async (e) => {
            if (e.target.closest('.btn-quitar-etiqueta')) {
                try {
                    const etiquetaItem = e.target.closest('.etiqueta-item');
                    const etiquetaId = etiquetaItem.dataset.id;

                    mostrarCarga('.carga-procesar');
                    const response = await fetch(`/eliminar-etiqueta-acopio/${etiquetaId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('Error al eliminar etiqueta');

                    const data = await response.json();
                    if (data.success) {
                        await obtenerEtiquetasAcopio();
                        gestionarEtiquetas();
                        mostrarNotificacion({
                            message: 'Etiqueta eliminada correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al procesar la operación',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            }
        });
    }
    btnPDF.forEach(btn => {
        btn.addEventListener('click', () => exportarArchivosPDF('acopio-almacen', registrosAExportar));
    });
    aplicarFiltros();
}