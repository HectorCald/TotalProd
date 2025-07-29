let clientes = [];

const DB_NAME = 'damabrava_db';
const CLIENTES_DB = 'clientes';

async function obtenerClientes() {
    try {

        const clientesCache = await obtenerLocal(CLIENTES_DB, DB_NAME);

        if (clientesCache.length > 0) {
            clientes = clientesCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            renderInitialHTML();
            updateHTMLWithData();
            console.log('actualizando desde el cache(Clientes)')
        }
        try {

            const response = await fetch('/obtener-clientes');
            const data = await response.json();

            if (data.success) {
                clientes = data.clientes.sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });

                if (clientes.length === 0) {
                    console.log('no hay registros');
                    renderInitialHTML();
                    updateHTMLWithData();
                }

                if (JSON.stringify(clientesCache) !== JSON.stringify(clientes)) {
                    console.log('Diferencias encontradas, actualizando UI');
                    renderInitialHTML();
                    updateHTMLWithData();
                    (async () => {
                        try {
                            const db = await initDB(CLIENTES_DB, DB_NAME);
                            const tx = db.transaction(CLIENTES_DB, 'readwrite');
                            const store = tx.objectStore(CLIENTES_DB);

                            // Limpiar todos los registros existentes
                            await store.clear();

                            // Guardar los nuevos registros
                            for (const item of clientes) {
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
        console.error('Error al obtener clientes:', error);
        return false;
    }
}


export async function mostrarClientes() {
    renderInitialHTML();
    mostrarAnuncio();

    const [clientes] = await Promise.all([
        await obtenerClientes()
    ]);
}
function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Clientes</h1>
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
            </div>
            <div class="acciones-grande">
                <button class="btn-crear-cliente btn origin"> <i class='bx bx-plus'></i> <span>Crear nuevo cliente</span></button>
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
                <i class='bx bx-id-card' style="font-size: 50px;opacity:0.5"></i>
                <p style="text-align: center; color: #555;">¡Ups!, No se encontraron clientes segun tu busqueda o filtrado.</p>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-crear-cliente btn origin"> <i class='bx bx-plus'></i> Crear nuevo cliente</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '70px';
    setTimeout(() => {
        configuracionesEntrada();
    }, 100)
}
function updateHTMLWithData() {
    const productosContainer = document.querySelector('.productos-container');
    const productosHTML = clientes.map(cliente => `
        <div class="registro-item" data-id="${cliente.id}">
            <div class="header">
                <i class='bx bx-id-card'></i>
                <div class="info-header">
                    <span class="id-flotante"><span>${cliente.id}</span><span class="flotante-item blue">${cliente.ciudad? cliente.ciudad: 'No tiene ciudad'}</span></span>
                    <span class="detalle">${cliente.nombre}</span>
                    <span class="pie">${cliente.telefono}-${cliente.direccion ? cliente.direccion : 'No tiene dirección'}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
    eventosClientes();
}


function eventosClientes() {
    const inputBusqueda = document.querySelector('.search');
    const btnNuevoCliente = document.querySelectorAll('.btn-crear-cliente');
    const items = document.querySelectorAll('.registro-item');
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
            const clienteId = this.dataset.id;
            window.info(clienteId);
        });
    });
    inputBusqueda.addEventListener('input', (e) => {
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function() {
        this.select();
    });
    function aplicarFiltros() {
        const busqueda = normalizarTexto(inputBusqueda.value);
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Animación de ocultar todos
        items.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(-20px)';
            item.style.transition = 'all 0.3s ease';
        });

        setTimeout(() => {
            let hayResultados = false;

            items.forEach(item => {
                const cliente = clientes.find(c => c.id === item.dataset.id);
                const coincide = cliente && (
                    normalizarTexto(cliente.nombre).includes(busqueda) ||
                    normalizarTexto(cliente.telefono).includes(busqueda) ||
                    normalizarTexto(cliente.direccion).includes(busqueda) ||
                    normalizarTexto(cliente.ciudad).includes(busqueda)
                );

                item.style.display = coincide ? 'flex' : 'none';
                if (coincide) hayResultados = true;
            });

            // Animación escalonada para los resultados
            document.querySelectorAll('.registro-item[style*="display: flex"]').forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50);
            });

            // Control del mensaje "no encontrado"
            mensajeNoEncontrado.style.display = hayResultados ? 'none' : 'block';
        }, 300);
    }

    
    window.info = function (clienteId) {
        const cliente = clientes.find(r => r.id === clienteId);
        if (!cliente) return;

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">${cliente.nombre}</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond');"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno verificar-registro">
                <p class="normal">Información</p>
                <div class="campo-vertical">
                    <div class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Id: </span>${cliente.id}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-user'></i> Nombre: </span>${cliente.nombre}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-phone'></i> Teléfono: </span>${cliente.telefono || 'No registrado'}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bx-map'></i> Dirección: </span>${cliente.direccion || 'No registrada'}</div>
                    <div class="detalle"><span class="concepto"><i class='bx bxs-city'></i> Ciudad: </span>${cliente.ciudad || 'No registrada'}</div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-editar btn blue" data-id="${cliente.id}"><i class='bx bx-edit'></i>Editar</button>
                <button class="btn-eliminar btn red" data-id="${cliente.id}"><i class="bx bx-trash"></i>Eliminar</button>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        const btnEditar = contenido.querySelector('.btn-editar');
        const btnEliminar = contenido.querySelector('.btn-eliminar');

        btnEditar.addEventListener('click', () => editar(cliente));
        btnEliminar.addEventListener('click', () => eliminar(cliente));

        async function eliminar(cliente) {
    
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Eliminar cliente</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer');"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal">Información</p>
                    <div class="campo-vertical">
                        <div class="detalle"><span class="concepto"><i class='bx bx-id-card'></i> Id: </span>${cliente.id}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-user'></i> Nombre: </span>${cliente.nombre}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-phone'></i> Teléfono: </span>${cliente.telefono || 'No registrado'}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bx-map'></i> Dirección: </span>${cliente.direccion || 'No registrada'}</div>
                        <div class="detalle"><span class="concepto"><i class='bx bxs-city'></i> Ciudad: </span>${cliente.ciudad || 'No registrada'}</div>
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
                            <p>Vas a eliminar un cliente del sistema. Esta acción no se puede deshacer y podría afectar a varios registros relacionados. Asegúrate de que deseas continuar.</p>
                        </div>
                    </div>

                </div>
                <div class="anuncio-botones">
                    <button class="btn-eliminar-cliente-confirmar btn red"><i class="bx bx-trash"></i> Confirmar eliminación</button>
                </div>
            `;
            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();
    
            const btnEliminarCliente = contenido.querySelector('.btn-eliminar-cliente-confirmar');
            btnEliminarCliente.addEventListener('click', async () => {
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
                    const response = await fetch(`/eliminar-cliente/${clienteId}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerClientes();
                        cerrarAnuncioManual('anuncioSecond');
                        mostrarNotificacion({
                            message: 'Cliente eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Eliminación',
                            usuarioInfo.nombre + ' elimino al cliente: '+cliente.nombre+' con el id: '+cliente.id+' por el motivo de: '+motivo)
                    } else {
                        throw new Error('Error al eliminar el cliente');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar el cliente',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }
        async function editar(cliente) {
    
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Editar cliente</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer');"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información</p>
                <div class="entrada">
                    <i class='bx bx-user'></i>
                    <div class="input">
                        <p class="detalle">Nombre</p>
                        <input class="editar-nombre" type="text" value="${cliente.nombre}" required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-phone'></i>
                    <div class="input">
                        <p class="detalle">Teléfono</p>
                        <input class="editar-telefono" type="text" value="${cliente.telefono || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-map'></i>
                    <div class="input">
                        <p class="detalle">Dirección</p>
                        <input class="editar-direccion" type="text" value="${cliente.direccion || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bxs-city'></i>
                    <div class="input">
                        <p class="detalle">Ciudad</p>
                        <input class="editar-ciudad" type="text" value="${cliente.ciudad || ''}">
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
                        <p>Estás por editar un cliente del sistema. Asegúrate de realizar los cambios correctamente, ya que podrían modificar información relacionada.</p>
                    </div>
                </div>

            </div>
            <div class="anuncio-botones">
                <button class="btn-guardar-cliente btn blue"><i class="bx bx-save"></i> Guardar cambios</button>
            </div>
        `;
            contenido.innerHTML = registrationHTML;
            contenido.style.paddingBottom = '70px';
            mostrarAnuncioTercer();
    
            const btnGuardarCliente = contenido.querySelector('.btn-guardar-cliente');
            btnGuardarCliente.addEventListener('click', async () => {
                const nombre = document.querySelector('.editar-nombre').value.trim();
                const telefono = document.querySelector('.editar-telefono').value.trim();
                const direccion = document.querySelector('.editar-direccion').value.trim();
                const ciudad = document.querySelector('.editar-ciudad').value.trim();
                const motivo = document.querySelector('.motivo').value.trim();
    
                if (!nombre) {
                    mostrarNotificacion({
                        message: 'El nombre es obligatorio',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }
    
                try {
                    mostrarCarga('.carga-procesar');
                    const response = await fetch(`/editar-cliente/${clienteId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nombre, telefono, direccion, ciudad, motivo })
                    });
                    const data = await response.json();
                    if (data.success) {
                        await obtenerClientes();
                        info(clienteId)
                        mostrarNotificacion({
                            message: 'Cliente actualizado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        registrarNotificacion(
                            'Administración',
                            'Edición',
                            usuarioInfo.nombre + ' edito al cliente: '+cliente.nombre+' con el id: '+cliente.id+' por el motivo de: '+motivo)
                    } else {
                        throw new Error('Error al actualizar el cliente');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al actualizar el cliente',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga('.carga-procesar');
                }
            });
        }
    }
    btnNuevoCliente.forEach(btn => {
        btn.addEventListener('click',  crearCliente);
    })
    async function crearCliente() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Crear nuevo cliente</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal">Información</p>
                <div class="entrada">
                    <i class='bx bx-user'></i>
                    <div class="input">
                        <p class="detalle">Nombre</p>
                        <input class="nuevo-nombre" type="text" required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-phone'></i>
                    <div class="input">
                        <p class="detalle">Teléfono</p>
                        <input class="nuevo-telefono" type="text">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-map'></i>
                    <div class="input">
                        <p class="detalle">Dirección</p>
                        <input class="nuevo-direccion" type="text">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bxs-city'></i>
                    <div class="input">
                        <p class="detalle">Ciudad</p>
                        <input class="nuevo-ciudad" type="text">
                    </div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-guardar-nuevo-cliente btn origin"><i class="bx bx-save"></i> Guardar cliente</button>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '70px';
        mostrarAnuncioSecond();

        const btnGuardarNuevoCliente = contenido.querySelector('.btn-guardar-nuevo-cliente');
        btnGuardarNuevoCliente.addEventListener('click', async () => {
            const nombre = document.querySelector('.nuevo-nombre').value.trim();
            const telefono = document.querySelector('.nuevo-telefono').value.trim();
            const direccion = document.querySelector('.nuevo-direccion').value.trim();
            const ciudad = document.querySelector('.nuevo-ciudad').value.trim();

            if (!nombre) {
                mostrarNotificacion({
                    message: 'El nombre es obligatorio',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                spinBoton(btnGuardarNuevoCliente);
                const response = await fetch('/agregar-cliente', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre, telefono, direccion, ciudad })
                });

                const data = await response.json();

                if (data.success) {
                    await obtenerClientes();
                    info(data.id);
                    mostrarNotificacion({
                        message: 'Cliente creado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error('Error al crear el cliente');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al crear el cliente',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                stopSpinBoton(btnGuardarNuevoCliente);
            }
        });
    }
    aplicarFiltros();
}