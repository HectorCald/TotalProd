const CACHE_NAME = 'TotalProd v1.4.3'; // Incrementamos la versión para incluir archivos EJS
const ASSETS_TO_CACHE = [
    '/css/login.css',
    '/js/login.js',
    '/js/dashboard.js',
    //Archivos CSS
    '/css/dashboard_db.css',
    '/css/styles/componentes/botones.css',
    '/css/styles/componentes/otros.css',
    '/css/styles/componentes/anuncio.css',
    '/css/styles/componentes/carrito.css',
    '/css/styles/componentes/calendario.css',
    '/css/styles/componentes/barra-progreso.css',
    '/css/styles/componentes/filtro-opciones.css',
    '/css/styles/componentes/registro-item.css',
    '/css/styles/componentes/btn-flotante.css',
    '/css/styles/componentes/ajustes.css',
    '/css/styles/componentes/actualizacion.css',
    '/css/styles/componentes/screen-progreso.css',
    '/css/styles/componentes/tablas.css',
    '/css/styles/componentes/skeletos.css',
    '/css/styles/componentes/panel-lateral.css',
    '/css/styles/componentes/fuente.css',
    '/css/styles/componentes/notificacion.css',
    //Archivos JS
    '/js/modules/main/home.js',
    '/js/modules/main/nav.js',
    '/js/modules/main/perfil.js',
    '/js/modules/main/flotante.js',
    '/js/modules/main/notificaciones.js',

    //Archivos JS de Acopio
    '/js/modules/acopio/almacen-acopio.js',
    '/js/modules/acopio/hacer-pedido.js',
    '/js/modules/acopio/ingresos-acopio.js',
    '/js/modules/acopio/registros-acopio.js',
    '/js/modules/acopio/registros-pedidos-acopio.js',
    '/js/modules/acopio/salidas-acopio.js',
    '/js/modules/acopio/registros-pesaje.js',
    '/js/modules/acopio/procesos.js',

    //Archivos JS de Admin
    '/js/modules/admin/clientes.js',
    '/js/modules/admin/configuraciones-sistema.js',
    '/js/modules/admin/descargas.js',
    '/js/modules/admin/pagos.js',
    '/js/modules/admin/personal.js',
    '/js/modules/admin/proovedores.js',
    '/js/modules/admin/reportes.js',
    '/js/modules/admin/caja.js',

    //Archivos JS de Almacen
    '/js/modules/almacen/almacen-general.js',
    '/js/modules/almacen/ingresos-almacen.js',
    '/js/modules/almacen/salidas-almacen.js',
    '/js/modules/almacen/registros-almacen.js',
    '/js/modules/almacen/registros-conteos.js',
    '/js/modules/almacen/verificar-registros.js',

    //Archivos JS de Componentes
    '/js/modules/componentes/componentes.js',
    '/js/modules/plugins/calculadora-mp.js',
    '/js/modules/plugins/tareas-acopio.js',

    //Archivos JS de Produccion
    '/js/modules/produccion/formulario-produccion.js',
    '/js/modules/produccion/registros-produccion.js',
    '/js/modules/produccion/reglas.js',

    //Archivos CSS
    '/css/styles/home.css',
    '/css/styles/nav.css',
    '/css/styles/perfil.css',
    '/css/styles/flotante.css',
    '/css/styles/componentes.css',
    '/css/styles/estilos-base.css',

    // Imágenes
    '/img/Procesando.gif',
    '/img/logo-trans.webp',
    '/img/Logotipo-damabrava-trans.webp',
    '/img/cabecera-catalogo-trans.webp',
    '/img/logotipo-damabrava-1x1.png',
    '/img/fondo-catalogo-trans.webp',

    // Fuentes e iconos externos
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css',
    'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
];
const syncQueue = new Map();
let pagosAutomaticosEnProceso = false;
let ultimoPagoGenerado = null;
let programacionPagosActiva = false;
let sistemaInicializado = false;

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCbfR1fpCDIsE8R_9RAN9lG0H9bsk2WQeQ",
    authDomain: "damabravaapp.firebaseapp.com",
    projectId: "damabravaapp",
    storageBucket: "damabravaapp.firebasestorage.app",
    messagingSenderId: "36776613676",
    appId: "1:36776613676:web:f031d9435399a75a9afe89",
    measurementId: "G-NX0Z9ZPC5R"
};


firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
    console.log('Mensaje recibido en background:', payload);
    // Usar data si existe, ya que notification ya no se envía
    const notificationTitle = payload.data?.title || 'Nueva notificación';
    const notificationOptions = {
        body: payload.data?.body || 'Tienes un nuevo mensaje',
        icon: '/icons/icon.png',
        badge: '/badge.png',
        data: payload.data || {},
        requireInteraction: true,
        silent: false
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});


self.addEventListener('notificationclick', (event) => {
    console.log('Notificación clickeada:', event);
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys()
                .then(cacheNames => {
                    return Promise.all(
                        cacheNames
                            .filter(cacheName => cacheName !== CACHE_NAME)
                            .map(cacheName => {
                                console.log('Eliminando caché antiguo:', cacheName);
                                return caches.delete(cacheName);
                            })
                    );
                }),
            self.clients.claim()
        ])
    );
    
    // Iniciar pagos automáticos cuando se activa el service worker (solo una vez)
    iniciarPagosAutomaticosEnBackground().catch(error => {
        console.error('Error iniciando pagos automáticos:', error);
    });
});
self.addEventListener('fetch', event => {


    const urlPath = new URL(event.request.url).pathname;

    if (
        event.request.method === 'GET' &&
        urlPath.startsWith('/obtener-')
    ) return;


    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        // CLONAR INMEDIATAMENTE
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Si la red falla, no hace nada aquí
                });

            if (cachedResponse) {
                return cachedResponse;
            } else {
                // Para otros assets, simplemente falla (no responde con HTML)
                return fetchPromise;
            }
        })
    );
});
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            Promise.all(
                Array.from(syncQueue.entries()).map(([url, request]) => {
                    return fetch(request)
                        .then(response => {
                            if (response.ok) {
                                syncQueue.delete(url);
                            }
                            return response;
                        })
                        .catch(error => {
                            console.error('Error en sincronización:', error);
                        });
                })
            )
        );
    }
    if (event.tag === 'pagos-automaticos') {
        // Verificar si ya hay un proceso en curso antes de ejecutar
        if (!pagosAutomaticosEnProceso) {
            event.waitUntil(generarPagoAutomaticoEnBackground());
        } else {
            console.log('Pagos automáticos ya están en proceso, saltando sync event');
        }
    }
});
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const data = event.data.payload || {};
        const notificationTitle = data.title || 'Nueva notificación';
        const notificationOptions = {
            body: data.body || 'Tienes un nuevo mensaje',
            icon: '/icons/icon-192x192.png',
            badge: '/badge.png',
            data: data,
            requireInteraction: true,
            silent: false
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
    }
    if (event.data && event.data.type === 'INICIAR_PAGOS_AUTOMATICOS') {
        iniciarPagosAutomaticosEnBackground();
    }
});




// Función para verificar si es el momento de generar pagos
function esMomentoDeGenerarPagos() {
    const ahora = new Date();
    const zonaHorariaBolivia = 'America/La_Paz';
    
    // Obtener la fecha actual en zona horaria de Bolivia
    const fechaBolivia = new Date(ahora.toLocaleString("en-US", {timeZone: zonaHorariaBolivia}));
    
    // Verificar si es el último día del mes
    const ultimoDiaMes = new Date(fechaBolivia.getFullYear(), fechaBolivia.getMonth() + 1, 0);
    const esUltimoDia = fechaBolivia.getDate() === ultimoDiaMes.getDate();
    
    // Verificar si es después de las 8:00 PM
    const esDespuesDe8PM = fechaBolivia.getHours() >= 20;
    
    return esUltimoDia && esDespuesDe8PM;
}

