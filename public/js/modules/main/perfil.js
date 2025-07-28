import { borrarFCMToken } from './notificaciones.js';

async function obtenerUsuario() {
    try {
        const response = await fetch('/obtener-usuario-actual');
        const data = await response.json();

        if (data.success) {
            const nombreCompleto = data.usuario.nombre.split(' ');
            usuarioInfo = {
                id: data.usuario.id,
                nombre: nombreCompleto[0] || '',
                apellido: nombreCompleto[1] || '',
                telefono: data.usuario.telefono,
                email: data.usuario.email,
                rol: data.usuario.rol,
                estado: data.usuario.estado,
                plugins: data.usuario.plugins
            };

            // Procesar la foto
            if (!data.usuario.foto || data.usuario.foto === './icons/icon.png') {
                usuarioInfo.foto = './icons/icon.png';
            } else if (data.usuario.foto.startsWith('data:image')) {
                usuarioInfo.foto = data.usuario.foto;
            } else {
                try {
                    const imgResponse = await fetch(data.usuario.foto);
                    if (!imgResponse.ok) throw new Error('Error al cargar la imagen');
                    const blob = await imgResponse.blob();
                    usuarioInfo.foto = URL.createObjectURL(blob);
                } catch (error) {
                    console.error('Error al cargar imagen:', error);
                    usuarioInfo.foto = './icons/icon.png';
                }
            }

            // Guardar en localStorage después de obtener del servidor
            localStorage.setItem('damabrava_usuario', JSON.stringify(usuarioInfo));
            return true;
        } else {
            // Si falla el servidor, intentar recuperar del localStorage
            const usuarioGuardado = localStorage.getItem('damabrava_usuario');
            if (usuarioGuardado) {
                usuarioInfo = JSON.parse(usuarioGuardado);
                return true;
            }

            mostrarNotificacion({
                message: 'Error al obtener datos del usuario',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        mostrarNotificacion({
            message: 'Error al obtener datos del usuario',
            type: 'error',
            duration: 3500
        });
        return false;
    } 
}


export async function crearPerfil(usuario) {
    const view = document.querySelector('.perfil-view');
    mostrarPerfil(view);
}
function mostrarPerfil(view) {
    const perfil = `
        <h1 class="titulo"><i class='bx bx-user'></i> Perfil</h1>
        <div class="info">
            <div class="detalles">
                <p class="subtitulo">Hola!</p>
                <p class="titulo nombre">${usuarioInfo.nombre} ${usuarioInfo.apellido}</p>
                <p class="correo-usuario">${usuarioInfo.email}</p>
                <p class="perfil-rol">${usuarioInfo.rol}</p>
            </div>
            <div class="foto">
                <img src="${usuarioInfo.foto}" alt="Foto de perfil" class="foto-perfil-img" onerror="this.src='./icons/icon.png'">
            </div>
        </div>
        <button class="apartado cuenta"><i class='bx bx-user'></i> Cuenta</button>
        <button class="apartado configuraciones"><i class='bx bx-cog'></i> Configuraciones</button>
        <button class="cerrar-sesion"><i class='bx bx-log-out'></i> Cerrar Sesión</button>
        <button class="soporte-tecnico">Soporte técnico</button>
        <p class="version"></p>
    `;
    view.innerHTML = perfil;

    // Configurar event listeners
    const btnCuenta = document.querySelector('.apartado.cuenta');
    const btnConfiguraciones = document.querySelector('.apartado.configuraciones');
    const btnCerrarSesion = document.querySelector('.cerrar-sesion');
    const versionCacheElement = document.querySelector('.version');
    
    if ('caches' in window) {
        caches.keys().then(keys => {
            // Busca el que empiece por 'totalprod-v'
            const cacheName = keys.find(key => key.startsWith('TotalProd v'));
            if (cacheName) {
                versionCacheElement.textContent = `${cacheName}`;
            } else {
                versionCacheElement.textContent = 'Sin versión';
            }
        });
    }

    btnCuenta.addEventListener('click', () => {
        mostrarCuenta(usuarioInfo.nombre, usuarioInfo.apellido, usuarioInfo.email, usuarioInfo.foto, usuarioInfo.telefono);
    });

    btnConfiguraciones.addEventListener('click', () => {
        mostrarConfiguraciones();
    });

    btnCerrarSesion.addEventListener('click', async () => {
        try {
            const response = await fetch('/cerrar-sesion', { method: 'POST' });
            if (response.ok) {
                mostrarCarga('.carga-procesar');
                limpiarProteccionNavegacion();
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            mostrarNotificacion({
                message: 'Error al cerrar sesión',
                type: 'error',
                duration: 3500
            });
        } finally {
            ocultarCarga('.carga-procesar');
        }
    });
}


function mostrarCuenta(nombre, apellido, email, foto, telefono) {
    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Tu cuenta</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="foto-perfil">
                <div class="preview-container">
                    <img src="${foto}" alt="Vista previa" id="preview-foto">
                    <label for="input-foto" class="upload-overlay">
                        <i class='bx bx-upload'></i>
                    </label>
                </div>
                <input type="file" id="input-foto" accept="image/*" style="display: none;">
            </div>
            <p class="normal">Información personal</p>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Nombre</p>
                    <input class="nombre" type="text" value="${nombre}" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Apellido</p>
                    <input class="nombre" type="text" value="${apellido}" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-phone'></i>
                <div class="input">
                    <p class="detalle">Teléfono</p>
                    <input class="telefono" type="tel" value="${telefono}" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-lock-alt'></i>
                <div class="input">
                    <p class="detalle">Contraseña Actual</p>
                    <input class="password-actual" type="password" placeholder=" "autocomplete="new-password" required>
                    <button class="toggle-password"><i class="fas fa-eye"></i></button>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-lock-alt'></i>
                <div class="input">
                    <p class="detalle">Nueva Contraseña</p>
                    <input class="password-nueva" type="password" placeholder=" " autocomplete="new-password" required>
                    <button class="toggle-password"><i class="fas fa-eye"></i></button>
                </div>
            </div>
            ${usuarioInfo.rol !== 'Administración' ? `
            <p class="normal">Permisos concedidos</p>
            <div class="permisos-container">
                <div class="campo-horizontal">
                    ${usuarioInfo.permisos.includes('eliminacion') ? '<label class="eliminacion"><span>Eliminación</span></label>' : '<label class="nulo"><span>Eliminación</span></label>'}
                    ${usuarioInfo.permisos.includes('edicion') ? '<label class="edicion"><span>Edición</span></label>' : '<label class="nulo"><span>Edición</span></label>'}
                </div>
                <div class="campo-horizontal">
                    ${usuarioInfo.permisos.includes('anulacion') ? '<label class="anulacion"><span>Anulación</span></label>' : '<label class="nulo"><span>Anulación</span></label>'}
                    ${usuarioInfo.permisos.includes('creacion') ? '<label class="creacion"><span>Creación</span></label>' : '<label class="nulo"><span>Creación</span></label>'}
                </div>
            </div>
            <p class="normal">Plugins habilitados</p>
            <div class="plugins-container">
                ${usuarioInfo.plugins.includes('calcularmp') ? '<label class="plugin"><span>Calculadora materia prima</span></label>' : '<label class="nulo"><span>Calculadora materia prima</span></label>'}
            </div>
            <div class="plugins-container">
                ${usuarioInfo.plugins.includes('tareasAc') ? '<label class="plugin"><span>Calculadora de tiempo en tareas</span></label>' : '<label class="nulo"><span>Calculadora de tiempo en tareas</span></label>'}
            </div>`: ''}
            <div class="busqueda">
                <div class="acciones-grande" style="min-width:100%;">
                    <button class="btn-guardar btn origin" style="min-width:100%"><i class="bx bx-save"></i> Guardar cambios</button>
                </div>
            </div>
        </div>
        
        <div class="anuncio-botones">
            <button class="btn-guardar btn origin"><i class="bx bx-save"></i> Guardar cambios</button>
        </div>
    `;

    contenido.innerHTML = registrationHTML;
    contenido.style.paddingBottom = '80px';
    // Ajustar el padding para evitar que el botón quede oculto
    mostrarAnuncio();
    contenido.style.maxWidth = '450px';
    evetosCuenta();
    configuracionesEntrada();
}
function evetosCuenta() {
    const inputFoto = document.querySelector('#input-foto');
    const previewFoto = document.querySelector('#preview-foto');
    const btnGuardar = document.querySelectorAll('.btn-guardar');
    const telefonoInput = document.querySelector('.telefono');
    let fotoBase64 = null;
    let fotoModificada = false;



    // Initialize current photo
    const currentPhoto = previewFoto.src;
    if (currentPhoto.startsWith('data:image')) {
        fotoBase64 = currentPhoto;
    } else if (currentPhoto.startsWith('http') || currentPhoto.startsWith('./')) {
        fetch(currentPhoto)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    fotoBase64 = reader.result;
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Error loading current photo:', error);
                fotoBase64 = null;
            });
    }



    inputFoto.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                mostrarNotificacion({
                    message: 'Solo se permiten archivos de imagen',
                    type: 'error',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga();
                const img = new Image();
                const reader = new FileReader();

                reader.onload = function (e) {
                    img.src = e.target.result;
                };

                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Reducir más el tamaño máximo para móviles
                    const MAX_SIZE = 500; // Reducido de 800 a 500
                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Aumentar la compresión para móviles
                    const calidad = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 0.5 : 0.7;
                    fotoBase64 = canvas.toDataURL('image/jpeg', calidad);

                    // Verificar el tamaño de la cadena base64
                    if (fotoBase64.length > 2000000) { // Si es mayor a 2MB
                        mostrarNotificacion({
                            message: 'La imagen es demasiado grande, intenta con una más pequeña',
                            type: 'error',
                            duration: 3500
                        });
                        return;
                    }

                    previewFoto.src = fotoBase64;
                    fotoModificada = true;
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                mostrarNotificacion({
                    message: 'Error al procesar la imagen',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga();
            }
        }
    });
    btnGuardar.forEach(btn => {
        btn.addEventListener('click', async () => {
            const nombre = document.querySelector('input.nombre').value.trim();
            const telefono = document.querySelector('input.telefono').value.trim();
            const apellido = document.querySelectorAll('input.nombre')[1].value.trim();
            const passwordActual = document.querySelector('input.password-actual')?.value;
            const passwordNueva = document.querySelector('input.password-nueva')?.value;

            // Validaciones básicas
            if (!nombre || !apellido || !telefono) {
                mostrarNotificacion({
                    message: 'Nombre, apellido son requeridos y telefono son requeridos',
                    type: 'error',
                    duration: 3500
                });
                return;
            }

            if (!/^[67]\d{7}$/.test(telefono)) {
                mostrarNotificacion({
                    message: 'Ingrese un número válido de 8 dígitos (ej: 67644705)',
                    type: 'warning',
                    duration: 4000
                });
                return;
            }


            // Validación de contraseña nueva
            if (passwordNueva && passwordNueva.length < 8) {
                mostrarNotificacion({
                    message: 'La nueva contraseña debe tener al menos 8 caracteres',
                    type: 'error',
                    duration: 3500
                });
                return;
            }

            // Validar que ambas contraseñas estén presentes si se está cambiando
            if ((passwordActual && !passwordNueva) || (!passwordActual && passwordNueva)) {
                mostrarNotificacion({
                    message: 'Debe ingresar ambas contraseñas para cambiarla',
                    type: 'error',
                    duration: 3500
                });
                return;
            }

            try {
                btnGuardar.forEach(btn => {
                    spinBoton(btn);
                });
                const response = await fetch('/actualizar-usuario', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre,
                        apellido,
                        foto: fotoModificada ? fotoBase64 : undefined,
                        passwordActual: passwordActual || undefined,
                        passwordNueva: passwordNueva || undefined,
                        telefono
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error al actualizar el perfil');
                }
                await obtenerUsuario();
                mostrarPerfil(document.querySelector('.perfil-view'));
                mostrarNotificacion({
                    message: 'Perfil actualizado con éxito',
                    type: 'success',
                    duration: 3500
                });

            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al actualizar el perfil',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                btnGuardar.forEach(btn => {
                    stopSpinBoton(btn);
                });
            }
        });
    })
}


async function mostrarConfiguraciones() {
    const contenido = document.querySelector('.anuncio .contenido');
    const currentTheme = localStorage.getItem('theme') || 'system';

    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Tus configuraciones</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal">Tema de la aplicación</p>
            <div class="tema-selector">
                <button class="btn-tema ${currentTheme === 'light' ? 'active' : ''} dia" data-theme="light">
                    <i class='bx bx-sun'></i> Claro
                </button>
                <button class="btn-tema ${currentTheme === 'dark' ? 'active' : ''} noche" data-theme="dark">
                    <i class='bx bx-moon'></i> Oscuro
                </button>
                <button class="btn-tema ${currentTheme === 'system' ? 'active' : ''} sistema" data-theme="system">
                    <i class='bx bx-desktop'></i> Sistema
                </button>
            </div>
            ${usuarioInfo.rol === 'Administración' ? `
            <p class="normal">Almacen General</p>
            <div class="campo-horizontal">
                <button class="btn-subir-almacen btn origin"><i class='bx bx-upload'></i><span>Subir Excel</span></button>
                <button class="btn-descargar-almacen btn especial"><i class='bx bx-download'></i><span>Descargar Excel</span></button>
            </div>
            <p class="normal">Almacen Acopio</p>
            <div class="campo-horizontal">
                <button class="btn-subir-acopio btn origin"><i class='bx bx-upload'></i><span>Subir Excel</span></button>
                <button class="btn-descargar-acopio btn especial"><i class='bx bx-download'></i><span>Descargar Excel</span></button>
            </div>
            `: ''}
        </div>
    `;

    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();
    contenido.style.maxWidth = '450px';
    eventosConfiguraciones();
}

async function eventosConfiguraciones() {
    const btnsTheme = document.querySelectorAll('.btn-tema');
    
    // Botones de descarga de almacén
    const btnDescargarAlmacen = document.querySelector('.btn-descargar-almacen');
    const btnDescargarAcopio = document.querySelector('.btn-descargar-acopio');
    
    // Botones de subida de almacén
    const btnSubirAlmacen = document.querySelector('.btn-subir-almacen');
    const btnSubirAcopio = document.querySelector('.btn-subir-acopio');
    
    if (btnDescargarAlmacen) {
        btnDescargarAlmacen.addEventListener('click', descargarAlmacenGeneral);
    }
    
    if (btnDescargarAcopio) {
        btnDescargarAcopio.addEventListener('click', descargarAlmacenAcopio);
    }
    
    if (btnSubirAlmacen) {
        btnSubirAlmacen.addEventListener('click', subirAlmacenGeneral);
    }
    
    if (btnSubirAcopio) {
        btnSubirAcopio.addEventListener('click', subirAlmacenAcopio);
    }

    // Detector de cambios en el tema del sistema
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Función para manejar cambios en el tema del sistema
    const handleSystemThemeChange = (e) => {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'system') {
            setTheme('system');
        }
    };

    // Remover listener anterior si existe
    systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
    // Agregar nuevo listener
    systemThemeQuery.addEventListener('change', handleSystemThemeChange);

    btnsTheme.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);

            // Update active state
            document.querySelectorAll('.btn-tema').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}


function setTheme(theme) {
    const root = document.documentElement;
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        root.setAttribute('data-theme', theme);
    }
}

async function descargarAlmacenGeneral() {
    try {
        mostrarCarga('.carga-procesar');
        
        // Crear plantilla vacía con formato de ID correcto
        const datosExcel = [{
            'ID': 'PG-001',
            'PRODUCTO': '',
            'GR.': '',
            'STOCK': '',
            'GRUP': '',
            'LISTA': '',
            'C. BARRAS': '',
            'PRECIOS': '',
            'ETIQUETAS': '',
            'ACOPIO ID': '',
            'ALM-ACOPIO NOMBRE': '',
            'IMAGEN': '',
            'U SUELTAS': '',
            'PROMOCION': '',
            'PRECIO PROMOCION': ''
        }];
        
        // Generar Excel
        const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
        const nombreArchivo = `Almacen_General_${fecha}.xlsx`;
        
        const worksheet = XLSX.utils.json_to_sheet(datosExcel);
        
        // Ajustar anchos de columna
        const colWidths = [
            { wch: 12 }, // ID
            { wch: 30 }, // PRODUCTO
            { wch: 10 }, // GR.
            { wch: 12 }, // STOCK
            { wch: 10 }, // GRUP
            { wch: 15 }, // LISTA
            { wch: 15 }, // C. BARRAS
            { wch: 15 }, // PRECIOS
            { wch: 20 }, // ETIQUETAS
            { wch: 12 }, // ACOPIO ID
            { wch: 25 }, // ALM-ACOPIO NOMBRE
            { wch: 30 }, // IMAGEN
            { wch: 12 }, // U SUELTAS
            { wch: 12 }, // PROMOCION
            { wch: 15 }  // PRECIO PROMOCION
        ];
        worksheet['!cols'] = colWidths;
        
        // Dar formato al encabezado
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ c: C, r: 0 });
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                fill: { fgColor: { rgb: "D9D9D9" } },
                font: { color: { rgb: "000000" }, bold: true }
            };
        }
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Almacen General');
        XLSX.writeFile(workbook, nombreArchivo);
        
        mostrarNotificacion({
            message: 'Plantilla de almacén general descargada. El formato de ID debe ser PG-001, PG-002, etc.',
            type: 'success',
            duration: 4000
        });
        
    } catch (error) {
        console.error('Error al descargar almacén general:', error);
        mostrarNotificacion({
            message: error.message || 'Error al descargar el archivo',
            type: 'error',
            duration: 3500
        });
    } finally {
        ocultarCarga('.carga-procesar');
    }
}

