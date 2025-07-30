let productos = [];
let etiquetasAcopio = [];
let tipoEventoAcopio = [];

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
    tipoEventoAcopio = localStorage.getItem('tipoEventoAlmacenAcopioLocal') || 'almacen';
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
                
                <div class="acciones-grande">
                ${tienePermiso('creacion') && tipoEventoAcopio !== 'pesaje' ? `
                    <button class="btn-crear-producto btn origin"> <i class='bx bx-plus'></i> <span>Crear</span></button>
                    <button class="btn-etiquetas btn especial"><i class='bx bx-purchase-tag'></i> <span>Etiquetas</span></button>
                    <button class="exportar-pdf btn red"><i class='bx bxs-file-pdf'></i> <span>PDF</span></button>
                    ` : ''}
                    ${tipoEventoAcopio === 'pesaje' ? `
                    <button class="vista-previa btn origin"><i class='bx bx-show'></i> <span>Vista previa</span></button>
                ` : ''}
                </div>
                
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
                ${tipoEventoAcopio !== 'pesaje' ? `
                    <button class="btn-filtro activado" title="Bruto">Bruto</button>
                    <button class="btn-filtro" title="Prima">Prima</button>
                ` : ''}
                <select name="tipoEventos" id="eventoTipo" class="select">
                    <option value="almacen">Almacen</option>
                    <option value="pesaje">Pesaje</option>
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
                <i class='bx bx-package' style="font-size: 50px;opacity:0.5"></i>
                <p style="text-align: center; color: #555;">¡Ups!, No se encontraron productos segun tu busqueda o filtrado.</p>
            </div>
        </div>
        
        <div class="anuncio-botones">
        ${tienePermiso('creacion') && tipoEventoAcopio !== 'pesaje' ? `
            <button class="btn-crear-producto btn origin"> <i class='bx bx-plus'></i> Crear</button>
            <button class="btn-etiquetas btn especial"><i class='bx bx-purchase-tag'></i>  Etiquetas</button>
            <button class="exportar-pdf btn red"><i class='bx bxs-file-pdf'></i> <span>PDF</span></button>
        ` : ''}
        ${tipoEventoAcopio === 'pesaje' ? `
            <button class="vista-previa btn origin"><i class='bx bx-show'></i> <span>Vista previa</span></button>
            ` : ''}
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '10px';
    if (tienePermiso('creacion') || tipoEventoAcopio === 'pesaje') {
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


        if (tipoEventoAcopio === 'pesaje') {
            // Calcular totales de bruto y prima
            const totalBruto = producto.bruto.split(';')
                .filter(lote => lote.trim())
                .reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);

            const totalPrima = producto.prima.split(';')
                .filter(lote => lote.trim())
                .reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);

            return `
                    <div class="registro-item" data-id="${producto.id}">
                        <div class="header">
                            <i class='bx bx-package'></i>
                            <div class="info-header">
                                <span class="id-flotante">
                                    <span>${producto.id}</span>
                                    <span class="flotante-item orange" style="display:none">${totalBruto.toFixed(2)} Kg.</span>
                                    <span class="flotante-item blue" style="display:none">${totalPrima.toFixed(2)} Kg.</span>
                                    <span style="display:flex; gap:5px; position: relative;">
                                        <div style="position: relative;">
                                            <span style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); font-size: 10px; color: orange; font-weight: bold;">Bruto</span>
                                            <input type="number" class="flotante-item entrada-conteo peso-bruto-fisico"  value="${totalBruto.toFixed(2)}" min="0" step="0.01" style="color: orange;min-width: 60px;">
                                        </div>
                                        <div style="position: relative;">
                                            <span style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--success); font-weight: bold;">Prima</span>
                                            <input type="number" class="flotante-item entrada-conteo peso-prima-fisico"  value="${totalPrima.toFixed(2)}" min="0" step="0.01" style="color: var(--success);min-width: 60px;">
                                        </div>
                                    </span>
                                </span>
                                <span class="detalle">${producto.producto}</span>
                                <span class="pie">${producto.etiquetas ? producto.etiquetas.split(';').join(' • ') : ''}</span>
                            </div>
                        </div>
                    </div>
                `;
        } else {
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
        }


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
    const select = document.getElementById('eventoTipo');

    select.value = tipoEventoAcopio;
    select.addEventListener('change', () => {
        localStorage.setItem('tipoEventoAlmacenAcopioLocal', select.value);
        tipoEventoAcopio = select.value; // <-- ACTUALIZA la variable global
        renderInitialHTML();
        updateHTMLWithData();
    });
    select.addEventListener('click', (e) => {
        scrollToCenter(e.target, e.target.parentElement);
    });

    
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

    

    let pesoMostrado = 'bruto';
    let filtroNombreActual = localStorage.getItem('filtroEtiquetaAcopio') || 'Todos';

    botonesCantidad.forEach((boton, index) => {
        if (boton.classList.contains('activado')) {
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
                if (tipoEventoAcopio === 'pesaje') {
                    // Para pesaje, actualizar ambos pesos (bruto y prima)
                    const totalBruto = producto.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);
                    const totalPrima = producto.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);

                    const brutoSpan = registro.querySelector('.orange');
                    const primaSpan = registro.querySelector('.blue');
                    if (brutoSpan) brutoSpan.textContent = `${totalBruto.toFixed(2)} Kg.`;
                    if (primaSpan) primaSpan.textContent = `${totalPrima.toFixed(2)} Kg.`;
                } else {
                    // Para almacén, actualizar solo el peso seleccionado
                    const total = pesoMostrado === 'bruto'
                        ? producto.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0)
                        : producto.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);

                    const stockSpan = registro.querySelector('.stock');
                    if (stockSpan) {
                        stockSpan.textContent = `${total.toFixed(2)} Kg.`;
                    }
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
                        if (tipoEventoAcopio === 'pesaje') {
                            productosFiltrados.sort((a, b) => {
                                const pesoA = parseFloat(a.querySelector('.orange').textContent);
                                const pesoB = parseFloat(b.querySelector('.orange').textContent);
                                return pesoB - pesoA;
                            });
                        } else {
                            productosFiltrados.sort((a, b) => parseFloat(b.querySelector('.stock').textContent) - parseFloat(a.querySelector('.stock').textContent));
                        }
                        break;
                    case 1: // Menor a mayor
                        if (tipoEventoAcopio === 'pesaje') {
                            productosFiltrados.sort((a, b) => {
                                const pesoA = parseFloat(a.querySelector('.orange').textContent);
                                const pesoB = parseFloat(b.querySelector('.orange').textContent);
                                return pesoA - pesoB;
                            });
                        } else {
                            productosFiltrados.sort((a, b) => parseFloat(a.querySelector('.stock').textContent) - parseFloat(b.querySelector('.stock').textContent));
                        }
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


    if (tipoEventoAcopio === 'almacen') {
        items.forEach(item => {
            item.addEventListener('click', function () {
                const registroId = this.dataset.id;
                window.info(registroId);
            });
        });
        window.info = function (registroId) {
            const producto = productos.find(r => r.id === registroId);
            if (!producto) return;

            // Process multiple bruto lots
            const lotesFormateadosBruto = producto.bruto.split(';')
                .filter(lote => lote.trim())
                .map(lote => {
                    const [peso, numeroLote] = lote.split('-');
                    return `<span class="detalle">
                        <span class="concepto"><i class='bx bx-package'></i> Lote ${numeroLote}: </span>${parseFloat(peso).toFixed(2)} Kg.
                    </span>`;
                })
                .join('');

            // Process multiple prima lots
            const lotesPrimaFormateados = producto.prima.split(';')
                .filter(lote => lote.trim())
                .map(lote => {
                    const [peso, numeroLote] = lote.split('-');
                    return `<span class="detalle">
                        <span class="concepto"><i class='bx bx-package'></i> Lote ${numeroLote}: </span>${parseFloat(peso).toFixed(2)} Kg.
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
                .map(etiqueta => `<span class="detalle"><span class="concepto"><i class='bx bx-tag'></i> ${etiqueta}</span>`)
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
                        <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Id: </span>${producto.id}</span>
                        <span class="detalle"><span class="concepto"><i class='bx bx-cube'></i> Producto: </span>${producto.producto}</span>
                    </div>
        
                    <p class="normal">Peso Bruto</p>
                    <div class="campo-vertical">
                        ${lotesFormateadosBruto}
                        <span class="detalle total">
                            <span class="detalle"><span class="concepto"><i class='bx bx-calculator'></i> Total Bruto: </span>${totalBruto.toFixed(2)} Kg.</span>
                        </span>
                    </div>
        
                    <p class="normal">Peso Prima</p>
                    <div class="campo-vertical">
                        ${lotesPrimaFormateados}
                        <span class="detalle total">
                            <span class="detalle"><span class="concepto"><i class='bx bx-calculator'></i> Total Prima: </span>${totalPrima.toFixed(2)} Kg.</span>
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
                        return `<span class="detalle">
                            <span class="concepto"><i class='bx bx-package'></i> Lote ${numeroLote}: </span>${parseFloat(peso).toFixed(2)} Kg.
                        </span>`;
                    })
                    .join('');

                // Process multiple prima lots
                const lotesPrimaFormateados = producto.prima.split(';')
                    .filter(lote => lote.trim())
                    .map(lote => {
                        const [peso, numeroLote] = lote.split('-');
                        return `<span class="detalle">
                            <span class="concepto"><i class='bx bx-package'></i> Lote ${numeroLote}: </span>${parseFloat(peso).toFixed(2)} Kg.
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
                    .map(etiqueta => `<span class="detalle"><span class="concepto"><i class='bx bx-tag'></i> ${etiqueta}</span>`)
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
                            <span class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Id: </span>${producto.id}</span>
                            <span class="detalle"><span class="concepto"><i class='bx bx-cube'></i> Producto: </span>${producto.producto}</span>
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
                        mostrarCarga('.carga-procesar');
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
                        ocultarCarga('.carga-procesar');
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
                        mostrarCarga('.carga-procesar');

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
                        ocultarCarga('.carga-procesar');
                    }
                }
            }
        }
        if (tienePermiso('creacion')) {
            btnCrearProducto.forEach(btn => {
                btn.addEventListener('click', crearProducto);
            })
            btnEtiquetas.forEach(btn => {
                btn.addEventListener('click', gestionarEtiquetas);
            })
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
                    mostrarCarga('.carga-procesar');
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
                    ocultarCarga('.carga-procesar');
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
    }else if(tipoEventoAcopio === 'pesaje'){
        const vistaPrevia = document.querySelectorAll('.vista-previa');

        // Event listeners for peso bruto and peso prima inputs
        document.querySelectorAll('.peso-bruto-fisico, .peso-prima-fisico').forEach(input => {
            input.addEventListener('change', (e) => {
                const productoId = e.target.closest('.registro-item').dataset.id;
                const nuevoValor = parseFloat(e.target.value) || 0;
                const tipoPeso = e.target.classList.contains('peso-bruto-fisico') ? 'bruto' : 'prima';

                // Obtener datos existentes o crear nuevo objeto
                let stockFisico = JSON.parse(localStorage.getItem('damabrava_stock_fisico') || '{}');
                
                // Inicializar objeto para el producto si no existe
                if (!stockFisico[productoId]) {
                    stockFisico[productoId] = { bruto: 0, prima: 0 };
                }

                // Actualizar valor específico
                stockFisico[productoId][tipoPeso] = nuevoValor;

                // Guardar en localStorage
                localStorage.setItem('damabrava_stock_fisico', JSON.stringify(stockFisico));
            });
        });

        // Cargar valores guardados
        const stockGuardado = JSON.parse(localStorage.getItem('damabrava_stock_fisico') || '{}');
        Object.entries(stockGuardado).forEach(([id, valores]) => {
            const registro = document.querySelector(`.registro-item[data-id="${id}"]`);
            if (registro) {
                const inputBruto = registro.querySelector('.peso-bruto-fisico');
                const inputPrima = registro.querySelector('.peso-prima-fisico');
                
                if (inputBruto && valores.bruto !== undefined) {
                    inputBruto.value = valores.bruto;
                }
                if (inputPrima && valores.prima !== undefined) {
                    inputPrima.value = valores.prima;
                }
            }
        });

        vistaPrevia.forEach(btn => {
            btn.addEventListener('click', vistaPreviaConteo);
        });

        function vistaPreviaConteo() {
            const stockFisico = JSON.parse(localStorage.getItem('damabrava_stock_fisico') || '{}');
            const contenido = document.querySelector('.anuncio-second .contenido');

            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Vista Previa del Pesaje</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Resumen del pesaje</p>
                    ${productos
                    .map(producto => {
                        // Calcular totales del sistema
                        const totalBrutoSistema = producto.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);
                        const totalPrimaSistema = producto.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);
                        
                        // Obtener valores físicos
                        const stockFisicoProducto = stockFisico[producto.id] || { bruto: totalBrutoSistema, prima: totalPrimaSistema };
                        const totalBrutoFisico = stockFisicoProducto.bruto || totalBrutoSistema;
                        const totalPrimaFisico = stockFisicoProducto.prima || totalPrimaSistema;
                        
                        // Calcular diferencias
                        const diferenciaBruto = totalBrutoFisico - totalBrutoSistema;
                        const diferenciaPrima = totalPrimaFisico - totalPrimaSistema;
                        
                        const colorDiferenciaBruto = diferenciaBruto > 0 ? '#4CAF50' : diferenciaBruto < 0 ? '#f44336' : '#2196F3';
                        const colorDiferenciaPrima = diferenciaPrima > 0 ? '#4CAF50' : diferenciaPrima < 0 ? '#f44336' : '#2196F3';
                        
                        // Mostrar solo si hay diferencias
                        if (diferenciaBruto === 0 && diferenciaPrima === 0) return '';
                        
                        return `
                            
                            <div class="campo-vertical">
                                <span class="detalle"><span class="concepto"><i class='bx bx-package'></i> Producto:</span> ${producto.producto}</span>
                                <div style="display: flex; flex-direction: column; margin-top: 10px; gap: 8px;">
                                    <div style="display: flex; justify-content: space-between; gap: 10px; padding: 8px; background: rgb(46, 46, 46); border-radius: 5px;">
                                        <span class="detalle"><span class="concepto" style="color: orange;"><i class='bx bx-weight'></i> Peso Bruto:</span></span>
                                        <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Sistema: ${totalBrutoSistema.toFixed(2)}Kg.</span></span>
                                        <span class="detalle"><span class="concepto"><i class='bx bx-calculator'></i> Físico: ${totalBrutoFisico.toFixed(2)}Kg.</span></span>
                                        <span class="detalle" style="color: ${colorDiferenciaBruto}"><span class="concepto" style="color: ${colorDiferenciaBruto}"><i class='bx bx-transfer'></i> Dif: ${diferenciaBruto > 0 ? '+' : ''}${diferenciaBruto.toFixed(2)}Kg.</span></span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; gap: 10px; padding: 8px; background: rgb(46, 46, 46); border-radius: 5px;">
                                        <span class="detalle"><span class="concepto" style="color: var(--success);"><i class='bx bx-weight'></i> Peso Prima:</span></span>
                                        <span class="detalle"><span class="concepto"><i class='bx bx-box'></i> Sistema: ${totalPrimaSistema.toFixed(2)}Kg.</span></span>
                                        <span class="detalle"><span class="concepto"><i class='bx bx-calculator'></i> Físico: ${totalPrimaFisico.toFixed(2)}Kg.</span></span>
                                        <span class="detalle" style="color: ${colorDiferenciaPrima}"><span class="concepto" style="color: ${colorDiferenciaPrima}"><i class='bx bx-transfer'></i> Dif: ${diferenciaPrima > 0 ? '+' : ''}${diferenciaPrima.toFixed(2)}Kg.</span></span>
                                    </div>
                                </div>
                            </div>
                            `;
                    })
                    .join('')}
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="Observaciones" type="text" placeholder=" " required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-label'></i>  
                        <div class="input">
                            <p class="detalle">Nombre del pesaje</p>
                            <input class="nombre-conteo" type="text" placeholder=" " required>
                        </div>
                    </div>
                </div>
                <div class="anuncio-botones">
                    <button id="registrar-conteo" class="btn origin"><i class='bx bx-save'></i> Registrar</button>
                    <button id="restaurar-conteo" class="btn especial"><i class='bx bx-reset'></i> Restaurar</button>
                </div>
            `;

            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioSecond();

            const btnRegistrarConteo = document.getElementById('registrar-conteo');
            btnRegistrarConteo.addEventListener('click', async () => {
                try {
                    mostrarCarga('.carga-procesar');
                    const stockFisico = JSON.parse(localStorage.getItem('damabrava_stock_fisico') || '{}');
                    const observaciones = document.querySelector('.Observaciones').value;
                    const nombre = document.querySelector('.nombre-conteo').value;

                    // Preparar los datos en el formato requerido para pesaje
                    const idProductos = productos.map(p => p.id).join(';');
                    const productosFormateados = productos.map(p => `${p.producto}`).join(';');
                    
                    // Sistema: totales de bruto y prima del sistema
                    const sistemaBruto = productos.map(p => {
                        return p.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0).toFixed(2);
                    }).join(';');
                    const sistemaPrima = productos.map(p => {
                        return p.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0).toFixed(2);
                    }).join(';');
                    
                    // Físico: valores ingresados por el usuario
                    const fisicoBruto = productos.map(p => {
                        const stockFisicoProducto = stockFisico[p.id] || { bruto: 0, prima: 0 };
                        return (stockFisicoProducto.bruto || 0).toFixed(2);
                    }).join(';');
                    const fisicoPrima = productos.map(p => {
                        const stockFisicoProducto = stockFisico[p.id] || { bruto: 0, prima: 0 };
                        return (stockFisicoProducto.prima || 0).toFixed(2);
                    }).join(';');
                    
                    // Diferencias
                    const diferenciaBruto = productos.map(p => {
                        const totalBrutoSistema = p.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);
                        const stockFisicoProducto = stockFisico[p.id] || { bruto: totalBrutoSistema, prima: 0 };
                        const totalBrutoFisico = stockFisicoProducto.bruto || totalBrutoSistema;
                        return (totalBrutoFisico - totalBrutoSistema).toFixed(2);
                    }).join(';');
                    const diferenciaPrima = productos.map(p => {
                        const totalPrimaSistema = p.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);
                        const stockFisicoProducto = stockFisico[p.id] || { bruto: 0, prima: totalPrimaSistema };
                        const totalPrimaFisico = stockFisicoProducto.prima || totalPrimaSistema;
                        return (totalPrimaFisico - totalPrimaSistema).toFixed(2);
                    }).join(';');

                    const response = await fetch('/registrar-pesaje', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nombre: nombre || "PESAJE",
                            idProductos: idProductos,
                            productos: productosFormateados,
                            sistemaBruto: sistemaBruto,
                            sistemaPrima: sistemaPrima,
                            fisicoBruto: fisicoBruto,
                            fisicoPrima: fisicoPrima,
                            diferenciaBruto: diferenciaBruto,
                            diferenciaPrima: diferenciaPrima,
                            observaciones
                        })

                    });

                    const data = await response.json();

                    if (data.success) {
                        mostrarNotificacion({
                            message: 'Pesaje registrado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Creación',
                            usuarioInfo.nombre + ' hizo un nuevo registro de pesaje')
                        localStorage.removeItem('damabrava_stock_fisico');
                        cerrarAnuncioManual('anuncioSecond');
                    } else {
                        throw new Error(data.error || 'Error al registrar el pesaje');
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
            });
            const restaurarConteo = document.getElementById('restaurar-conteo');
            restaurarConteo.addEventListener('click', restaurarConteoAlmacen);
            function restaurarConteoAlmacen() {
                // Limpiar el localStorage
                localStorage.removeItem('damabrava_stock_fisico');

                // Restaurar todos los inputs al valor original del sistema
                document.querySelectorAll('.registro-item').forEach(registro => {
                    const productoId = registro.dataset.id;
                    const producto = productos.find(p => p.id === productoId);
                    
                    if (producto) {
                        const inputBruto = registro.querySelector('.peso-bruto-fisico');
                        const inputPrima = registro.querySelector('.peso-prima-fisico');
                        
                        // Calcular totales del sistema
                        const totalBrutoSistema = producto.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);
                        const totalPrimaSistema = producto.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0] || 0), 0);
                        
                        if (inputBruto) {
                            inputBruto.value = totalBrutoSistema.toFixed(2);
                        }
                        if (inputPrima) {
                            inputPrima.value = totalPrimaSistema.toFixed(2);
                        }
                    }
                });

                // Mostrar notificación de éxito
                mostrarNotificacion({
                    message: 'Valores restaurados correctamente',
                    type: 'success',
                    duration: 3000
                });
                cerrarAnuncioManual('anuncioSecond');
            }
        }
    }


    aplicarFiltros();
}