// Función para generar pagos automáticos en background
async function generarPagoAutomaticoEnBackground() {
    try {
        // Verificar si es el momento correcto para generar pagos
        if (!esMomentoDeGenerarPagos()) {
            // Solo mostrar log una vez por hora para evitar spam
            const ahora = new Date();
            if (!self.ultimoLogVerificacion || (ahora - self.ultimoLogVerificacion) > 60 * 60 * 1000) {
                console.log('No es el momento de generar pagos automáticos (último día del mes a las 8:00 PM)');
                self.ultimoLogVerificacion = ahora;
            }
            return;
        }
        
        // Verificar si ya hay un proceso de pagos en curso
        if (pagosAutomaticosEnProceso) {
            console.log('Pagos automáticos ya están en proceso, saltando ejecución...');
            return;
        }
        
        // Verificar si ya se generó un pago recientemente (últimos 5 minutos)
        const ahora = new Date();
        if (ultimoPagoGenerado && (ahora - ultimoPagoGenerado) < 5 * 60 * 1000) {
            console.log('Ya se generó un pago automático recientemente, saltando ejecución...');
            return;
        }
        
        // Marcar que el proceso está en curso
        pagosAutomaticosEnProceso = true;
        console.log('Iniciando generación de pagos automáticos del mes...');
        
        // Obtener datos del servidor
        const [registrosResponse, pagosResponse, nombresResponse] = await Promise.all([
            fetch('/obtener-registros-produccion'),
            fetch('/obtener-pagos'),
            fetch('/obtener-nombres-usuarios')
        ]);

        const registrosData = await registrosResponse.json();
        const pagosData = await pagosResponse.json();
        const nombresData = await nombresResponse.json();

        if (!registrosData.success || !pagosData.success || !nombresData.success) {
            console.log('Error obteniendo datos para pagos automáticos');
            return;
        }

        const registrosProduccion = registrosData.registros;
        const pagosGlobal = pagosData.pagos;
        const nombresUsuariosGlobal = nombresData.nombres;

        // Obtener el mes y año actual
        const fechaActual = new Date();
        const zonaHorariaBolivia = 'America/La_Paz';
        const fechaBolivia = new Date(fechaActual.toLocaleString("en-US", {timeZone: zonaHorariaBolivia}));
        const mesActual = fechaBolivia.getMonth() + 1;
        const anioActual = fechaBolivia.getFullYear();

        // Filtrar registros del mes actual (sin importar el estado)
        const registrosMesActual = registrosProduccion.filter(registro => {
            const [dia, mes, anio] = registro.fecha.split('/');
            const mesRegistro = parseInt(mes);
            const anioRegistro = parseInt(anio);
            return mesRegistro === mesActual && anioRegistro === anioActual;
        });

        if (registrosMesActual.length === 0) {
            console.log('No hay registros del mes actual para generar pago automático');
            return;
        }

        // Obtener IDs de registros que ya están incluidos en pagos existentes
        const registrosYaPagados = new Set();
        pagosGlobal.forEach(pago => {
            if (pago.justificativos_id) {
                const ids = pago.justificativos_id.split(',').map(id => id.trim());
                ids.forEach(id => registrosYaPagados.add(id));
            }
        });

        // Filtrar registros que NO están ya pagados
        const registrosSinPagar = registrosMesActual.filter(registro => 
            !registrosYaPagados.has(registro.id)
        );

        if (registrosSinPagar.length === 0) {
            console.log('Todos los registros del mes actual ya están pagados');
            return;
        }

        // Verificar si ya existe un pago automático para este mes (evitar duplicados)
        const mesAnio = `${mesActual}-${anioActual}`;
        const pagosAutomaticosMes = pagosGlobal.filter(pago => 
            pago.observaciones && 
            pago.observaciones.includes('Pago automático generado por el sistema en background') &&
            pago.fecha && 
            pago.fecha.includes(`${mesActual}/${anioActual}`)
        );

        if (pagosAutomaticosMes.length > 0) {
            console.log(`Ya existe un pago automático para ${mesAnio}, saltando generación...`);
            return;
        }

        console.log(`Generando pagos automáticos del mes para ${registrosSinPagar.length} registros`);

        // Agrupar registros por user
        const registrosPorUser = {};
        registrosSinPagar.forEach(registro => {
            if (!registrosPorUser[registro.user]) {
                registrosPorUser[registro.user] = [];
            }
            registrosPorUser[registro.user].push(registro);
        });

        // Generar un pago por cada user
        for (const [user, registrosUser] of Object.entries(registrosPorUser)) {
            await generarPagoParaUserEnBackground(user, registrosUser, nombresUsuariosGlobal);
        }

        console.log('Proceso de pagos automáticos del mes completado');
        
        // Marcar la fecha del último pago generado
        ultimoPagoGenerado = new Date();

    } catch (error) {
        console.error('Error al generar pago automático en background:', error);
    } finally {
        // Siempre liberar el bloqueo al finalizar
        pagosAutomaticosEnProceso = false;
    }
}