async function descargarAlmacenAcopio() {
    try {
        mostrarCarga('.carga-procesar');
        
        // Crear plantilla vacía con formato de ID correcto
        const datosExcel = [{
            'ID': 'PB-001',
            'PRODUCTO': '',
            'BRUTO (PESO-LOTE)': '',
            'PRIMA (PESO-LOTE)': '',
            'ETIQUETAS': ''
        }];
        
        // Generar Excel
        const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
        const nombreArchivo = `Almacen_Acopio_${fecha}.xlsx`;
        
        const worksheet = XLSX.utils.json_to_sheet(datosExcel);
        
        // Ajustar anchos de columna
        const colWidths = [
            { wch: 12 }, // ID
            { wch: 30 }, // PRODUCTO
            { wch: 20 }, // BRUTO
            { wch: 20 }, // PRIMA
            { wch: 25 }  // ETIQUETAS
        ];
        worksheet['!cols'] = colWidths;
        
        // Dar formato al encabezado
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ c: C, r: 0 });
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                fill: { fgColor: { rgb: "D9D9D9" } },
                font: { color: { rgb: "000000" }, bold: true }
            };
        }
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Almacen Acopio');
        XLSX.writeFile(workbook, nombreArchivo);
        
        mostrarNotificacion({
            message: 'Plantilla de almacén acopio descargada. El formato de ID debe ser PB-001, PB-002, etc.',
            type: 'success',
            duration: 4000
        });
        
    } catch (error) {
        console.error('Error al descargar almacén acopio:', error);
        mostrarNotificacion({
            message: error.message || 'Error al descargar el archivo',
            type: 'error',
            duration: 3500
        });
    } finally {
        ocultarCarga('.carga-procesar');
    }
}

