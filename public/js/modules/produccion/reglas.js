let productosGlobal = [];
let reglasProduccion = [];
let reglasBase = [];
let preciosBase = {
    etiquetado: 0,
    envasado: 0,
    sellado: 0,
    cernido: 0
};
const DB_NAME = 'damabrava_db';
const PRODUCTO_ALM_DB = 'prductos_alm';
const REGLAS_BASE_DB = 'reglas_produccion_base';
const REGLAS_PRODUCCION_DB = 'reglas_produccion';


async function obtenerReglasBase() {
    try {

        const reglasCache = await obtenerLocal(REGLAS_BASE_DB, DB_NAME);

        // Si hay nombres en caché, actualizar la UI inmediatamente
        if (reglasCache.length > 0) {
            reglasBase = reglasCache
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

            // Actualizar preciosBase con valores del servidor si es necesario
            reglasBase.forEach(regla => {
                if (regla.nombre === 'Etiquetado') preciosBase.etiquetado = parseFloat(regla.precio);
                if (regla.nombre === 'Envasado') preciosBase.envasado = parseFloat(regla.precio);
                if (regla.nombre === 'Sellado') preciosBase.sellado = parseFloat(regla.precio);
                if (regla.nombre === 'Cernido') preciosBase.cernido = parseFloat(regla.precio);
            });
            console.log('Actulizando reglas base de cache')
        }

        const response = await fetch('/obtener-reglas-base');
        const data = await response.json();

        if (data.success) {
            reglasBase = data.reglasBase
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

            // Actualizar preciosBase con valores del servidor si es necesario
            reglasBase.forEach(regla => {
                if (regla.nombre === 'Etiquetado') preciosBase.etiquetado = parseFloat(regla.precio);
                if (regla.nombre === 'Envasado') preciosBase.envasado = parseFloat(regla.precio);
                if (regla.nombre === 'Sellado') preciosBase.sellado = parseFloat(regla.precio);
                if (regla.nombre === 'Cernido') preciosBase.cernido = parseFloat(regla.precio);
            });

            // Verificar si hay diferencias entre el caché y los nuevos datos
            if (JSON.stringify(reglasCache) !== JSON.stringify(reglasBase)) {
                console.log('diferentes (reglas base)')
                renderInitialHTML();
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(REGLAS_BASE_DB, DB_NAME);
                        const tx = db.transaction(REGLAS_BASE_DB, 'readwrite');
                        const store = tx.objectStore(REGLAS_BASE_DB);

                        // Limpiar todos los nombres existentes
                        await store.clear();

                        // Guardar los nuevos nombres
                        for (const item of reglasBase) {
                            await store.put({
                                id: item.id,
                                data: item,
                                timestamp: Date.now()
                            });
                        }

                    } catch (error) {
                        console.error('Error actualizando el caché de nombres:', error);
                    }
                })();
            }
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener reglas base:', error);
        return false;
    }
}
async function obtenerProductos() {
    try {
        const productosCache = await obtenerLocal(PRODUCTO_ALM_DB, DB_NAME);

        if (productosCache.length > 0) {
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
                    console.log('Diferencias (productos)');
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

                            console.log('Caché de productos actualizado correctamente');
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
async function obtenerReglas() {
    try {
        const reglasProduccionCache = await obtenerLocal(REGLAS_PRODUCCION_DB, DB_NAME);

        if (reglasProduccionCache.length > 0) {
            reglasProduccion = reglasProduccionCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
        }


        const response = await fetch('/obtener-reglas');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar de más reciente a más antiguo
            reglasProduccion = data.reglas
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA; // Orden descendente por número de ID
                });

            if (reglasProduccion.length === 0) {
                console.log('no hay registros');
                renderInitialHTML();
                updateHTMLWithData();
            }

            if (JSON.stringify(reglasProduccionCache) !== JSON.stringify(reglasProduccion)) {
                console.log('Diferencias (reglas)');
                renderInitialHTML();
                updateHTMLWithData();

                (async () => {
                    try {
                        const db = await initDB(REGLAS_PRODUCCION_DB, DB_NAME);
                        const tx = db.transaction(REGLAS_PRODUCCION_DB, 'readwrite');
                        const store = tx.objectStore(REGLAS_PRODUCCION_DB);

                        // Limpiar todos los registros existentes
                        await store.clear();

                        // Guardar los nuevos registros
                        for (const item of reglasProduccion) {
                            await store.put({
                                id: item.id,
                                data: item,
                                timestamp: Date.now()
                            });
                        }
                    } catch (error) {
                        console.error('Error actualizando el caché:', error);
                    }
                })();
            }
            else {
                console.log('no son diferentes')
            }

            return true;

        } else {
            return false;
        }
    } catch (error) {
        console.error('Error las reglas', error);
        return false;
    }
}


