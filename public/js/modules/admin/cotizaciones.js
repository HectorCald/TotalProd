

export let productos = [];
let etiquetas = [];
let precios = [];
let modoGlobal = localStorage.getItem("modoGlobal");

let carritoCotizaciones = new Map(JSON.parse(localStorage.getItem('damabrava_carrito_cotizaciones') || '[]'));

// Variable para el mensaje de cotización
let mensajeCotizacion = localStorage.getItem('damabrava_mensaje_cotizacion') || 'Cotización:\n• Sin productos en la cotización';


const DB_NAME = 'damabrava_db';
const PRODUCTO_ALM_DB = 'prductos_alm';
const PRECIOS_ALM_DB = 'precios_alm';
const ETIQUETAS_ALM_DB = 'etiquetas_almacen';



async function obtenerEtiquetas() {
    try {

        const etiquetasAlmacenCache = await obtenerLocal(ETIQUETAS_ALM_DB, DB_NAME);

        if (etiquetasAlmacenCache.length > 0) {
            etiquetas = etiquetasAlmacenCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actualizando desde el cache(Etiquetas almacen)')
        }

        const response = await fetch('/obtener-etiquetas');
        const data = await response.json();
        if (data.success) {
            etiquetas = data.etiquetas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });

            if (JSON.stringify(etiquetasAlmacenCache) !== JSON.stringify(etiquetas)) {
                console.log('Diferencias encontradas, actualizando UI');
                renderInitialHTML();
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(ETIQUETAS_ALM_DB, DB_NAME);
                        const tx = db.transaction(ETIQUETAS_ALM_DB, 'readwrite');
                        const store = tx.objectStore(ETIQUETAS_ALM_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of etiquetas) {
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
        console.error('Error al obtener etiquetas:', error);
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
            console.log('actualizando desde el cache(Precios)')
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
                    renderInitialHTML();
                    updateHTMLWithData();
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
async function obtenerAlmacenGeneral() {
    try {
        const productosCache = await obtenerLocal(PRODUCTO_ALM_DB, DB_NAME);

        if (productosCache.length > 0) {
            productos = productosCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
            console.log('actualizando desde el cache(almacen)')
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
                    renderInitialHTML();
                    updateHTMLWithData();
                }

                if (JSON.stringify(productosCache) !== JSON.stringify(productos)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    renderInitialHTML();
                    updateHTMLWithData();

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
    }
}



export async function mostrarCotizaciones() {
    renderInitialHTML();
    mostrarAnuncio();

    // Luego cargar el resto de datos en segundo plano
    const [etiquetas, precios, almacen] = await Promise.all([
        obtenerEtiquetas(),
        obtenerPrecios(),
        await obtenerAlmacenGeneral(),
    ]);
}
function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');

    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Cotizaciones</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio');"><i class="fas fa-arrow-right"></i></button>
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
            </div>
            <div class="filtros-opciones etiquetas-filter">
                <button class="btn-filtro todos activado">Todos</button>
                ${Array(5).fill().map(() => `
                    <div class="skeleton skeleton-etiqueta"></div>
                `).join('')}
            </div>
            <div class="filtros-opciones cantidad-filter">
                <button class="btn-filtro"><i class='bx bx-sort-down'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-up'></i></button>
                <button class="btn-filtro activado"><i class='bx bx-sort-a-z'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-z-a'></i></button>
                <button class="btn-filtro">Sueltas</button>
                <select class="precios-select" style="width:auto">
                    <option value="">Precios</option>
                </select>

                <div class="input switch-container" style="display:flex;align-items:center;gap:6px;">
                    <label class="switch" style="position:relative;">
                        <input type="checkbox" class="botones-cancelacion switch-tira-global">
                        <span class="slider round slider-thumb"></span>
                    </label>
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
                <i class='bx bx-package' style="font-size: 50px;opacity:0.5"></i>
                <p style="text-align: center; color: #555;">¡Ups!, No se encontraron productos segun tu busqueda o filtrado.</p>
            </div>
        </div>
        <button class="btn-flotante-cotizaciones">
            <i class="fas fa-file-invoice-dollar"></i>
            <span class="carrito-cantidad-flotante"></span>
        </button>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '10px';

    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
async function updateHTMLWithData() {
    const etiquetasFilter = document.querySelector('.etiquetas-filter');
    const skeletons = etiquetasFilter.querySelectorAll('.skeleton');
    skeletons.forEach(s => s.remove());

    // ✅ AGREGAR ESTA LÍNEA - Eliminar etiquetas existentes
    const etiquetasExistentes = etiquetasFilter.querySelectorAll('.btn-filtro:not(.todos)');
    etiquetasExistentes.forEach(e => e.remove());

    const etiquetasHTML = etiquetas.map(etiqueta => `
    <button class="btn-filtro">${etiqueta.etiqueta}</button>
    `).join('');

    etiquetasFilter.insertAdjacentHTML('beforeend', etiquetasHTML);

    const preciosSelect = document.querySelector('.precios-select');
    const preciosOpciones = precios.map((precio, index) => {
        const primerPrecio = precio.precio.split(';')[0].split(',')[0];
        return `<option value="${precio.id}" ${index === 1 ? 'selected' : ''}>${primerPrecio}</option>`;
    }).join('');
    preciosSelect.innerHTML = preciosOpciones;

    // Update precios select
    const productosContainer = document.querySelector('.productos-container');
    const productosHTML = await Promise.all(productos.map(async producto => {
        let imagenMostrar = '<i class=\'bx bx-package\'></i>';

        return `
            <div class="registro-item" data-id="${producto.id}">
                <div class="header">
                    ${imagenMostrar}
                    <div class="info-header">
                        <span class="id-flotante"><span>${producto.id}</span></span>
                        <span class="detalle">${producto.producto} - ${producto.gramos}gr.</span>
                        <span class="pie">${producto.etiquetas.split(';').join(' • ')}</span>
                    </div>
                </div>
            </div>
        `
    }
    ));

    // Renderizar HTML
    productosContainer.innerHTML = productosHTML.join('');
    eventosCotizaciones();
}


function eventosCotizaciones() {
    const productosACopiar = JSON.parse(localStorage.getItem('productosACopiar') || '[]');
    if (productosACopiar.length > 0) {
        carritoCotizaciones.clear();
        localStorage.setItem('damabrava_carrito_cotizaciones', JSON.stringify([]));
        productosACopiar.forEach(({ id, cantidad }) => {
            for (let i = 0; i < cantidad; i++) {
                agregarAlCarrito(id);
            }
        });
        localStorage.removeItem('productosACopiar');
    }
    const botonesEtiquetas = document.querySelectorAll('.filtros-opciones.etiquetas-filter .btn-filtro');
    const botonesCantidad = document.querySelectorAll('.filtros-opciones.cantidad-filter .btn-filtro');
    const selectPrecios = document.querySelector('.precios-select');

    const items = document.querySelectorAll('.registro-item');

    const inputBusqueda = document.querySelector('.search');
    const contenedor = document.querySelector('.anuncio .relleno');

    let filtroEtiquetaAlmacen = localStorage.getItem('filtroEtiquetaAlmacen') || 'Todos';


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
        const registros = document.querySelectorAll('.registro-item');
        const busqueda = normalizarTexto(inputBusqueda.value);
        const precioSeleccionado = selectPrecios.selectedIndex >= 0 && selectPrecios.options[selectPrecios.selectedIndex] ?
            selectPrecios.options[selectPrecios.selectedIndex].text : '';
        const botonCantidadActivo = document.querySelector('.filtros-opciones.cantidad-filter .btn-filtro.activado');
        const botonSueltas = document.querySelector('.filtros-opciones.cantidad-filter .btn-filtro:nth-child(5)');
        const mostrarSueltas = botonSueltas.classList.contains('activado');
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Animación de ocultamiento
        registros.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        setTimeout(() => {
            // Ocultar elementos y procesar filtros
            registros.forEach(registro => {
                registro.style.display = 'none';
                const producto = productos.find(p => p.id === registro.dataset.id);
                const stockSpan = registro.querySelector('.stock');
                if (stockSpan && producto) {
                    stockSpan.textContent = mostrarSueltas ?
                        `${producto.uSueltas || 0} Sueltas` :
                        `${producto.stock} Und.`;
                }
            });

            // Filtrar y ordenar
            const productosFiltrados = Array.from(registros).filter(registro => {
                const producto = productos.find(p => p.id === registro.dataset.id);
                if (!producto) return false;

                const etiquetasProducto = producto.etiquetas.split(';').map(e => e.trim());
                let mostrar = true;

                // Filtro de sueltas
                if (mostrarSueltas) {
                    mostrar = mostrar && (producto.uSueltas && producto.uSueltas > 0);
                }

                // Filtro de etiquetas
                if (mostrar && filtroEtiquetaAlmacen !== 'Todos') {
                    mostrar = mostrar && etiquetasProducto.includes(filtroEtiquetaAlmacen);
                }

                // Filtro de búsqueda
                if (mostrar && busqueda) {
                    mostrar = mostrar && (
                        normalizarTexto(producto.producto).includes(busqueda) ||
                        normalizarTexto(producto.gramos.toString()).includes(busqueda) ||
                        normalizarTexto(producto.codigo_barras).includes(busqueda) ||
                        normalizarTexto(producto.id).includes(busqueda)

                    );
                }

                return mostrar;
            });

            // Ordenamiento
            if (botonCantidadActivo) {
                const index = Array.from(botonesCantidad).indexOf(botonCantidadActivo);
                switch (index) {
                    case 0:
                        productosFiltrados.sort((a, b) => {
                            const productoA = productos.find(p => p.id === a.dataset.id);
                            const productoB = productos.find(p => p.id === b.dataset.id);
                            const valA = mostrarSueltas ?
                                (productoA?.uSueltas || 0) :
                                parseInt(a.querySelector('.stock')?.textContent || '0');
                            const valB = mostrarSueltas ?
                                (productoB?.uSueltas || 0) :
                                parseInt(b.querySelector('.stock')?.textContent || '0');
                            return valB - valA;
                        });
                        break;
                    case 1:
                        productosFiltrados.sort((a, b) => {
                            const productoA = productos.find(p => p.id === a.dataset.id);
                            const productoB = productos.find(p => p.id === b.dataset.id);
                            const valA = mostrarSueltas ?
                                (productoA?.uSueltas || 0) :
                                parseInt(a.querySelector('.stock')?.textContent || '0');
                            const valB = mostrarSueltas ?
                                (productoB?.uSueltas || 0) :
                                parseInt(b.querySelector('.stock')?.textContent || '0');
                            return valA - valB;
                        });
                        break;
                    case 2:
                        productosFiltrados.sort((a, b) => {
                            const nombreA = a.querySelector('.detalle')?.textContent || '';
                            const nombreB = b.querySelector('.detalle')?.textContent || '';
                            return nombreA.localeCompare(nombreB);
                        });
                        break;
                    case 3:
                        productosFiltrados.sort((a, b) => {
                            const nombreA = a.querySelector('.detalle')?.textContent || '';
                            const nombreB = b.querySelector('.detalle')?.textContent || '';
                            return nombreB.localeCompare(nombreA);
                        });
                        break;
                }
            }

            // Mostrar elementos filtrados con animación
            productosFiltrados.forEach(registro => {
                registro.style.display = 'flex';
                registro.style.opacity = '0';
                registro.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    registro.style.opacity = '1';
                    registro.style.transform = 'translateY(0)';
                }, 0);
            });

            // Actualizar precios y reordenar DOM
            const contenedor = document.querySelector('.productos-container');
            productosFiltrados.forEach(registro => {
                const producto = productos.find(p => p.id === registro.dataset.id);
                if (precioSeleccionado && producto) {
                    const preciosProducto = producto.precios.split(';');
                    const precioFiltrado = preciosProducto.find(p => p.split(',')[0] === precioSeleccionado);
                    if (precioFiltrado) {
                        const precio = parseFloat(precioFiltrado.split(',')[1]);
                        const precioElement = registro.querySelector('.precio');
                        if (precioElement) {
                            precioElement.textContent = `Bs. ${precio.toFixed(2)}`;
                        }
                    }
                }
                contenedor.appendChild(registro);
            });

            // Mensaje vacío
            if (mensajeNoEncontrado) {
                mensajeNoEncontrado.style.display = productosFiltrados.length === 0 ? 'block' : 'none';
            }
        }, 200);
    }
    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });
    inputBusqueda.addEventListener('input', (e) => {
        aplicarFiltros();
    });

    botonesEtiquetas.forEach(boton => {
        boton.classList.remove('activado');
        if (boton.textContent.trim() === filtroEtiquetaAlmacen) {
            boton.classList.add('activado');
        }
        boton.addEventListener('click', () => {
            botonesEtiquetas.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroEtiquetaAlmacen = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
            localStorage.setItem('filtroEtiquetaAlmacen', filtroEtiquetaAlmacen);
        });
    });
    botonesCantidad.forEach(boton => {
        boton.addEventListener('click', () => {
            if (boton.textContent.trim() === 'Sueltas') {
                boton.classList.toggle('activado');
            } else {
                // Comportamiento normal para otros botones
                botonesCantidad.forEach(b => {
                    if (b.textContent.trim() !== 'Sueltas') {
                        b.classList.remove('activado');
                    }
                });
                boton.classList.add('activado');
            }
            scrollToCenter(boton, boton.parentElement);
            aplicarFiltros();
        });
    });


    selectPrecios.addEventListener('click', (e) => {
        scrollToCenter(e.target, e.target.parentElement);
    });





    const botonFlotanteCotizaciones = document.querySelector('.btn-flotante-cotizaciones')
    const switchTiraGlobal = document.querySelector('.switch-tira-global');

    if (modoGlobal === null) modoGlobal = true; // Por defecto activo
    else modoGlobal = modoGlobal === "true";    // Convierte a booleano

    switchTiraGlobal.checked = modoGlobal;
    switchTiraGlobal.addEventListener('change', (e) => {
        mostrarCarga('.carga-procesar');
        modoGlobal = e.target.checked;
        localStorage.setItem("modoGlobal", e.target.checked);

        setTimeout(() => {
            reconstruirCarritoCotizacionesConModoYPrecioActual();
            ocultarCarga('.carga-procesar');
        }, 1000);
        mostrarNotificacion({
            message: modoGlobal ? 'Modo Tira activado' : 'Modo Unidad activado',
            type: modoGlobal ? 'success' : 'info',
            duration: 2000
        });
    });
    botonFlotanteCotizaciones.addEventListener('click', mostrarCarritoCotizaciones);

    items.forEach(item => {
        item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
    });

    selectPrecios.addEventListener('change', (e) => {
        mostrarCarga('.carga-procesar');
        scrollToCenter(e.target, e.target.parentElement);
        aplicarFiltros();
        setTimeout(() => {
            reconstruirCarritoCotizacionesConModoYPrecioActual();
            ocultarCarga('.carga-procesar');
        }, 1000);
    });


    function agregarAlCarrito(productoId) {
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;

        // Calcula el precio actual según el modo y ciudad seleccionada
        const cantidadxgrupo = producto.cantidadxgrupo || 1;
        const selectPrecios = document.querySelector('.precios-select');
        const ciudadSeleccionada = selectPrecios.options[selectPrecios.selectedIndex]?.text || '';
        const preciosProducto = producto.precios.split(';');
        const precioSeleccionado = preciosProducto.find(p => p.split(',')[0] === ciudadSeleccionada);
        const precioUnitario = precioSeleccionado ? parseFloat(precioSeleccionado.split(',')[1]) : 0;
        const precioFinal = modoGlobal ? precioUnitario * cantidadxgrupo : precioUnitario;
        const stockDisponible = modoGlobal ? producto.stock : producto.stock * cantidadxgrupo;

        // Si ya está en el carrito, suma 1 (si hay stock suficiente)
        if (carritoCotizaciones.has(productoId)) {
            const item = carritoCotizaciones.get(productoId);
            if (item.cantidad < stockDisponible) {
                item.cantidad += 1;
                // NO actualizar el precio aquí, debe mantenerse el precio con el que se agregó
            }
        } else {
            carritoCotizaciones.set(productoId, {
                ...producto,
                cantidad: 1,
                stockFinal: stockDisponible,
                subtotal: precioFinal, // Este es el precio con el que se agrega
                ciudadSeleccionada: ciudadSeleccionada, // Guardar ciudad para referencia
                precioUnitarioSeleccionado: precioUnitario // Guardar precio unitario seleccionado
            });
        }
        if (window.innerWidth > 768) {
            mostrarCarritoCotizaciones();
            setTimeout(() => {
                const inputCantidad = document.querySelector(`.carrito-item[data-id='${productoId}'] input[type='number']`);
                if (inputCantidad) {
                    inputCantidad.focus();
                    inputCantidad.select();
                }
            }, 100);
        }

        // Guarda en localStorage
        localStorage.setItem('damabrava_carrito_cotizaciones', JSON.stringify(Array.from(carritoCotizaciones.entries())));

        // Muestra el botón flotante si hay productos
        const botonFlotante = document.querySelector('.btn-flotante-cotizaciones');
        if (botonFlotante) {
            botonFlotante.style.display = carritoCotizaciones.size > 0 ? 'block' : 'none';
        }

        // Si el carrito está abierto, refresca el HTML del carrito
        const anuncioSecond = document.querySelector('.anuncio-second .contenido');
        if (anuncioSecond && anuncioSecond.innerHTML.includes('Carrito de Cotizaciones')) {
            mostrarCarritoCotizaciones();
        }
        actualizarBotonFlotante();
        const itemDiv = document.querySelector(`.registro-item[data-id="${productoId}"]`);
        if (itemDiv) {
            itemDiv.classList.add('disabled');
        }
    }
    window.eliminarDelCarrito = (id) => {
        // 1. Eliminar del Map
        carritoCotizaciones.delete(id);

        // 2. Eliminar del DOM
        const itemToRemove = document.querySelector(`.carrito-item[data-id="${id}"]`);
        if (itemToRemove) {
            itemToRemove.remove();
        }

        // 3. Actualizar localStorage
        localStorage.setItem('damabrava_carrito_cotizaciones', JSON.stringify(Array.from(carritoCotizaciones.entries())));

        // 4. Actualizar el botón flotante
        const botonFlotante = document.querySelector('.btn-flotante-cotizaciones');
        if (botonFlotante) {
            botonFlotante.style.display = carritoCotizaciones.size > 0 ? 'block' : 'none';
        }

        // 5. Actualizar totales del carrito
        actualizarTotalesCarrito();
        actualizarBotonFlotante();

        if (carritoCotizaciones.size < 1) {
            ocultarAnuncioSecond();
        }
        // Si ya no está en el carrito, quita la clase disabled
        const itemDiv = document.querySelector(`.registro-item[data-id="${id}"]`);
        if (itemDiv) {
            itemDiv.classList.remove('disabled');
        }
    };
    function actualizarTotalesCarrito() {
        const subtotal = Array.from(carritoCotizaciones.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
        const totalElement = document.querySelector('.total-final');
        const subtotalElement = document.querySelector('.campo-vertical span:first-child');
        if (subtotalElement && totalElement) {
            subtotalElement.innerHTML = `<strong>Subtotal: </strong>Bs. ${subtotal.toFixed(2)}`;
            totalElement.innerHTML = `<strong>Total Final: </strong>Bs. ${subtotal.toFixed(2)}`;
            const descuentoInput = document.querySelector('.descuento');
            const aumentoInput = document.querySelector('.aumento');
            if (descuentoInput && aumentoInput) {
                const descuentoValor = parseFloat(descuentoInput.value) || 0;
                const aumentoValor = parseFloat(aumentoInput.value) || 0;
                const totalCalculado = subtotal - descuentoValor + aumentoValor;
                totalElement.innerHTML = `<strong>Total Final: </strong>Bs. ${totalCalculado.toFixed(2)}`;
            }
        }
    }
    window.ajustarCantidad = (id, delta) => {
        const item = carritoCotizaciones.get(id);
        if (!item) return;

        // Lógica de mínimo (no puede ser menor a 1)
        const min = 1;
        let nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad < min) nuevaCantidad = min;

        if (nuevaCantidad === item.cantidad) return; // No hay cambio

        item.cantidad = nuevaCantidad;

        // Actualiza el localStorage
        localStorage.setItem('damabrava_carrito_cotizaciones', JSON.stringify(Array.from(carritoCotizaciones.entries())));

        // Solo actualiza los valores del DOM de ese producto
        const itemDiv = document.querySelector(`.carrito-item[data-id="${id}"]`);
        if (itemDiv) {
            // Actualiza el input de cantidad
            const input = itemDiv.querySelector('input[type="number"]');
            if (input) input.value = item.cantidad;

            // Actualiza el stock disponible correctamente según el modo
            const stockSpan = itemDiv.querySelector('.stock-disponible');
            const stockActual = Number(item.stock) || 0;
            const cantidadxgrupo = Number(item.cantidadxgrupo) || 1;
            let stockDisponible;
            if (modoGlobal) {
                stockDisponible = `${stockActual + item.cantidad} Tiras`;
            } else {
                stockDisponible = `${(stockActual * cantidadxgrupo) + item.cantidad} Unidades`;
            }
            if (stockSpan) stockSpan.textContent = stockDisponible;

            // Actualiza el subtotal y total de ese producto
            const unitario = itemDiv.querySelector('.unitario');
            if (unitario) unitario.textContent = `Bs. ${(item.subtotal).toFixed(2)}`;
            const subtotal = itemDiv.querySelector('.subtotal');
            if (subtotal) subtotal.textContent = `Bs. ${(item.cantidad * item.subtotal).toFixed(2)}`;
        }

        // Actualiza los totales generales del carrito
        actualizarTotalesCarrito();
    };
    function actualizarBotonFlotante() {
        const botonFlotante = document.querySelector('.btn-flotante-cotizaciones');
        const spanCantidad = botonFlotante ? botonFlotante.querySelector('.carrito-cantidad-flotante') : null;
        const cantidad = carritoCotizaciones.size;

        if (botonFlotante) {
            botonFlotante.style.display = cantidad > 0 ? 'block' : 'none';
            if (spanCantidad) {
                spanCantidad.textContent = cantidad;
                spanCantidad.style.display = cantidad > 0 ? 'inline-block' : 'none';
            }
        }
    }
    function marcarItemsAgregadosAlCarrito() {
        document.querySelectorAll('.registro-item').forEach(itemDiv => {
            const id = itemDiv.dataset.id;
            if (carritoCotizaciones.has(id)) {
                itemDiv.classList.add('disabled');
            } else {
                itemDiv.classList.remove('disabled');
            }
        });
    }
    function mostrarCarritoCotizaciones() {
        const anuncioSecond = document.querySelector('.anuncio-second .contenido');
        if (!anuncioSecond) return;

        const subtotal = Array.from(carritoCotizaciones.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
        let descuento = 0;
        let aumento = 0;

        anuncioSecond.innerHTML = `
            <div class="encabezado">
                <h1 class="titulo">Carrito de Cotizaciones</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
                <button class="btn filtros limpiar"><i class="fas fa-broom"></i></button>
            </div>
            <div class="relleno">
                <div class="carrito-items">
                    ${Array.from(carritoCotizaciones.values()).map(item => `
                        <div class="carrito-item" data-id="${item.id}">
                            <div class="item-info">
                                <h3>${item.producto} - ${item.gramos}gr</h3>
                                <div class="cantidad-control">
                                    <button class="btn-cantidad" style="color:var(--error)" onclick="ajustarCantidad('${item.id}', -1)">-</button>
                                    <input type="number" value="${item.cantidad}" min="1" max="${item.stockFinal || item.stock}" onchange="ajustarCantidad('${item.id}', this.value - ${item.cantidad})">
                                    <button class="btn-cantidad"style="color:var(--success)" onclick="ajustarCantidad('${item.id}', 1)">+</button>
                                </div>
                            </div>
                            <div class="subtotal-delete">
                                <div class="info-valores">
                                    <p class="stock-disponible" style="display:none;">${Number(item.stock || 0) + Number(item.cantidad)} Und.</p>
                                    <p class="unitario">Bs. ${(item.subtotal).toFixed(2)}</p>
                                    <p class="subtotal">Bs. ${(item.cantidad * item.subtotal).toFixed(2)}</p>
                                </div>
                                <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.id}')">
                                    <i class="bx bx-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                    <div class="carrito-total">
                        <div class="leyenda">
                            <div class="item" style="display:none;">
                                <span class="punto orange"></span>
                                <p>Stock actual</p>
                            </div>
                            <div class="item">
                                <span class="punto blue-light"></span>
                                <p>Precio unitario</p>
                            </div>
                            <div class="item">
                                <span class="punto verde"></span>
                                <p>Subtotal</p>
                            </div>
                        </div>
                        <div class="campo-vertical">
                            <span class="detalle"><span class="concepto">Subtotal: </span>Bs. ${subtotal.toFixed(2)}</span>
                            <span class="detalle total-final"><span class="concepto">Total Final: </span>Bs. ${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-comment-detail'></i>
                            <div class="input">
                                <p class="detalle">Observaciones</p>
                                <input class="observaciones" type="text" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-cotizar btn origin" onclick="mostrarFormatoCotizacion()"><i class='bx bx-share'></i> Cotizar</button>
            </div>
        `;
        anuncioSecond.style.paddingBottom = '70px'
        mostrarAnuncioSecond();

        const botonLimpiar = anuncioSecond.querySelector('.btn.filtros.limpiar');
        botonLimpiar.addEventListener('click', () => {

            carritoCotizaciones.forEach((item, id) => {
                const headerItem = document.querySelector(`.registro-item[data-id="${id}"]`);
                if (headerItem) {
                    const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                    const stockSpan = headerItem.querySelector('.stock');
                    if (cantidadSpan) cantidadSpan.textContent = '';
                    if (stockSpan) stockSpan.textContent = `${item.stock} Und.`;
                }
            });

            carritoCotizaciones.clear();
            localStorage.setItem('damabrava_carrito_cotizaciones', JSON.stringify([]));
            ocultarAnuncioSecond();
            marcarItemsAgregadosAlCarrito();
            mostrarNotificacion({
                message: 'Carrito limpiado exitosamente',
                type: 'success',
                duration: 2000
            });
            document.querySelector('.btn-flotante-cotizaciones').style.display = 'none';
        });
    }
    function reconstruirCarritoCotizacionesConModoYPrecioActual() {
        // 1. Guarda los productos y cantidades actuales
        const itemsPrevios = Array.from(carritoCotizaciones.values()).map(item => ({
            id: item.id,
            cantidad: item.cantidad
        }));

        // 2. Limpia el carrito
        carritoCotizaciones.clear();
        localStorage.setItem('damabrava_carrito_cotizaciones', JSON.stringify([]));

        // 3. Vuelve a agregar los productos con el precio y modo actual, preservando las cantidades
        for (const { id, cantidad } of itemsPrevios) {
            // Agregar el producto una vez y luego ajustar la cantidad
            agregarAlCarrito(id);

            // Si la cantidad es mayor a 1, ajustar a la cantidad anterior
            if (cantidad > 1) {
                const item = carritoCotizaciones.get(id);
                if (item) {
                    item.cantidad = cantidad;
                    // Actualizar localStorage
                    localStorage.setItem('damabrava_carrito_cotizaciones', JSON.stringify(Array.from(carritoCotizaciones.entries())));
                }
            }
        }

        // 4. Actualiza la UI del carrito si está abierto
        const anuncioSecond = document.querySelector('.anuncio-second .contenido');
        if (anuncioSecond && anuncioSecond.innerHTML.includes('Carrito de Cotizaciones')) {
            mostrarCarritoCotizaciones();
        }
    }


    actualizarBotonFlotante();
    marcarItemsAgregadosAlCarrito();




    function mostrarMensajeCotizacion() {
        // Generar el mensaje de cotización con los productos del carrito
        if (carritoCotizaciones.size > 0) {
            const subtotal = Array.from(carritoCotizaciones.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);

            mensajeCotizacion = 'Cotización de productos:\n\n' + Array.from(carritoCotizaciones.values())
                .map(item => {
                    const subtotalItem = (item.cantidad * item.subtotal).toFixed(2);
                    return `• ${item.producto} - ${item.gramos}gr\n  Cantidad: ${item.cantidad}\n  Precio unitario: Bs. ${item.subtotal.toFixed(2)}\n  Subtotal: Bs. ${subtotalItem}`;
                })
                .join('\n\n') +
                `\n\nTotal: Bs. ${subtotal.toFixed(2)}`;

            // Guardar el mensaje en localStorage
            localStorage.setItem('damabrava_mensaje_cotizacion', mensajeCotizacion);
        }

        const anuncioTercer = document.querySelector('.anuncio-tercer .contenido');
        const formatoHTML = `
        <div class="encabezado">
            <h1 class="titulo">Cotización</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        <div class="relleno">
                         <p class="normal">Información a mostrar</p>
             <div class="campo-horizontal">
                 <div class="box">
                     <p class="detalle"><i class='bx bx-hash'></i> Cantidad</p>
                     <label><input type="checkbox" name="mostrarCantidad" value="cantidad" class="info-checkbox" checked> Mostrar</label>
                 </div>
                 <div class="box">
                     <p class="detalle"><i class='bx bx-dollar-circle'></i> P. Unitario</p>
                     <label><input type="checkbox" name="mostrarPrecioUnitario" value="precioUnitario" class="info-checkbox" checked> Mostrar</label>
                 </div>
                 <div class="box">
                     <p class="detalle"><i class='bx bx-weight'></i> Gramaje</p>
                     <label><input type="checkbox" name="mostrarGramaje" value="gramaje" class="info-checkbox" checked> Mostrar</label>
                 </div>
                 <div class="box">
                     <p class="detalle"><i class='bx bx-calculator'></i> Subtotal</p>
                     <label><input type="checkbox" name="mostrarSubtotal" value="subtotal" class="info-checkbox" checked> Mostrar</label>
                 </div>
             </div>
            <div class="formato-cotizacion">
                <div contenteditable="true" style="min-height: fit-content; color:var(--text-color); white-space: pre-wrap; font-family: Arial, sans-serif; text-align: left; padding: 15px;">${mensajeCotizacion}</div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn blue" onclick="limpiarFormatoCotizacion()">
                <i class="fas fa-broom"></i>Limpiar
            </button>
            <button class="btn green" onclick="compartirFormatoCotizacion()">
                <i class="fas fa-share-alt"></i>Compartir
            </button>
            <button class="btn red" onclick="descargarFormatoCotizacion()">
                <i class="fas fa-file-pdf"></i>Descargar
            </button>
        </div>
    `;

        anuncioTercer.innerHTML = formatoHTML;
        anuncioTercer.style.paddingBottom = '70px';
        mostrarAnuncioTercer();

        // Agregar event listeners para los checkboxes
        const checkboxes = anuncioTercer.querySelectorAll('.info-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', regenerarMensajeConFiltros);
        });
    }
    window.mostrarFormatoCotizacion = function () {
        const anuncioTercer = document.querySelector('.anuncio-tercer .contenido');
        if (!anuncioTercer) return;
        mostrarMensajeCotizacion();
    };
    window.limpiarFormatoCotizacion = function () {
        mensajeCotizacion = 'Cotización:\n• Sin productos en la cotización';
        localStorage.setItem('damabrava_mensaje_cotizacion', mensajeCotizacion);
        const formatoDiv = document.querySelector('.formato-cotizacion div[contenteditable]');
        if (formatoDiv) {
            formatoDiv.innerHTML = mensajeCotizacion;
        }
    };
    window.compartirFormatoCotizacion = async function () {
        const formatoDiv = document.querySelector('.formato-cotizacion div[contenteditable]');
        if (!formatoDiv) return;

        const texto = encodeURIComponent(formatoDiv.innerText);

        // Open WhatsApp web with the text pre-filled
        window.open(`https://wa.me/?text=${texto}`, '_blank');
    };

    function regenerarMensajeConFiltros() {
        if (carritoCotizaciones.size === 0) return;

        const mostrarCantidad = document.querySelector('input[name="mostrarCantidad"]').checked;
        const mostrarPrecioUnitario = document.querySelector('input[name="mostrarPrecioUnitario"]').checked;
        const mostrarGramaje = document.querySelector('input[name="mostrarGramaje"]').checked;
        const mostrarSubtotal = document.querySelector('input[name="mostrarSubtotal"]').checked;

        const subtotal = Array.from(carritoCotizaciones.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);

        mensajeCotizacion = 'Cotización de productos:\n\n' + Array.from(carritoCotizaciones.values())
            .map(item => {
                const subtotalItem = (item.cantidad * item.subtotal).toFixed(2);
                let mensajeItem = `• ${item.producto}`;

                if (mostrarGramaje) {
                    mensajeItem += ` - ${item.gramos}gr`;
                }

                if (mostrarCantidad) {
                    mensajeItem += `\n  Cantidad: ${item.cantidad}`;
                }

                if (mostrarPrecioUnitario) {
                    mensajeItem += `\n  Precio unitario: Bs. ${item.subtotal.toFixed(2)}`;
                }

                if (mostrarSubtotal) {
                    mensajeItem += `\n  Subtotal: Bs. ${subtotalItem}`;
                }

                return mensajeItem;
            })
            .join('\n\n') +
            `\n\nTotal: Bs. ${subtotal.toFixed(2)}`;

        // Actualizar el contenido del div editable
        const formatoDiv = document.querySelector('.formato-cotizacion div[contenteditable]');
        if (formatoDiv) {
            formatoDiv.innerHTML = mensajeCotizacion;
        }

        // Guardar el mensaje en localStorage
        localStorage.setItem('damabrava_mensaje_cotizacion', mensajeCotizacion);
    }

    window.descargarFormatoCotizacion = function () {
        // Verificar que hay productos en el carrito
        if (carritoCotizaciones.size === 0) {
            mostrarNotificacion({
                message: 'No hay productos en la cotización para descargar',
                type: 'warning',
                duration: 3000
            });
            return;
        }

        // Convertir el Map del carrito a un array para la función de exportar
        const productosCotizacion = Array.from(carritoCotizaciones.values());

        // Usar la función exportarArchivosPDF con el tipo 'cotizaciones'
        exportarArchivosPDF('cotizaciones', productosCotizacion);
    };

    aplicarFiltros();
}