async function subirAlmacenGeneral() {
    try {
        // Crear input de archivo oculto
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx,.xls';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                mostrarCarga('.carga-procesar');
                
                const formData = new FormData();
                formData.append('archivo', file);
                
                const response = await fetch('/subir-almacen-excel', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarNotificacion({
                        message: 'Archivo procesado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    // Verificar si es un error de columnas
                    if (data.error && data.error.includes('columna')) {
                        mostrarNotificacion({
                            message: 'El archivo no tiene las columnas correctas. Verifica que contenga: ID, PRODUCTO, GR., STOCK, etc.',
                            type: 'warning',
                            duration: 5000
                        });
                    } else if (data.error && (data.error.includes('formato correcto') || data.error.includes('duplicados'))) {
                        mostrarNotificacion({
                            message: data.error,
                            type: 'warning',
                            duration: 6000
                        });
                    } else {
                        throw new Error(data.error || 'Error al procesar el archivo');
                    }
                }
                
            } catch (error) {
                console.error('Error al subir archivo:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al procesar el archivo',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga('.carga-procesar');
                // Limpiar el input
                document.body.removeChild(fileInput);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        
    } catch (error) {
        console.error('Error al crear input de archivo:', error);
        mostrarNotificacion({
            message: 'Error al abrir selector de archivo',
            type: 'error',
            duration: 3500
        });
    }
}

async function subirAlmacenAcopio() {
    try {
        // Crear input de archivo oculto
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx,.xls';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                mostrarCarga('.carga-procesar');
                
                const formData = new FormData();
                formData.append('archivo', file);
                
                const response = await fetch('/subir-acopio-excel', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarNotificacion({
                        message: 'Archivo de acopio procesado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    // Verificar si es un error de columnas
                    if (data.error && data.error.includes('columna')) {
                        mostrarNotificacion({
                            message: 'El archivo no tiene las columnas correctas. Verifica que contenga: ID, PRODUCTO, BRUTO (PESO-LOTE), PRIMA (PESO-LOTE), ETIQUETAS',
                            type: 'warning',
                            duration: 5000
                        });
                    } else if (data.error && (data.error.includes('formato correcto') || data.error.includes('duplicados'))) {
                        mostrarNotificacion({
                            message: data.error,
                            type: 'warning',
                            duration: 6000
                        });
                    } else {
                        throw new Error(data.error || 'Error al procesar el archivo');
                    }
                }
                
            } catch (error) {
                console.error('Error al subir archivo de acopio:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al procesar el archivo',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga('.carga-procesar');
                // Limpiar el input
                document.body.removeChild(fileInput);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        
    } catch (error) {
        console.error('Error al crear input de archivo:', error);
        mostrarNotificacion({
            message: 'Error al abrir selector de archivo',
            type: 'error',
            duration: 3500
        });
    }
}