export async function mostrarReglas() {
    renderInitialHTML();
    mostrarAnuncio();

    const [reglasBase, productos, reglas] = await Promise.all([
        obtenerReglasBase(),
        obtenerProductos(),
        await obtenerReglas(),
    ]);
}
function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Reglas de precios</h1>
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
                </div>
                <div class="acciones-grande">
                    <button class="nueva-regla btn origin"><i class='bx bx-plus'></i> <span>Nueva regla</span></button>
                    <button class="precios-base btn especial"><i class='bx bx-money'></i> <span>Precios base</span></button>
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
            </div>
            <div class="no-encontrado" style="display: none; text-align: center; color: #555; font-size: 1.1rem;padding:20px">
                <i class='bx bx-file-blank' style="font-size: 50px;opacity:0.5"></i>
                <p style="text-align: center; color: #555;">¡Ups!, No se encontraron registros segun tu busqueda o filtrado.</p>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="nueva-regla btn origin"><i class='bx bx-plus'></i> Nueva regla</button>
            <button class="precios-base btn especial"><i class='bx bx-money'></i> Precios base</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '70px';
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
function updateHTMLWithData() {
    // Update productos
    const productosContainer = document.querySelector('.productos-container');
    const productosHTML = reglasProduccion.map(regla => `
        <div class="registro-item" data-id="${regla.id}">
            <div class="header">
                <i class='bx bx-book'></i>
                <div class="info-header">
                    <span class="id-flotante"><span>${regla.id}</span></span>
                    <span class="detalle"><strong>${regla.producto}</strong></span>
                    <span class="pie">${regla.etiq != 1 ? 'Etiquetado: x' + regla.etiq : ''}${regla.sell != 1 ? ' - Sellado: x' + regla.sell : ''}${regla.envs != 1 ? ' - Envasado: x' + regla.envs : ''}${regla.cern != preciosBase.cernido ? ' - Cernido: ' + regla.cern : ''}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosReglas();
}


function eventosReglas() {
    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.search');
    const nuevaRegla = document.querySelectorAll('.nueva-regla');
    const btnPreciosBase = document.querySelectorAll('.precios-base');
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

    function aplicarFiltros() {
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = reglasProduccion.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.producto,
                    registroData.gramos?.toString(),
                    registroData.lote?.toString(),
                    registroData.fecha,
                    registroData.nombre,
                    registroData.proceso
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

    window.info = function (registroId) {

        const registro = reglasProduccion.find(r => r.id === registroId);
        if (!registro) return;

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">${registro.producto}</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
            <p class="normal">Información de la regla</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                <span class="valor"><strong><i class="ri-scales-line"></i> Producto: </strong>${registro.producto}</span>
            </div>
            <p class="normal">Reglas</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-package'></i> Etiquetado: </strong>x${registro.etiq}</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Envasado: </strong>x${registro.envs}</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Sellado: </strong>x${registro.sell}</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Cernido: </strong>${registro.cern}</span>
                ${registro.grMax ? `<span class="valor"><strong><i class='bx bx-package'></i> Gramaje maximo: </strong>${registro.grMax} gr</span>` : ''}
                ${registro.grMin ? `<span class="valor"><strong><i class='bx bx-package'></i> Gramaje minimo: </strong>${registro.grMin} gr</span>` : ''}
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i>Eliminar regla</button>
        </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        const btnEliminar = contenido.querySelector('.btn-eliminar');

        btnEliminar.addEventListener('click', () => eliminar(registro));


        function eliminar(registro) {

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Eliminar registro</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información de la regla</p>
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                    <span class="valor"><strong><i class="ri-scales-line"></i> Producto: </strong>${registro.producto}</span>
                </div>
                <p class="normal">Reglas</p>
                <div class="campo-vertical">
                    <span class="valor"><strong><i class='bx bx-package'></i> Etiquetado: </strong>x${registro.etiq}</span>
                    <span class="valor"><strong><i class='bx bx-package'></i> Envasado: </strong>x${registro.envs}</span>
                    <span class="valor"><strong><i class='bx bx-package'></i> Sellado: </strong>x${registro.sell}</span>
                    <span class="valor"><strong><i class='bx bx-package'></i> Cernido: </strong>${registro.cern}</span>
                    ${registro.grMax ? `<span class="valor"><strong><i class='bx bx-package'></i> Gramaje maximo: </strong>${registro.grMax} gr</span>` : ''}
                    ${registro.grMin ? `<span class="valor"><strong><i class='bx bx-package'></i> Gramaje minimo: </strong>${registro.grMin} gr</span>` : ''}
                </div>
                <p class="normal">Motivo de la eliminación</p>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Motivo</p>
                        <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
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
                    spinBoton(btnEliminar);
                    const response = await fetch(`/eliminar-regla/${registroId}`, {
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
                        await obtenerReglas();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Regla eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                    } else {
                        throw new Error(data.error || 'Error al eliminar la regla');
                    }
                } catch (error) {   
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar la regla',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    stopSpinBoton(btnEliminar);
                }
            }
        }

    }

    nuevaRegla.forEach(btn => {
        btn.addEventListener('click', crearNuevaRegla);
    })
    btnPreciosBase.forEach(btn => {
        btn.addEventListener('click', verPreciosBase);
    })


    function crearNuevaRegla() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        // Primero mostrar la selección del tipo de regla
        const seleccionHTML = `
            <div class="encabezado">
                <h1 class="titulo">Nueva regla</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno nueva-regla">
                <p class="normal">Seleccione el tipo de regla</p>
                <div class="botones-seleccion campo-vertical" style="margin:0; padding:0; background:none;">
                    <button class="btn especial btn-por-producto">
                        <i class='bx bx-package'></i> Por Producto
                    </button>
                    <button class="btn especial btn-por-gramaje">
                        <i class='bx bx-line-chart'></i> Por Gramaje
                    </button>
                </div>
            </div>
        `;

        contenido.innerHTML = seleccionHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        // Agregar eventos a los botones
        contenido.querySelector('.btn-por-producto').addEventListener('click', mostrarFormularioProducto);
        contenido.querySelector('.btn-por-gramaje').addEventListener('click', mostrarFormularioGramaje);

        function mostrarFormularioProducto() {
            // Mantener el formulario existente para productos
            const formularioHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Nueva regla por producto</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno nueva-regla">
                    <p class="normal">Información básica</p>
                    <div class="entrada">
                        <i class='bx bx-cube'></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="sugerencias productos-list"></div>
                    ${mostrarCamposComunes()}
                </div>
                <div class="anuncio-botones">
                    <button class="btn-volver btn yellow"><i class='bx bx-arrow-back'></i> Volver</button>
                    <button class="btn-crear-regla btn orange"><i class="bx bx-plus"></i> Crear regla</button>
                </div>
            `;

            contenido.innerHTML = formularioHTML;
            configurarAutocompletado();
            configurarEventos('producto');
            configuracionesEntrada();
        }

        function mostrarFormularioGramaje() {
            const formularioHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Nueva regla por gramaje</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno nueva-regla">
                    <p class="normal">Información básica</p>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class="ri-scales-line"></i>
                            <div class="input">
                                <p class="detalle">Gr. Mínimo</p>
                                <input class="gr-minimo" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class="ri-scales-line"></i>
                            <div class="input">
                                <p class="detalle">Gr. Máximo</p>
                                <input class="gr-maximo" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>

                    </div>
                    ${mostrarCamposComunes()}
                    <div class="entrada">
                        <i class='bx bx-cube'></i>
                        <div class="input">
                            <p class="detalle">Producto</p>
                            <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="sugerencias productos-list"></div>
                </div>
                <div class="anuncio-botones">
                    <button class="btn-volver btn yellow"><i class='bx bx-arrow-back'></i> Volver</button>
                    <button class="btn-crear-regla btn orange"><i class="bx bx-plus"></i> Crear regla</button>
                </div>
            `;

            contenido.innerHTML = formularioHTML;
            configurarEventos('gramaje');
            configurarAutocompletado(); // <-- AGREGA ESTA LÍNEA AQUÍ
            configuracionesEntrada();
        }

        function mostrarCamposComunes() {
            return `
                <p class="normal">Reglas de multiplicación</p>
                <div class="entrada">
                    <i class='bx bx-tag'></i>
                    <div class="input">
                        <p class="detalle">Etiquetado (x1 por defecto)</p>
                        <select class="multiplicador-etiquetado">
                            <option value="1" selected>x1</option>
                            <option value="2">x2</option>
                            <option value="3">x3</option>
                            <option value="4">x4</option>
                            <option value="5">x5</option>
                        </select>
                    </div>
                </div>
    
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Envasado (x1 por defecto)</p>
                        <select class="multiplicador-envasado">
                            <option value="1" selected>x1</option>
                            <option value="2">x2</option>
                            <option value="3">x3</option>
                            <option value="4">x4</option>
                            <option value="5">x5</option>
                        </select>
                    </div>
                </div>
    
                <div class="entrada">
                    <i class='bx bx-purchase-tag'></i>
                    <div class="input">
                        <p class="detalle">Sellado (x1 por defecto)</p>
                        <input 
                            class="multiplicador-sellado" 
                            type="number" 
                            value="1" 
                            step="0.001" 
                            min="0.001" 
                            placeholder=" "
                            lang="en"
                            inputmode="decimal"
                            pattern="[0-9]*[.,]?[0-9]*">
                    </div>
                </div>
    
                <div class="entrada">
                    <i class="ri-filter-line"></i>
                    <div class="input">
                        <p class="detalle">Cernido especial (1 por defecto)</p>
                        <input 
                            class="precio-cernido" 
                            type="number" 
                            value="${preciosBase.cernido}" 
                            step="0.001" 
                            min="0.001" 
                            placeholder=" "
                            lang="en"
                            inputmode="decimal"
                            pattern="[0-9]*[.,]?[0-9]*">
                    </div>
                </div>
            `;
        }

        function configurarAutocompletado() {
            const sugerenciasList = document.querySelectorAll('.productos-list');
            const productoInput = document.querySelectorAll('.entrada .producto');

            productoInput.forEach((input, index) => {
                input.addEventListener('input', (e) => {
                    const valor = normalizarTexto(e.target.value);
                    const lista = sugerenciasList[index]; // usar la lista correspondiente
                    lista.innerHTML = '';

                    if (valor) {
                        const sugerencias = productosGlobal.filter(p =>
                            normalizarTexto(p.producto).includes(valor)
                        ).slice(0, 5);

                        if (sugerencias.length) {
                            lista.style.display = 'flex';
                            sugerencias.forEach(p => {
                                const div = document.createElement('div');
                                div.classList.add('item');
                                div.textContent = `${p.producto} ${p.gramos}gr.`;
                                div.onclick = () => {
                                    input.value = p.producto;
                                    lista.style.display = 'none';
                                };
                                lista.appendChild(div);
                            });
                        } else {
                            lista.style.display = 'none';
                        }
                    } else {
                        lista.style.display = 'none';
                    }
                });

                // Opcional: ocultar sugerencias si pierde foco
                input.addEventListener('blur', () => {
                    setTimeout(() => {
                        sugerenciasList[index].style.display = 'none';
                    }, 200);
                });
            });
        }


        function configurarEventos(tipo) {

            const btnVolver = contenido.querySelector('.btn-volver');
            const btnCrear = contenido.querySelector('.btn-crear-regla');

            btnVolver.addEventListener('click', () => {
                contenido.innerHTML = seleccionHTML;
                contenido.querySelector('.btn-por-producto').addEventListener('click', mostrarFormularioProducto);
                contenido.querySelector('.btn-por-gramaje').addEventListener('click', mostrarFormularioGramaje);
            });

            btnCrear.addEventListener('click', () => confirmarCreacion(tipo));
        }

        async function confirmarCreacion(tipo) {
            try {
                spinBoton(btnCrear);
                let producto = '';
                let gramajeMin = null;
                let gramajeMax = null;

                if (tipo === 'producto') {
                    producto = document.querySelector('.producto').value.trim();
                    if (!producto) {
                        throw new Error('Por favor ingrese un nombre de producto');
                    }
                } else {
                    gramajeMin = document.querySelector('.gr-minimo').value;
                    gramajeMax = document.querySelector('.gr-maximo').value;
                    producto = document.querySelector('.producto').value.trim();
                    if (!gramajeMin || !gramajeMax) {
                        throw new Error('Por favor ingrese ambos rangos de gramaje');
                    }
                    if (parseInt(gramajeMin) > parseInt(gramajeMax)) {
                        throw new Error('El gramaje mínimo debe ser menor o igual que el máximo');
                    }
                    producto = `Regla ${gramajeMin}gr-${gramajeMax}gr(${producto})`;
                }

                const etiquetado = document.querySelector('.multiplicador-etiquetado').value;
                const envasado = document.querySelector('.multiplicador-envasado').value;
                const sellado = document.querySelector('.multiplicador-sellado').value.replace(',', '.');
                const cernido = document.querySelector('.precio-cernido').value.replace(',', '.');

                const response = await fetch('/agregar-reglas-multiples', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        producto,
                        reglas: {
                            etiquetado: Number(etiquetado),
                            envasado: Number(envasado),
                            sellado: Number(sellado),
                            cernido: Number(cernido)
                        },
                        gramajeMin: gramajeMin ? parseInt(gramajeMin) : null,
                        gramajeMax: gramajeMax ? parseInt(gramajeMax) : null
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error en la petición al servidor');
                }

                const result = await response.json();
                if (result.success) {
                    await obtenerReglas();
                    info(result.id);
                    mostrarNotificacion({
                        message: 'Regla creada correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error(result.error || 'Error al guardar la regla');
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
    async function verPreciosBase() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Precios base</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno nueva-regla">
            <p class="normal">Información de precios base</p>
            <div class="entrada cernido-container">
                <i class="ri-article-line"></i>
                <div class="input">
                    <p class="detalle">Etiquetado</p>
                    <input class="etiquetado" type="number" value="${preciosBase.etiquetado}" autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <div class="entrada cernido-container">
                <i class="ri-article-line"></i>
                <div class="input">
                    <p class="detalle">Cernido</p>
                    <input class="cernido" type="number" value="${preciosBase.cernido}"  autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <div class="entrada cernido-container">
                <i class="ri-article-line"></i>
                <div class="input">
                    <p class="detalle">Envasado</p>
                    <input class="envasado" type="number" value="${preciosBase.envasado}"  autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <div class="entrada cernido-container">
                <i class="ri-article-line"></i>
                <div class="input">
                    <p class="detalle">Sellado</p>
                    <input class="sellado" type="number" value="${preciosBase.sellado}" autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <p class="normal">Motivo de la modificación</p>
            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Motivo</p>
                    <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-guardar-base btn orange"><i class="bx bx-save"></i> Guardar cambios</button>
        </div>
        `;

        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        const btnGuardar = contenido.querySelector('.btn-guardar-base');
        btnGuardar.addEventListener('click', confirmarCambios);

        async function confirmarCambios() {
            const etiquetado = document.querySelector('.etiquetado').value;
            const cernido = document.querySelector('.cernido').value;
            const envasado = document.querySelector('.envasado').value;
            const sellado = document.querySelector('.sellado').value;
            const motivo = document.querySelector('.motivo').value;

            if (!motivo) { // Solo el campo "Motivo" es obligatorio
                mostrarNotificacion({
                    message: 'Debe ingresar el motivo del cambio',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                spinBoton(btnGuardar);
                const response = await fetch(`/actualizar-precios-base`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        etiquetado: etiquetado,
                        envasado: envasado,
                        sellado: sellado,
                        cernido: cernido
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    await obtenerReglasBase();
                    verPreciosBase();
                    mostrarNotificacion({
                        message: 'Precios base actualizados correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error(data.error || 'Error al actualizar los precios base');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al procesar la operación',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                stopSpinBoton(btnGuardar);
            }
        }
    }
    aplicarFiltros();
}