// Función para generar pago para un user específico en background
async function generarPagoParaUserEnBackground(user, registrosUser, nombresUsuariosGlobal) {
    try {
        // Obtener el nombre del usuario
        const usuario = nombresUsuariosGlobal.find(u => u.user === user);
        const nombreUsuario = usuario ? usuario.nombre : user;

        // Calcular totales (simplificado para background)
        const totales = registrosUser.reduce((acc, registro) => {
            // Cálculo simplificado - puedes ajustar según tus reglas
            const cantidad = parseFloat(registro.c_real) || parseFloat(registro.envases_terminados) || 0;
            const gramaje = parseFloat(registro.gramos) || 0;
            
            // Precios base (ajusta según tus necesidades)
            const precioEnvasado = 0.048;
            const precioEtiquetado = 0.016;
            const precioSellado = 0.006;
            const precioCernido = 0.08;

            const envasado = cantidad * precioEnvasado;
            const etiquetado = cantidad * precioEtiquetado;
            const sellado = cantidad * precioSellado;
            let cernido = 0;
            if (registro.proceso === 'Cernido') {
                const kilos = (cantidad * gramaje) / 1000;
                cernido = kilos * precioCernido * 5;
            }

            return {
                cernido: acc.cernido + cernido,
                envasado: acc.envasado + envasado,
                etiquetado: acc.etiquetado + etiquetado,
                sellado: acc.sellado + sellado,
                total: acc.total + envasado + etiquetado + sellado + cernido
            };
        }, { cernido: 0, envasado: 0, etiquetado: 0, sellado: 0, total: 0 });

        // Crear justificativos detallados
        const justificativosDetallados = registrosUser.map(registro => {
            const cantidad = parseFloat(registro.c_real) || parseFloat(registro.envases_terminados) || 0;
            const gramaje = parseFloat(registro.gramos) || 0;
            const envasado = cantidad * 0.048;
            const etiquetado = cantidad * 0.016;
            const sellado = cantidad * 0.006;
            let cernido = 0;
            if (registro.proceso === 'Cernido') {
                const kilos = (cantidad * gramaje) / 1000;
                cernido = kilos * 0.08 * 5;
            }
            return `${registro.producto} ${registro.gramos}gr(${envasado.toFixed(2)},${etiquetado.toFixed(2)},${sellado.toFixed(2)},${cernido.toFixed(2)})`;
        }).join(';');

        // Preparar datos del pago
        const formData = {
            nombre_pago: `Pago Automático - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
            beneficiario: nombreUsuario,
            id_beneficiario: user,
            pagado_por: 'Sistema Automático',
            justificativos_id: registrosUser.map(r => r.id).join(', '),
            justificativosDetallados,
            subtotal: totales.total,
            descuento: 0,
            aumento: 0,
            total: totales.total,
            observaciones: `Pago automático generado por el sistema en background - ${mesActual}/${anioActual}`,
            registros: registrosUser.map(r => r.id),
            tipo: 'produccion',
            es_automatico: true,
            timestamp_generacion: new Date().toISOString()
        };

        // Enviar pago al servidor
        const response = await fetch('/registrar-pago', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            console.log(`Pago automático en background generado exitosamente para ${nombreUsuario}`);
            
            // Mostrar notificación
            self.registration.showNotification('Pago Automático Generado', {
                body: `Se generó automáticamente el pago para ${nombreUsuario}: Bs.${totales.total.toFixed(2)}`,
                icon: '/icons/icon-192x192.png',
                badge: '/badge.png',
                requireInteraction: true
            });
        } else {
            console.error('Error al generar pago automático en background:', data.error);
        }

    } catch (error) {
        console.error('Error al generar pago para user en background:', error);
    }
}

// Función para iniciar pagos automáticos en background
async function iniciarPagosAutomaticosEnBackground() {
    // Verificar si ya está iniciado usando almacenamiento persistente
    try {
        const cache = await caches.open('pagos-automaticos-config');
        const response = await cache.match('sistema-iniciado');
        
        if (response) {
            console.log('Sistema de pagos automáticos ya está iniciado (verificado en cache)');
            return;
        }
        
        // Marcar como iniciado en el cache
        await cache.put('sistema-iniciado', new Response('true', {
            headers: { 'Content-Type': 'text/plain' }
        }));
        
    } catch (error) {
        console.error('Error verificando estado del sistema:', error);
        return;
    }
    
    // Verificar si ya está iniciado en memoria
    if (sistemaInicializado) {
        console.log('Sistema de pagos automáticos ya está iniciado en memoria');
        return;
    }
    
    sistemaInicializado = true;
    
    // Programar la próxima ejecución solo una vez
    if (!programacionPagosActiva) {
        programarProximaEjecucionPagos().catch(error => {
            console.error('Error programando pagos automáticos:', error);
        });
    }
    
    // También verificar cada hora por si el Service Worker se reinicia
    if (!self.intervalVerificacionHoraria) {
        self.intervalVerificacionHoraria = setInterval(() => {
            // Solo verificar si no hay un proceso en curso
            if (!pagosAutomaticosEnProceso && esMomentoDeGenerarPagos()) {
                console.log('Verificación horaria: Es momento de generar pagos automáticos');
                generarPagoAutomaticoEnBackground();
            }
        }, 60 * 60 * 1000); // Cada hora
    }
    
    console.log('Sistema de pagos automáticos en background iniciado - programado para último día del mes a las 8:00 PM');
}

// Función para programar la próxima ejecución de pagos
async function programarProximaEjecucionPagos() {
    // Evitar múltiples programaciones simultáneas
    if (programacionPagosActiva) {
        console.log('Programación de pagos ya está activa, saltando...');
        return;
    }
    
    // Verificar si ya se programó recientemente usando cache
    try {
        const cache = await caches.open('pagos-automaticos-config');
        const response = await cache.match('ultima-programacion');
        
        if (response) {
            const ultimaProgramacion = await response.text();
            const tiempoTranscurrido = Date.now() - parseInt(ultimaProgramacion);
            
            // Si se programó hace menos de 5 minutos, saltar
            if (tiempoTranscurrido < 5 * 60 * 1000) {
                console.log('Programación reciente detectada, saltando...');
                return;
            }
        }
        
        // Guardar timestamp de esta programación
        await cache.put('ultima-programacion', new Response(Date.now().toString(), {
            headers: { 'Content-Type': 'text/plain' }
        }));
        
    } catch (error) {
        console.error('Error verificando programación reciente:', error);
    }
    
    programacionPagosActiva = true;
    
    const ahora = new Date();
    const zonaHorariaBolivia = 'America/La_Paz';
    
    // Obtener la fecha actual en zona horaria de Bolivia
    const fechaBolivia = new Date(ahora.toLocaleString("en-US", {timeZone: zonaHorariaBolivia}));
    
    // Calcular el último día del mes actual
    const ultimoDiaMes = new Date(fechaBolivia.getFullYear(), fechaBolivia.getMonth() + 1, 0);
    
    // Crear la fecha objetivo: último día del mes a las 8:00 PM
    const fechaObjetivo = new Date(ultimoDiaMes);
    fechaObjetivo.setHours(20, 0, 0, 0); // 8:00 PM
    
    // Si ya pasó la hora del último día del mes actual, programar para el próximo mes
    if (fechaBolivia > fechaObjetivo) {
        fechaObjetivo.setMonth(fechaObjetivo.getMonth() + 1);
        fechaObjetivo.setDate(0); // Último día del próximo mes
        fechaObjetivo.setHours(20, 0, 0, 0); // 8:00 PM
    }
    
    // Calcular el tiempo de espera en milisegundos
    const tiempoEspera = fechaObjetivo.getTime() - fechaBolivia.getTime();
    
    console.log(`Pagos automáticos programados para: ${fechaObjetivo.toLocaleString('es-ES', { timeZone: zonaHorariaBolivia })}`);
    console.log(`Tiempo de espera: ${Math.floor(tiempoEspera / (1000 * 60 * 60 * 24))} días, ${Math.floor((tiempoEspera % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))} horas`);
    
    // Programar la ejecución
    setTimeout(async () => {
        await generarPagoAutomaticoEnBackground();
        // Liberar la bandera para permitir la próxima programación
        programacionPagosActiva = false;
        // Programar la próxima ejecución (próximo mes)
        programarProximaEjecucionPagos().catch(error => {
            console.error('Error programando próxima ejecución:', error);
        });
    }, tiempoEspera);
}
