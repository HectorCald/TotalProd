let productosGlobal = [];
let configuracionHorario = {
    horaInicio: '',
    horaFin: '',
    estado: ''
};
const DB_NAME = 'damabrava_db';
const PRODUCTOS_FORM_db = 'productos_form';

async function verificarHorarioProduccion() {
    try {
        mostrarCarga('.carga-obtener')
        const response = await fetch('/obtener-configuraciones');
        const data = await response.json();

        if (!data.success) {
            throw new Error('No se pudieron obtener las configuraciones');
        }

        const { horario, sistema } = data.configuraciones;

        // Guardar configuración en variable global
        configuracionHorario = {
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            estado: sistema.estado
        };

        // Verificar si el sistema está activo
        if (sistema.estado !== 'Activo') {
            return {
                permitido: false,
                horario: 'Sistema inactivo'
            };
        }

        const horaActual = new Date();
        const [horaInicio, minutosInicio] = horario.horaInicio.split(':').map(Number);
        const [horaFin, minutosFin] = horario.horaFin.split(':').map(Number);

        const tiempoActual = horaActual.getHours() * 60 + horaActual.getMinutes();
        const tiempoInicio = horaInicio * 60 + minutosInicio;
        const tiempoFin = horaFin * 60 + minutosFin;

        return {
            permitido: tiempoActual >= tiempoInicio && tiempoActual <= tiempoFin,
            horario: `${configuracionHorario.horaInicio} a ${configuracionHorario.horaFin}`
        };
    } catch (error) {
        console.error('Error al verificar horario:', error);
        if (error.message === 'cancelled') {
            console.log('Operación cancelada por el usuario');
            return;
        }
        return {
            permitido: false,
            horario: 'Error al verificar horario'
        };
    } finally {
        ocultarCarga('.carga-obtener')
    }
}


async function obtenerProductos() {
    try {
        mostrarCarga('.carga-obtener')

        const productosFormCache = await obtenerLocal(PRODUCTOS_FORM_db, DB_NAME);

        if (productosFormCache.length > 0) {
            productosGlobal = productosFormCache.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            console.log('actulizando desde el cache')
        }

        const response = await fetch('/obtener-productos-form');
        const data = await response.json();

        if (data.success) {
            productosGlobal = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });


            if (JSON.stringify(productosFormCache) !== JSON.stringify(productosGlobal)) {
                console.log('Diferencias encontradas, actualizando UI');

                (async () => {
                    try {
                        const db = await initDB(PRODUCTOS_FORM_db, DB_NAME);
                        const tx = db.transaction(PRODUCTOS_FORM_db, 'readwrite');
                        const store = tx.objectStore(PRODUCTOS_FORM_db);

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
            else {
                console.log('no son diferentes')
            }

            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return false;
    } finally {
        ocultarCarga('.carga-obtener')
    }
}
export async function mostrarFormularioProduccion() {
    const horarioValido = await verificarHorarioProduccion();
    if (!horarioValido.permitido) {
        let mensaje = configuracionHorario.estado !== 'Activo'
            ? 'Sistema inactivo temporalmente'
            : `Fuera de horario de producción (${configuracionHorario.horaInicio} a ${configuracionHorario.horaFin})`;

        mostrarNotificacion({
            message: mensaje,
            type: 'warning',
            duration: 4000
        });
        return;
    }
    mostrarAnuncio();
    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Nueva producción</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
        <p class="normal">Producto</p>
            <div class="entrada">
                <i class="ri-box-3-line"></i>
                <div class="input">
                    <p class="detalle">Producto</p>
                    <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <div class="sugerencias" id="productos-list"></div>
            <div class="campo-horizontal">
                <div class="entrada">
                    <i class="ri-scales-line"></i>
                    <div class="input">
                        <p class="detalle">Gramaje</p>
                        <input class="gramaje" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " readonly required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-spreadsheet'></i>
                    <div class="input">
                        <p class="detalle">Lote</p>
                        <input class="lote" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                    </div>
                </div>
            </div>
            <p class="normal">Procesos</p>
            <div class="entrada">
                <i class='bx bx-git-compare'></i>
                <div class="input">
                    <p class="detalle">Proceso</p>
                    <select class="proceso" required>
                        <option value="" disabled selected></option>
                        <option value="Cernido">Cernido</option>
                        <option value="Seleccion">Selección</option>
                        <option value="Ninguno">Ninguno</option>
                    </select>
                </div>
            </div>
            <div class="campo-horizontal">
                <div class="entrada">
                    <i class='bx bx-bowl-hot'></i>
                    <div class="input">
                        <p class="detalle">Microondas</p>
                        <select class="select" required>
                            <option value="" disabled selected></option>
                            <option value="Si">Si</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
                <div class="entrada" style="display:none">
                    <i class='bx bx-time'></i>
                    <div class="input">
                        <p class="detalle">Tiempo</p>
                        <input class="microondas" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                    </div>
                </div>
            </div>
            <p class="normal">Acabado</p>
            <div class="entrada">
                <i class='bx bxs-cube-alt'></i>
                <div class="input">
                    <p class="detalle">Envases terminados</p>
                    <input class="envasados" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-calendar'></i>
                <div class="input">
                    <p class="detalle">Fecha de vencimiento</p>
                    <input class="vencimiento" type="month" placeholder=" " required>
                </div>
            </div>
            <div class="busqueda">
                <div class="acciones-grande" style="min-width:100%">
                    <button class="btn-registrar btn origin" style="min-width:100%"><i class="bx bx-notepad"></i> Registrar</button>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-registrar btn origin"><i class="bx bx-notepad"></i> Registrar</button>
        </div>
    `;

    contenido.innerHTML = registrationHTML;
    contenido.style.paddingBottom = '70px';
    contenido.style.maxWidth = '450px';
    await obtenerProductos();
    evetosFormularioProduccion();
    configuracionesEntrada();
}
function evetosFormularioProduccion() {
    const selectMicroondas = document.querySelector('.select');
    const entradaTiempo = document.querySelector('.microondas').closest('.entrada');
    const productoInput = document.querySelector('.entrada .producto');
    const sugerenciasList = document.querySelector('#productos-list');
    const gramajeInput = document.querySelector('.entrada .gramaje');
    const registrar = document.querySelectorAll('.btn-registrar');
    const contenedor = document.querySelector('.anuncio .relleno');


    entradaTiempo.style.display = 'none';

    selectMicroondas.addEventListener('change', () => {
        if (selectMicroondas.value === 'Si') {
            entradaTiempo.style.display = 'flex';
            entradaTiempo.querySelector('.microondas').focus();
        } else {
            entradaTiempo.style.display = 'none';
        }
    });
    productoInput.addEventListener('input', (e) => {
        const valor = normalizarTexto(e.target.value);

        sugerenciasList.innerHTML = '';

        if (valor) {
            const sugerencias = productosGlobal.filter(p =>
                normalizarTexto(p.producto+p.gramos).includes(valor)
            ).slice(0, 10);

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
    registrar.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Get all form values
            const producto = productoInput.value.trim();
            const idProducto = window.idPro;
            const lote = document.querySelector('.entrada .lote').value; // Fixed selector
            const gramos = gramajeInput.value;
            const proceso = document.querySelector('.proceso').value;
            const microondas = selectMicroondas.value;
            const tiempo = document.querySelector('.microondas').value;
            const envasados = document.querySelector('.envasados').value;
            const vencimiento = document.querySelector('.vencimiento').value;
    
            // Individual field validations
            if (!producto) {
                mostrarNotificacion({
                    message: 'Ingrese el producto',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            if (!lote) {
                mostrarNotificacion({
                    message: 'Ingrese el lote',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            if (!gramos) {
                mostrarNotificacion({
                    message: 'Ingrese el gramaje',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            if (!proceso) {
                mostrarNotificacion({
                    message: 'Seleccione el proceso',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            if (!microondas) {
                mostrarNotificacion({
                    message: 'Seleccione si usa microondas',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            if (microondas === 'Si' && !tiempo) {
                mostrarNotificacion({
                    message: 'Ingrese el tiempo de microondas',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            if (!envasados) {
                mostrarNotificacion({
                    message: 'Ingrese la cantidad de envases',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            if (!vencimiento) {
                mostrarNotificacion({
                    message: 'Seleccione la fecha de vencimiento',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            // Validate product exists
            const productoExiste = productosGlobal.some(p =>
                normalizarTexto(p.producto) === normalizarTexto(producto)
            );
    
            if (!productoExiste) {
                mostrarNotificacion({
                    message: 'El producto no existe en el inventario',
                    type: 'error',
                    duration: 3500
                });
                return;
            }
    
            try {
                registrar.forEach(btn => {
                    spinBoton(btn);
                });

                const response = await fetch('/registrar-produccion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idProducto,
                        producto,
                        lote,
                        gramos,
                        proceso,
                        microondas,
                        tiempo: microondas === 'No' ? 'No' : tiempo,
                        envasados,
                        vencimiento
                    })
                });
    
                const data = await response.json();
    
                if (data.success) {
                    mostrarNotificacion({
                        message: 'Producción registrada correctamente',
                        type: 'success',
                        duration: 3000
                    });
                    registrarNotificacion(
                        'Almacen',
                        'Creación',
                        usuarioInfo.nombre + ' registro una nueva producción de ' + producto)
                    mostrarFormularioProduccion();
                } else {
                    throw new Error(data.error || 'Error al registrar la producción');
                }
            } catch (error) {
                console.error('Error en registro:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al registrar la producción',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                registrar.forEach(btn => {
                    stopSpinBoton(btn);
                });
            }
        });
    });
}
