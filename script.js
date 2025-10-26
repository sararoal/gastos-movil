// Gestión de Gastos - JavaScript con Firebase
import firebaseDB from './firebase-database.js';

class GestorGastos {
    constructor() {
        this.gastos = {
            fijosMensuales: [],
            variablesMensuales: [],
            vacaciones: []
        };
        
        this.gastosFijosDB = null; // Base de datos de gastos fijos predefinidos
        this.firebaseListener = null; // Listener para cambios en tiempo real
        this.init();
    }

    async init() {
        // Inicializar Firebase
        console.log('🔥 Inicializando sistema de gastos con Firebase...');
        const firebaseIniciado = await firebaseDB.init();
        
        if (firebaseIniciado) {
            console.log('✅ Firebase listo - sincronización en la nube activada');
            // Configurar listener para cambios en tiempo real
            this.setupFirebaseListener();
        } else {
            console.warn('⚠️ Firebase no disponible - usando modo offline');
        }

        console.log('📊 Cargando datos y configurando interfaz...');
        await this.cargarGastosFijosDB();
        await this.cargarDatos();
        this.actualizarFechasGastosFijos(); // Actualizar fechas dinámicamente
        this.cargarGastosFijosDesdeJSON(); // Cargar gastos fijos automáticamente
        this.setupEventListeners();
        this.mostrarGastos();
        this.actualizarResumen();
        this.setupTabNavigation();
        this.setupCustomDescriptions();
        this.setupResumenFilters();
        console.log('✅ Inicialización del gestor de gastos completada');
    }

    // Actualizar fechas de gastos fijos del JSON al día 1 del mes actual
    actualizarFechasGastosFijos() {
        const fechaActual = new Date();
        // Asegurar que obtenemos el día 1 del mes actual correctamente
        const año = fechaActual.getFullYear();
        const mes = fechaActual.getMonth(); // 0-11 (octubre = 9)
        const primerDiaMesActual = `${año}-${String(mes + 1).padStart(2, '0')}-01`;

        let seActualizo = false;

        // Actualizar gastos fijos mensuales del JSON
        this.gastos.fijosMensuales.forEach(gasto => {
            if (gasto.esDelJSON && gasto.fecha !== primerDiaMesActual) {
                gasto.fecha = primerDiaMesActual;
                seActualizo = true;
            }
        });

        // Guardar si hubo cambios
        if (seActualizo) {
            this.guardarDatos();
            console.log('Fechas actualizadas a:', primerDiaMesActual);
        }
    }

    // Cargar gastos fijos automáticamente desde el JSON
    cargarGastosFijosDesdeJSON() {
        if (!this.gastosFijosDB) return;

        // Verificar si ya se han cargado los gastos del JSON para evitar duplicados
        const gastosYaCargados = this.gastos.fijosMensuales.some(gasto => gasto.esDelJSON);
        
        if (gastosYaCargados) return;

        // Obtener fecha dinámica: día 1 del mes actual - método más directo
        const fechaActual = new Date();
        const año = fechaActual.getFullYear();
        const mes = fechaActual.getMonth(); // 0-11 (octubre = 9)
        const primerDiaMesActual = `${año}-${String(mes + 1).padStart(2, '0')}-01`;

        console.log('Cargando gastos con fecha:', primerDiaMesActual);

        // Cargar gastos fijos mensuales (con fecha del día 1 del mes actual)
        const gastosMensuales = this.gastosFijosDB.gastosFijosMensuales.filter(gasto => gasto.activo);
        gastosMensuales.forEach(gastoDB => {
            const gastoParaApp = {
                id: `json_${gastoDB.id}`,
                fecha: primerDiaMesActual, // DINÁMICO: día 1 del mes actual
                descripcion: gastoDB.descripcion,
                importe: gastoDB.importe,
                categoria: gastoDB.categoria || 'general',
                esDelJSON: true,
                idJSON: gastoDB.id
            };
            this.gastos.fijosMensuales.push(gastoParaApp);
        });

        // Guardar los datos con los gastos del JSON incluidos
        this.guardarDatos();
    }

    // Cargar base de datos de gastos fijos
    async cargarGastosFijosDB() {
        try {
            const response = await fetch('gastos-fijos.json');
            this.gastosFijosDB = await response.json();
            console.log('Base de datos de gastos fijos cargada:', this.gastosFijosDB);
        } catch (error) {
            console.error('Error al cargar gastos-fijos.json:', error);
            this.gastosFijosDB = null;
        }
    }

    // Configurar navegación por pestañas
    setupTabNavigation() {
        console.log('🔧 Configurando navegación por pestañas...');
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log(`📋 Encontrados ${tabButtons.length} botones de pestaña`);
        console.log(`📄 Encontrados ${tabContents.length} contenidos de pestaña`);

        tabButtons.forEach((button, index) => {
            console.log(`🔘 Configurando botón ${index + 1}: ${button.dataset.tab}`);
            button.addEventListener('click', (event) => {
                console.log(`🖱️ Click en pestaña: ${button.dataset.tab}`);
                const targetTab = button.dataset.tab;
                
                // Remover clase active de todos los botones y contenidos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Agregar clase active al botón clickeado y su contenido
                button.classList.add('active');
                const targetElement = document.getElementById(targetTab);
                if (targetElement) {
                    targetElement.classList.add('active');
                    console.log(`✅ Pestaña activada: ${targetTab}`);
                } else {
                    console.error(`❌ No se encontró el elemento con ID: ${targetTab}`);
                }
            });
        });
        
        console.log('✅ Navegación por pestañas configurada');
    }

    // Configurar descripciones personalizadas
    setupCustomDescriptions() {
        const selects = document.querySelectorAll('select[id*="descripcion"]');
        
        selects.forEach(select => {
            const customInput = document.querySelector(`#${select.id.replace('descripcion', 'descripcion-custom')}`);
            
            select.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customInput.style.display = 'block';
                    customInput.required = true;
                } else {
                    customInput.style.display = 'none';
                    customInput.required = false;
                    customInput.value = '';
                }
                
                // Manejar subcategorías de vacaciones
                if (select.id === 'descripcion-variable-mensual') {
                    const subcategoriaContainer = document.getElementById('subcategoria-vacaciones');
                    if (e.target.value === 'Vacaciones') {
                        subcategoriaContainer.style.display = 'block';
                    } else {
                        subcategoriaContainer.style.display = 'none';
                        // Limpiar selección de subcategoría
                        document.getElementById('subcategoria-vacaciones-select').value = '';
                        document.getElementById('subcategoria-personalizada').style.display = 'none';
                        document.getElementById('subcategoria-personalizada').value = '';
                    }
                }
            });
        });
        
        // Configurar subcategorías de vacaciones
        this.setupSubcategoriaVacaciones();
    }

    // Configurar subcategorías de vacaciones
    setupSubcategoriaVacaciones() {
        const subcategoriaSelect = document.getElementById('subcategoria-vacaciones-select');
        const subcategoriaPersonalizada = document.getElementById('subcategoria-personalizada');
        
        if (subcategoriaSelect) {
            subcategoriaSelect.addEventListener('change', (e) => {
                if (e.target.value === 'Personalizado') {
                    subcategoriaPersonalizada.style.display = 'block';
                    subcategoriaPersonalizada.required = true;
                } else {
                    subcategoriaPersonalizada.style.display = 'none';
                    subcategoriaPersonalizada.required = false;
                    subcategoriaPersonalizada.value = '';
                }
            });
        }
    }

    // Configurar filtros del resumen
    setupResumenFilters() {
        const filterButtons = document.querySelectorAll('.btn-filter');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remover clase active de todos los botones
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Agregar clase active al botón clickeado
                button.classList.add('active');
                
                // Obtener el filtro seleccionado
                const filtro = button.dataset.filter;
                
                // Actualizar el resumen con el filtro
                this.aplicarFiltroResumen(filtro);
            });
        });

        // Configurar filtro de mes
        this.inicializarFiltroMes();
        const filtroMes = document.getElementById('filtro-mes');
        if (filtroMes) {
            filtroMes.addEventListener('change', () => {
                // Obtener el filtro de categoría activo
                const categoriaActiva = document.querySelector('.btn-filter.active');
                const filtroCategoria = categoriaActiva ? categoriaActiva.dataset.filter : 'todos';
                
                // Aplicar filtro combinando categoría y mes
                this.aplicarFiltroResumen(filtroCategoria);
            });
        }
    }

    // Inicializar el filtro de mes con los meses disponibles
    inicializarFiltroMes() {
        const filtroMes = document.getElementById('filtro-mes');
        if (!filtroMes) return;

        // Obtener todos los meses únicos de todos los gastos
        const mesesDisponibles = new Set();
        
        ['fijosMensuales', 'variablesMensuales', 'vacaciones'].forEach(categoria => {
            this.gastos[categoria].forEach(gasto => {
                if (gasto.fecha) {
                    // Convertir fecha dd-mm-aa a formato para agrupar por mes/año
                    const fechaParts = gasto.fecha.split('-');
                    if (fechaParts.length === 3) {
                        const mes = fechaParts[1];
                        let año = fechaParts[2];
                        
                        // Manejar años de 2 dígitos de forma inteligente
                        if (año.length === 2) {
                            const añoNum = parseInt(año);
                            const añoActual = new Date().getFullYear();
                            const añoActualCorto = añoActual % 100; // Últimos 2 dígitos del año actual
                            
                            // Si el año es menor o igual al año actual (en 2 dígitos), asumir siglo 21
                            // Si es mayor, podría ser del siglo pasado, pero para esta app asumir siglo 21
                            año = `20${año}`;
                            
                            console.log(`📅 Año convertido: ${fechaParts[2]} → ${año}`);
                        }
                        
                        const fechaKey = `${año}-${mes}`;
                        mesesDisponibles.add(fechaKey);
                    }
                }
            });
        });

        // Ordenar meses por fecha (más reciente primero)
        const mesesOrdenados = Array.from(mesesDisponibles).sort((a, b) => b.localeCompare(a));

        // Limpiar el select y agregar opción "Todos"
        filtroMes.innerHTML = '<option value="todos">Todos los meses</option>';

        // Agregar cada mes disponible
        mesesOrdenados.forEach(fechaKey => {
            const [año, mes] = fechaKey.split('-');
            const nombreMes = this.obtenerNombreMes(parseInt(mes));
            const option = document.createElement('option');
            option.value = fechaKey;
            option.textContent = `${nombreMes} ${año}`;
            filtroMes.appendChild(option);
        });

        console.log(`📅 Filtro de mes inicializado con ${mesesOrdenados.length} meses disponibles`);
    }

    // Obtener nombre del mes
    obtenerNombreMes(numeroMes) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[numeroMes - 1] || 'Mes';
    }

    // Aplicar filtro al resumen
    aplicarFiltroResumen(filtro) {
        const desglosePorDescripcion = {};
        let totalGastos = 0;
        let totalImporte = 0;

        // Obtener filtro de mes seleccionado
        const filtroMes = document.getElementById('filtro-mes');
        const mesSeleccionado = filtroMes ? filtroMes.value : 'todos';

        // Determinar qué categorías incluir según el filtro
        let categoriasAIncluir = [];
        if (filtro === 'todos') {
            categoriasAIncluir = ['fijosMensuales', 'variablesMensuales', 'vacaciones'];
        } else if (filtro === 'fijos') {
            categoriasAIncluir = ['fijosMensuales'];
        } else if (filtro === 'variables') {
            categoriasAIncluir = ['variablesMensuales'];
        } else if (filtro === 'vacaciones') {
            categoriasAIncluir = ['vacaciones'];
        }

        // Recopilar datos de las categorías seleccionadas
        categoriasAIncluir.forEach(categoria => {
            this.gastos[categoria].forEach(gasto => {
                // Aplicar filtro de mes si está seleccionado
                if (mesSeleccionado !== 'todos') {
                    const fechaParts = gasto.fecha.split('-');
                    if (fechaParts.length === 3) {
                        const mes = fechaParts[1];
                        let año = fechaParts[2];
                        
                        // Aplicar la misma lógica de conversión de años
                        if (año.length === 2) {
                            año = `20${año}`;
                        }
                        
                        const fechaKey = `${año}-${mes}`;
                        
                        // Si no coincide con el mes seleccionado, saltar este gasto
                        if (fechaKey !== mesSeleccionado) {
                            return;
                        }
                    }
                }
                const descripcion = gasto.descripcion;
                let tipo = '';
                if (categoria === 'fijosMensuales') tipo = 'Fijo';
                else if (categoria === 'variablesMensuales') tipo = 'Variable';
                else if (categoria === 'vacaciones') tipo = 'Vacaciones';
                
                if (!desglosePorDescripcion[descripcion]) {
                    desglosePorDescripcion[descripcion] = {
                        total: 0,
                        count: 0,
                        tipo: tipo,
                        categoria: categoria
                    };
                }
                
                desglosePorDescripcion[descripcion].total += gasto.importe;
                desglosePorDescripcion[descripcion].count += 1;
                totalGastos += 1;
                totalImporte += gasto.importe;
            });
        });

        // Actualizar estadísticas generales
        const totalGeneralElement = document.getElementById('resumen-total-general');
        const totalGastosElement = document.getElementById('resumen-total-gastos');
        
        if (totalGeneralElement) {
            totalGeneralElement.textContent = `${totalImporte.toFixed(2)} €`;
        }
        if (totalGastosElement) {
            totalGastosElement.textContent = totalGastos;
        }

        // Mostrar desglose filtrado
        this.mostrarDesglose(desglosePorDescripcion, filtro);
    }

    // Configurar event listeners
    setupEventListeners() {
        console.log('🔧 setupEventListeners: Iniciando configuración...');
        
        // Pequeño retraso para asegurar que todos los elementos están disponibles
        setTimeout(() => {
            console.log('🔧 setupEventListeners: Configurando después del delay...');
            
            // Formularios
            const formFijos = document.getElementById('form-fijos-mensuales');
            const formVariables = document.getElementById('form-variables-mensuales');
            const formVacaciones = document.getElementById('form-vacaciones');
            
            console.log('📋 setupEventListeners: Formularios encontrados:');
            console.log('- form-fijos-mensuales:', formFijos ? 'SÍ' : 'NO');
            console.log('- form-variables-mensuales:', formVariables ? 'SÍ' : 'NO');
            console.log('- form-vacaciones:', formVacaciones ? 'SÍ' : 'NO');
            
            if (formFijos) {
                formFijos.addEventListener('submit', (e) => {
                    console.log('📝 Event listener: Submit en form-fijos-mensuales detectado');
                    e.preventDefault();
                    this.agregarGasto('fijosMensuales');
                });
            }

            if (formVariables) {
                formVariables.addEventListener('submit', (e) => {
                    console.log('📝 Event listener: Submit en form-variables-mensuales detectado');
                    e.preventDefault();
                    this.agregarGasto('variablesMensuales');
                });
            }

            if (formVacaciones) {
                console.log('✅ setupEventListeners: Configurando form-vacaciones');
                formVacaciones.addEventListener('submit', (e) => {
                    console.log('📝 Event listener: Submit en form-vacaciones detectado (setupEventListeners)');
                    e.preventDefault();
                    console.log('🔄 Event listener: Llamando agregarGasto(vacaciones) desde setupEventListeners');
                    this.agregarGasto('vacaciones');
                });
                console.log('✅ setupEventListeners: Event listener para form-vacaciones configurado');
            } else {
                console.error('❌ setupEventListeners: form-vacaciones NO ENCONTRADO');
            }
        }, 100);
    }

    // Agregar nuevo gasto
    agregarGasto(categoria) {
        // Prevenir ejecuciones múltiples simultáneas
        if (this.procesandoGasto) {
            console.log(`⏳ agregarGasto: Ya se está procesando un gasto, ignorando...`);
            return;
        }
        
        this.procesandoGasto = true;
        console.log(`💰 agregarGasto: Iniciando para categoría: ${categoria}`);
        
        const formPrefix = this.getFormPrefix(categoria);
        console.log(`🔧 agregarGasto: FormPrefix: ${formPrefix}`);
        
        // Verificar que los elementos existen
        const fechaElement = document.getElementById(`fecha-${formPrefix}`);
        const descripcionSelectElement = document.getElementById(`descripcion-${formPrefix}`);
        const descripcionCustomElement = document.getElementById(`descripcion-custom-${formPrefix}`);
        const importeElement = document.getElementById(`importe-${formPrefix}`);

        console.log(`🔍 agregarGasto: Elementos encontrados:`, {
            fecha: fechaElement ? 'SÍ' : 'NO',
            descripcionSelect: descripcionSelectElement ? 'SÍ' : 'NO',
            descripcionCustom: descripcionCustomElement ? 'SÍ' : 'NO',
            importe: importeElement ? 'SÍ' : 'NO'
        });

        if (!fechaElement || !descripcionSelectElement || !importeElement) {
            console.error('❌ agregarGasto: Elementos del formulario no encontrados');
            alert('Error: No se pudieron encontrar los campos del formulario');
            this.procesandoGasto = false;
            return;
        }
        
        const fecha = fechaElement.value;
        const descripcionSelect = descripcionSelectElement;
        const descripcionCustom = descripcionCustomElement;
        const importe = parseFloat(importeElement.value);

        console.log(`📅 agregarGasto: Fecha: "${fecha}"`);
        console.log(`📝 agregarGasto: Descripción select value: "${descripcionSelect.value}"`);
        console.log(`💵 agregarGasto: Importe raw: "${importeElement.value}", parseado: ${importe}`);

        let descripcion = descripcionSelect.value;
        if (descripcion === 'custom' && descripcionCustom) {
            descripcion = descripcionCustom.value;
            console.log(`✏️ agregarGasto: Descripción personalizada: "${descripcion}"`);
        } else if (descripcion === 'Vacaciones' && categoria === 'variablesMensuales') {
            // Esto ya no debería suceder, pero lo mantenemos por compatibilidad
            const subcategoriaSelect = document.getElementById('subcategoria-vacaciones-select');
            const subcategoriaPersonalizada = document.getElementById('subcategoria-personalizada');
            
            let subcategoria = subcategoriaSelect.value;
            if (subcategoria === 'Personalizado') {
                subcategoria = subcategoriaPersonalizada.value;
            }
            
            if (!subcategoria) {
                alert('Por favor, selecciona una subcategoría para Vacaciones');
                this.procesandoGasto = false;
                return;
            }
            
            descripcion = `Vacaciones - ${subcategoria}`;
        }

        // Validaciones más específicas y robustas
        console.log(`🔍 agregarGasto: Validando campos...`);
        console.log(`   - Fecha: "${fecha}" (válida: ${!!fecha})`);
        console.log(`   - Descripción: "${descripcion}" (válida: ${!!descripcion && descripcion.trim() !== '' && descripcion !== 'Seleccionar'})`);
        console.log(`   - Importe raw: "${importeElement.value}", parseado: ${importe} (válido: ${!isNaN(importe) && importe > 0})`);

        // Validar fecha
        if (!fecha || fecha.trim() === '') {
            console.error(`❌ agregarGasto: Fecha vacía`);
            this.mostrarMensaje('Por favor, selecciona una fecha', 'error');
            this.procesandoGasto = false;
            return;
        }

        // Validar descripción - ser más permisivo y específico
        if (!descripcion || descripcion.trim() === '' || 
            descripcion === 'Seleccionar categoría...' || 
            descripcion === 'Seleccionar o escribir...' ||
            descripcion === '') {
            console.error(`❌ agregarGasto: Descripción vacía o placeholder: "${descripcion}"`);
            this.mostrarMensaje('Por favor, selecciona una categoría de gasto', 'error');
            this.procesandoGasto = false;
            return;
        }

        // Validar importe - ser más permisivo con números
        const importeValue = importeElement.value.trim();
        if (!importeValue || importeValue === '' || isNaN(importe) || importe <= 0) {
            console.error(`❌ agregarGasto: Importe inválido: "${importeValue}" -> ${importe}`);
            this.mostrarMensaje('Por favor, introduce un importe válido mayor a 0', 'error');
            this.procesandoGasto = false;
            return;
        }

        console.log(`✅ agregarGasto: Todos los campos son válidos`);
        
        // Convertir fecha de YYYY-MM-DD a dd-mm-aa
        const fechaFormateada = this.formatearFecha(fecha);
        console.log(`📅 agregarGasto: Fecha original: "${fecha}", formateada: "${fechaFormateada}"`);
        
        const nuevoGasto = {
            id: Date.now(),
            fecha: fechaFormateada,
            descripcion: descripcion,
            importe: importe
        };

        console.log(`🔄 agregarGasto: Agregando a categoría: ${categoria}`, nuevoGasto);
        
        // Verificar que la categoría existe antes de hacer push
        if (!this.gastos[categoria]) {
            console.warn(`⚠️ agregarGasto: Categoría ${categoria} no existe, inicializando...`);
            this.gastos[categoria] = [];
        }
        
        console.log(`📊 agregarGasto: Estado actual de gastos:`, Object.keys(this.gastos));
        this.gastos[categoria].push(nuevoGasto);
        
        console.log(`💾 agregarGasto: Guardando datos...`);
        this.guardarDatos();
        
        console.log(`🔄 agregarGasto: Actualizando interfaz...`);
        this.mostrarGastos();
        this.actualizarResumen();
        this.limpiarFormulario(categoria);

        // Mostrar mensaje de éxito
        console.log(`✅ agregarGasto: Gasto agregado exitosamente`);
        this.mostrarMensaje('Gasto agregado correctamente', 'success');
        
        // Resetear flag de procesamiento
        this.procesandoGasto = false;
    }

    // Obtener prefijo del formulario
    getFormPrefix(categoria) {
        const prefijos = {
            'fijosMensuales': 'fijo-mensual',
            'variablesMensuales': 'variable-mensual',
            'vacaciones': 'vacacion'
        };
        return prefijos[categoria];
    }

    // Limpiar formulario
    limpiarFormulario(categoria) {
        const formPrefix = this.getFormPrefix(categoria);
        
        // Establecer fecha actual
        const fechaInput = document.getElementById(`fecha-${formPrefix}`);
        if (fechaInput) {
            fechaInput.value = obtenerFechaActual();
        }
        
        // Restablecer a las opciones por defecto en lugar de vacío
        const descripcionSelect = document.getElementById(`descripcion-${formPrefix}`);
        if (descripcionSelect) {
            descripcionSelect.selectedIndex = 1; // Seleccionar primera opción válida (no el placeholder)
        }
        
        const descripcionCustom = document.getElementById(`descripcion-custom-${formPrefix}`);
        if (descripcionCustom) {
            descripcionCustom.value = '';
            descripcionCustom.style.display = 'none';
        }
        
        document.getElementById(`importe-${formPrefix}`).value = '';
        
        // Limpiar subcategorías de vacaciones si es un gasto variable (código legacy)
        if (categoria === 'variablesMensuales') {
            const subcategoriaContainer = document.getElementById('subcategoria-vacaciones');
            const subcategoriaSelect = document.getElementById('subcategoria-vacaciones-select');
            const subcategoriaPersonalizada = document.getElementById('subcategoria-personalizada');
            
            if (subcategoriaContainer) {
                subcategoriaContainer.style.display = 'none';
            }
            if (subcategoriaSelect) {
                subcategoriaSelect.value = '';
            }
            if (subcategoriaPersonalizada) {
                subcategoriaPersonalizada.style.display = 'none';
                subcategoriaPersonalizada.value = '';
            }
        }
    }

    // Eliminar gasto
    eliminarGasto(categoria, id) {
        if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
            this.gastos[categoria] = this.gastos[categoria].filter(gasto => gasto.id !== id);
            this.guardarDatos();
            this.mostrarGastos();
            this.actualizarResumen();
            this.mostrarMensaje('Gasto eliminado correctamente', 'success');
        }
    }

    // Editar gasto
    editarGasto(categoria, id) {
        console.log('🔧 Iniciando edición de gasto:', { categoria, id });
        
        const gasto = this.gastos[categoria].find(g => g.id === id);
        if (!gasto) {
            console.error('❌ Gasto no encontrado:', { categoria, id });
            return;
        }

        console.log('📝 Gasto encontrado para editar:', gasto);

        // Crear formulario de edición inline
        const gastoElement = document.querySelector(`[data-gasto-id="${id}"]`);
        if (!gastoElement) {
            console.error('❌ Elemento del gasto no encontrado en DOM');
            return;
        }

        // Crear el formulario de edición
        const editForm = this.crearFormularioEdicion(gasto, categoria, id);
        
        // Reemplazar el contenido del gasto con el formulario
        const originalContent = gastoElement.innerHTML;
        gastoElement.innerHTML = editForm;
        
        // Almacenar el contenido original para poder cancelar
        gastoElement.dataset.originalContent = originalContent;
        
        console.log('✅ Formulario de edición creado y mostrado');
    }

    // Convertir fecha dd-mm-aa a YYYY-MM-DD para inputs
    convertirFechaParaInput(fecha) {
        if (!fecha) return '';
        
        const parts = fecha.split('-');
        if (parts.length === 3) {
            const dia = parts[0];
            const mes = parts[1];
            let año = parts[2];
            
            // Si el año es de 2 dígitos, asumir siglo 21
            if (año.length === 2) {
                año = `20${año}`;
            }
            
            return `${año}-${mes}-${dia}`;
        }
        
        return fecha; // Si no puede convertir, devolver original
    }

    crearFormularioEdicion(gasto, categoria, id) {
        // Convertir fecha dd-mm-aa a YYYY-MM-DD para el input
        const fechaParaInput = this.convertirFechaParaInput(gasto.fecha);
        console.log(`📅 Fecha original: "${gasto.fecha}", para input: "${fechaParaInput}"`);
        
        return `
            <div class="edit-form">
                <div class="edit-form-header">
                    <h4>Editar Gasto</h4>
                </div>
                <div class="edit-form-body">
                    <div class="form-group">
                        <label>Descripción:</label>
                        <input type="text" id="edit-descripcion-${id}" value="${gasto.descripcion}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Importe (€):</label>
                        <input type="number" id="edit-importe-${id}" value="${gasto.importe}" step="0.01" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" id="edit-fecha-${id}" value="${fechaParaInput}" class="form-input">
                    </div>
                    <div class="form-actions">
                        <button class="btn-save" onclick="gestor.guardarEdicion('${categoria}', '${id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
                            </svg>
                            Guardar
                        </button>
                        <button class="btn-cancel" onclick="gestor.cancelarEdicion('${categoria}', '${id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    guardarEdicion(categoria, id) {
        console.log('💾 Guardando edición:', { categoria, id });
        
        const descripcion = document.getElementById(`edit-descripcion-${id}`).value.trim();
        const importe = parseFloat(document.getElementById(`edit-importe-${id}`).value);
        const fecha = document.getElementById(`edit-fecha-${id}`).value;

        // Validaciones
        if (!descripcion) {
            this.mostrarMensaje('La descripción es obligatoria', 'error');
            return;
        }
        
        if (isNaN(importe) || importe <= 0) {
            this.mostrarMensaje('El importe debe ser un número mayor a 0', 'error');
            return;
        }
        
        if (!fecha) {
            this.mostrarMensaje('La fecha es obligatoria', 'error');
            return;
        }

        // Convertir fecha al formato dd-mm-aa
        const fechaFormateada = this.formatearFecha(fecha);

        // Buscar y actualizar el gasto
        const gasto = this.gastos[categoria].find(g => g.id === id);
        if (gasto) {
            const datosAnteriores = { ...gasto };
            
            gasto.descripcion = descripcion;
            gasto.importe = importe;
            gasto.fecha = fechaFormateada;
            
            console.log('📝 Gasto actualizado:', {
                anterior: datosAnteriores,
                nuevo: gasto
            });
            
            this.guardarDatos();
            this.mostrarGastos();
            this.actualizarResumen();
            this.mostrarMensaje('Gasto actualizado correctamente', 'success');
        } else {
            console.error('❌ Error: No se pudo encontrar el gasto para actualizar');
            this.mostrarMensaje('Error al actualizar el gasto', 'error');
        }
    }

    cancelarEdicion(categoria, id) {
        console.log('❌ Cancelando edición:', { categoria, id });
        
        const gastoElement = document.querySelector(`[data-gasto-id="${id}"]`);
        if (gastoElement && gastoElement.dataset.originalContent) {
            gastoElement.innerHTML = gastoElement.dataset.originalContent;
            delete gastoElement.dataset.originalContent;
            console.log('✅ Edición cancelada, contenido original restaurado');
        }
    }

    // Mostrar gastos en las listas
    mostrarGastos() {
        this.mostrarCategoria('fijosMensuales', 'lista-fijos-mensuales');
        this.mostrarCategoria('variablesMensuales', 'lista-variables-mensuales');
        this.mostrarCategoria('vacaciones', 'lista-vacaciones');
        this.actualizarResumenDetallado();
    }

    // Mostrar una categoría específica
    mostrarCategoria(categoria, containerId) {
        const container = document.getElementById(containerId);
        const gastos = this.gastos[categoria];

        if (gastos.length === 0) {
            container.innerHTML = `
                <div class="no-gastos">
                    <i class="fas fa-inbox"></i>
                    <p>No hay gastos registrados</p>
                </div>
            `;
            return;
        }

        // Ordenar por fecha (más reciente primero)
        gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        container.innerHTML = gastos.map(gasto => `
            <div class="gasto-item ${gasto.esDelJSON ? 'gasto-json' : gasto.esPredefinido ? 'gasto-predefinido' : ''}" data-gasto-id="${gasto.id}">
                <div class="gasto-header">
                    <div class="gasto-info">
                        <div class="gasto-descripcion">
                            ${gasto.esDelJSON ? '<i class="fas fa-database"></i> ' : gasto.esPredefinido ? '<i class="fas fa-star"></i> ' : ''}${gasto.descripcion}
                            ${gasto.categoria ? `<span class="categoria-badge">${gasto.categoria}</span>` : ''}
                        </div>
                        <div class="gasto-fecha">
                            <i class="fas fa-calendar"></i> ${this.formatearFecha(gasto.fecha)}
                        </div>
                    </div>
                    <div class="gasto-right">
                        <div class="gasto-top-right">
                            <div class="gasto-importe">${gasto.importe.toFixed(2)} €</div>
                            <button class="btn-icon btn-edit" onclick="gestor.editarGasto('${categoria}', '${gasto.id}')" title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                        </div>
                        <button class="btn-icon btn-delete" onclick="gestor.eliminarGasto('${categoria}', '${gasto.id}')" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Formatear fecha
    formatearFecha(fecha) {
        // Si la fecha ya está en formato dd-mm-aa, devolverla tal como está
        if (fecha.includes('-') && fecha.split('-').length === 3) {
            const parts = fecha.split('-');
            // Si el primer elemento tiene 4 dígitos, es YYYY-MM-DD
            if (parts[0].length === 4) {
                // Convertir de YYYY-MM-DD a dd-mm-aa
                const date = new Date(fecha);
                const dia = String(date.getDate()).padStart(2, '0');
                const mes = String(date.getMonth() + 1).padStart(2, '0');
                const año = String(date.getFullYear()).slice(-2);
                return `${dia}-${mes}-${año}`;
            }
            // Si ya está en formato dd-mm-aa, devolverla tal como está
            return fecha;
        }
        
        // Para otros formatos, intentar conversión estándar
        const date = new Date(fecha);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const año = String(date.getFullYear()).slice(-2);
        return `${dia}-${mes}-${año}`;
    }

    // Actualizar resumen
    actualizarResumen() {
        const totalFijos = this.calcularTotal('fijosMensuales');
        const totalVariables = this.calcularTotal('variablesMensuales');
        const totalVacaciones = this.calcularTotal('vacaciones');
        const totalGeneral = totalFijos + totalVariables + totalVacaciones;

        // Elementos del resumen eliminados del HTML
        // document.getElementById('total-fijos').textContent = `${totalFijos.toFixed(2)} €`;
        // document.getElementById('total-variables').textContent = `${totalVariables.toFixed(2)} €`;
        // document.getElementById('total-vacaciones').textContent = `${totalVacaciones.toFixed(2)} €`;
        // document.getElementById('total-general').textContent = `${totalGeneral.toFixed(2)} €`;
        
        // Actualizar filtro de mes con nuevos datos
        this.inicializarFiltroMes();
        
        this.actualizarResumenDetallado();
    }

    // Calcular total por categoría
    calcularTotal(categoria) {
        return this.gastos[categoria].reduce((total, gasto) => total + gasto.importe, 0);
    }

    // Actualizar resumen detallado por descripción
    actualizarResumenDetallado() {
        const desglosePorDescripcion = {};
        let totalGastos = 0;
        let totalImporte = 0;

        // Recopilar datos de todas las categorías
        ['fijosMensuales', 'variablesMensuales', 'vacaciones'].forEach(categoria => {
            this.gastos[categoria].forEach(gasto => {
                const descripcion = gasto.descripcion;
                let tipo = '';
                if (categoria === 'fijosMensuales') tipo = 'Fijo';
                else if (categoria === 'variablesMensuales') tipo = 'Variable';
                else if (categoria === 'vacaciones') tipo = 'Vacaciones';
                
                if (!desglosePorDescripcion[descripcion]) {
                    desglosePorDescripcion[descripcion] = {
                        total: 0,
                        count: 0,
                        tipo: tipo,
                        categoria: categoria
                    };
                }
                
                desglosePorDescripcion[descripcion].total += gasto.importe;
                desglosePorDescripcion[descripcion].count += 1;
                totalGastos += 1;
                totalImporte += gasto.importe;
            });
        });

        // Actualizar estadísticas generales
        const totalGeneralElement = document.getElementById('resumen-total-general');
        const totalGastosElement = document.getElementById('resumen-total-gastos');
        
        if (totalGeneralElement) {
            totalGeneralElement.textContent = `${totalImporte.toFixed(2)} €`;
        }
        if (totalGastosElement) {
            totalGastosElement.textContent = totalGastos;
        }

        // Mostrar desglose
        this.mostrarDesglose(desglosePorDescripcion);
    }

    // Mostrar desglose por descripción
    mostrarDesglose(desglose, filtro = 'todos') {
        const container = document.getElementById('resumen-desglose');
        if (!container) return;

        // Filtrar datos según el filtro seleccionado
        const datosFiltrados = {};
        Object.keys(desglose).forEach(descripcion => {
            const item = desglose[descripcion];
            if (filtro === 'todos' || 
                (filtro === 'fijos' && item.categoria === 'fijosMensuales') ||
                (filtro === 'variables' && item.categoria === 'variablesMensuales') ||
                (filtro === 'vacaciones' && item.categoria === 'vacaciones')) {
                datosFiltrados[descripcion] = item;
            }
        });

        if (Object.keys(datosFiltrados).length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #888;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No hay gastos para mostrar</p>
                </div>
            `;
            return;
        }

        // Ordenar por total (mayor a menor)
        const datosOrdenados = Object.entries(datosFiltrados)
            .sort(([,a], [,b]) => b.total - a.total);

        container.innerHTML = datosOrdenados.map(([descripcion, data]) => `
            <div class="desglose-item">
                <div class="desglose-descripcion">
                    <i class="fas fa-${this.getIconoDescripcion(descripcion)}"></i>
                    <span class="descripcion-text">${descripcion}</span>
                </div>
                <div class="desglose-info">
                    <div class="desglose-total">${data.total.toFixed(2)} €</div>
                    <div class="desglose-count">${data.count} gasto${data.count > 1 ? 's' : ''}</div>
                    <div class="desglose-categoria">${data.tipo}</div>
                </div>
            </div>
        `).join('');
    }

    // Obtener icono según la descripción
    getIconoDescripcion(descripcion) {
        const iconos = {
            'Hipoteca': 'home',
            'Internet': 'wifi',
            'Seguro de Vida': 'shield-alt',
            'Seguro del Hogar': 'shield-alt',
            'Luz': 'lightbulb',
            'Agua': 'tint',
            'Supermercado': 'shopping-cart',
            'Gasolina': 'gas-pump',
            'Restaurantes': 'utensils',
            'Ocio': 'gamepad',
            'Vacaciones': 'plane',
            // Subcategorías de vacaciones
            'Vacaciones - Hotel': 'bed',
            'Vacaciones - Coche': 'car',
            'Vacaciones - Restaurante': 'utensils',
            'Vacaciones - Avión': 'plane',
            'Vacaciones - Ocio': 'gamepad',
            'Vacaciones - Gasolina': 'gas-pump'
        };
        
        // Buscar coincidencia exacta primero
        if (iconos[descripcion]) {
            return iconos[descripcion];
        }
        
        // Si es una subcategoría de vacaciones que no está definida
        if (descripcion.startsWith('Vacaciones - ')) {
            return 'plane';
        }
        
        return 'euro-sign';
    }

    // Configurar listener para cambios en tiempo real de Firebase
    setupFirebaseListener() {
        if (!firebaseDB.isAvailable()) return;

        this.firebaseListener = firebaseDB.onGastosChange((result) => {
            if (result.success) {
                console.log('� Sincronizando cambios desde la nube...');
                
                // Solo actualizar si los datos son diferentes
                const datosNuevos = {
                    fijosMensuales: result.data.gastosFijosMensuales || [],
                    variablesMensuales: result.data.gastosVariablesMensuales || [],
                    vacaciones: result.data.gastosVacaciones || []
                };

                // Verificar si hay cambios reales
                if (JSON.stringify(this.gastos) !== JSON.stringify(datosNuevos)) {
                    this.gastos = datosNuevos;
                    this.mostrarGastos();
                    this.actualizarResumen();
                    
                    // Mostrar notificación de sincronización
                    this.mostrarNotificacionSincronizacion('Datos sincronizados desde la nube');
                }
            }
        });
    }

    // Mostrar notificación de sincronización
    mostrarNotificacionSincronizacion(mensaje) {
        const notificacion = document.createElement('div');
        notificacion.textContent = `🔄 ${mensaje}`;
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #66CDAA 0%, #20B2AA 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => notificacion.style.opacity = '1', 100);
        setTimeout(() => {
            notificacion.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notificacion), 300);
        }, 2000);
    }

    // Guardar datos (Firebase + fallback localStorage)
    async guardarDatos() {
        // Siempre guardar en localStorage primero (más rápido y confiable)
        localStorage.setItem('gastosApp', JSON.stringify(this.gastos));
        console.log('💾 Datos guardados localmente');

        try {
            if (firebaseDB.isAvailable()) {
                console.log('☁️ Intentando sincronizar con la nube...');
                await firebaseDB.guardarGastos(this.gastos);
                console.log('✅ Datos sincronizados con la nube');
            } else {
                console.log('ℹ️ Firebase no disponible, datos guardados solo localmente');
            }
        } catch (error) {
            // Solo logear el error, no mostrar al usuario ya que los datos están guardados localmente
            if (error.code === 'permission-denied' || error.message.includes('permissions')) {
                console.warn('⚠️ Permisos de Firebase no configurados. Los datos se guardan localmente.');
                console.warn('💡 Para habilitar sincronización en la nube, configura las reglas de Firebase.');
            } else {
                console.warn('⚠️ Error al sincronizar con la nube:', error.message);
            }
            // Los datos ya están guardados en localStorage, así que la operación es exitosa
        }
    }

    // Cargar datos (Firebase + fallback localStorage)
    async cargarDatos() {
        try {
            if (firebaseDB.isAvailable()) {
                console.log('� Cargando desde Firebase...');
                const result = await firebaseDB.cargarGastos();
                
                if (result.success) {
                    this.gastos = {
                        fijosMensuales: result.data.gastosFijosMensuales || [],
                        variablesMensuales: result.data.gastosVariablesMensuales || [],
                        vacaciones: result.data.gastosVacaciones || []
                    };
                    
                    // Asegurar que todas las categorías existan (para compatibilidad con versiones anteriores)
                    this.gastos.fijosMensuales = this.gastos.fijosMensuales || [];
                    this.gastos.variablesMensuales = this.gastos.variablesMensuales || [];
                    this.gastos.vacaciones = this.gastos.vacaciones || [];
                    
                    console.log('✅ Datos cargados desde la nube');
                    console.log('🔧 Estructura verificada:', Object.keys(this.gastos));
                    return;
                } else {
                    throw new Error('Error en respuesta de Firebase');
                }
            } else {
                throw new Error('Firebase no disponible');
            }
        } catch (error) {
            // Manejar errores de permisos de forma silenciosa
            if (error.code === 'permission-denied' || error.message.includes('permissions')) {
                console.log('ℹ️ Firebase no configurado, cargando datos locales');
            } else {
                console.warn('⚠️ Error con Firebase, cargando localmente:', error.message);
            }
            
            // Fallback a localStorage
            const datosGuardados = localStorage.getItem('gastosApp');
            if (datosGuardados) {
                this.gastos = JSON.parse(datosGuardados);
                console.log('✅ Datos cargados desde localStorage');
                
                // Asegurar que todas las categorías existan (para compatibilidad con versiones anteriores)
                this.gastos.fijosMensuales = this.gastos.fijosMensuales || [];
                this.gastos.variablesMensuales = this.gastos.variablesMensuales || [];
                this.gastos.vacaciones = this.gastos.vacaciones || [];
                
                console.log('🔧 Estructura verificada:', Object.keys(this.gastos));
            } else {
                console.log('📝 Inicializando con datos vacíos');
                this.gastos = {
                    fijosMensuales: [],
                    variablesMensuales: [],
                    vacaciones: []
                };
            }
        }
    }

    // Cargar datos de ejemplo
    cargarDatosEjemplo() {
        // Comenzar con datos vacíos - los gastos del JSON se cargan automáticamente
        this.gastos = {
            fijosMensuales: [],
            variablesMensuales: [],
            vacaciones: []
        };
    }

    // Mostrar mensaje
    mostrarMensaje(texto, tipo = 'info') {
        // Crear elemento de mensaje
        const mensaje = document.createElement('div');
        mensaje.className = `mensaje mensaje-${tipo}`;
        mensaje.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${texto}
        `;

        // Agregar estilos dinámicamente
        mensaje.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${tipo === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            animation: slideDown 0.3s ease;
        `;

        // Agregar al DOM
        document.body.appendChild(mensaje);

        // Remover después de 3 segundos
        setTimeout(() => {
            mensaje.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (mensaje.parentNode) {
                    mensaje.parentNode.removeChild(mensaje);
                }
            }, 300);
        }, 3000);
    }
}

// Agregar estilos para animaciones de mensajes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Funcionalidad para mostrar/ocultar formularios
function setupFormToggle() {
    console.log('🔧 setupFormToggle: Configurando botones de formulario...');
    // Botones para mostrar formularios
    const showFormButtons = document.querySelectorAll('.show-form-btn');
    console.log(`📋 setupFormToggle: Encontrados ${showFormButtons.length} botones de formulario`);
    
    showFormButtons.forEach((button, index) => {
        const formId = button.getAttribute('data-form');
        console.log(`🔘 setupFormToggle: Configurando botón ${index + 1}: ${formId}`);
        
        button.addEventListener('click', () => {
            console.log(`🖱️ setupFormToggle: Click en botón de formulario: ${formId}`);
            const formContainer = document.getElementById(`container-${formId}`);
            
            if (formContainer) {
                console.log(`✅ setupFormToggle: Mostrando formulario: ${formId}`);
                formContainer.style.display = 'block';
                button.style.display = 'none';
                
                // Establecer fecha actual al abrir el formulario
                const fechaInput = formContainer.querySelector('input[type="date"]');
                if (fechaInput) {
                    fechaInput.value = obtenerFechaActual();
                    console.log(`📅 setupFormToggle: Fecha establecida: ${fechaInput.value}`);
                }
                
                // Hacer scroll suave al formulario
                formContainer.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            } else {
                console.error(`❌ setupFormToggle: No se encontró el contenedor: container-${formId}`);
            }
        });
    });
    
    // Botones para cancelar/ocultar formularios
    const cancelFormButtons = document.querySelectorAll('.cancel-form-btn');
    cancelFormButtons.forEach(button => {
        button.addEventListener('click', () => {
            const formId = button.getAttribute('data-form');
            const formContainer = document.getElementById(`container-${formId}`);
            const showButton = document.querySelector(`.show-form-btn[data-form="${formId}"]`);
            
            if (formContainer && showButton) {
                formContainer.style.display = 'none';
                showButton.style.display = 'flex';
                
                // Limpiar el formulario
                const form = document.getElementById(formId);
                if (form) {
                    form.reset();
                    // Restablecer fecha actual
                    const fechaInput = form.querySelector('input[type="date"]');
                    if (fechaInput) {
                        fechaInput.value = obtenerFechaActual();
                    }
                }
            }
        });
    });
    
    // Ocultar formulario después de enviar
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            // Permitir que se procese el envío del formulario
            setTimeout(() => {
                const formId = form.id;
                const formContainer = document.getElementById(`container-${formId}`);
                const showButton = document.querySelector(`.show-form-btn[data-form="${formId}"]`);
                
                if (formContainer && showButton) {
                    formContainer.style.display = 'none';
                    showButton.style.display = 'flex';
                }
            }, 100);
        });
    });
}

// Inicializar la aplicación
// Variable global para el gestor
let gestor;
window.gestor = null; // También disponible en window

// Función helper para obtener la fecha actual en formato ISO (YYYY-MM-DD)
function obtenerFechaActual() {
    return new Date().toISOString().split('T')[0];
}
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM cargado, inicializando aplicación...');
    gestor = new GestorGastos();
    window.gestor = gestor; // Hacer disponible globalmente
    
    // Función de debugging accesible desde la consola
    window.testVacaciones = function() {
        console.log('🧪 Test manual de vacaciones');
        gestor.agregarGasto('vacaciones');
    };

    // Función para debuggear formularios
    window.debugFormularios = function() {
        console.log('🔍 Estado actual de los formularios:');
        const categorias = ['fijosMensuales', 'variablesMensuales', 'vacaciones'];
        categorias.forEach(categoria => {
            const formPrefix = gestor.getFormPrefix(categoria);
            console.log(`📋 ${categoria} (${formPrefix}):`);
            
            const fechaEl = document.getElementById(`fecha-${formPrefix}`);
            const descEl = document.getElementById(`descripcion-${formPrefix}`);
            const importeEl = document.getElementById(`importe-${formPrefix}`);
            
            console.log(`   Fecha: ${fechaEl ? fechaEl.value : 'NO ENCONTRADO'}`);
            console.log(`   Descripción: ${descEl ? descEl.value : 'NO ENCONTRADO'}`);
            console.log(`   Importe: ${importeEl ? importeEl.value : 'NO ENCONTRADO'}`);
        });
    };

    // Función para probar agregado de gasto sin validaciones
    window.testAgregarGasto = function(categoria = 'vacaciones') {
        console.log(`🧪 Test: Intentando agregar gasto a ${categoria}`);
        const formPrefix = gestor.getFormPrefix(categoria);
        
        // Llenar campos automáticamente para testing
        const fechaEl = document.getElementById(`fecha-${formPrefix}`);
        const descEl = document.getElementById(`descripcion-${formPrefix}`);
        const importeEl = document.getElementById(`importe-${formPrefix}`);
        
        if (fechaEl && !fechaEl.value) fechaEl.value = obtenerFechaActual();
        if (descEl && descEl.value === '') descEl.selectedIndex = 1; // Seleccionar primera opción válida
        if (importeEl && !importeEl.value) importeEl.value = '25.50';
        
        console.log('🔄 Campos llenados automáticamente para test');
        window.debugFormularios();
        
        // Intentar agregar el gasto
        gestor.agregarGasto(categoria);
    };

    // Función para probar conversiones de fecha
    window.testFechas = function() {
        console.log('🧪 Probando conversiones de fecha:');
        const fechaInput = '2025-10-25'; // Formato del input
        const fechaFormateada = gestor.formatearFecha(fechaInput);
        const fechaParaInput = gestor.convertirFechaParaInput(fechaFormateada);
        
        console.log(`📅 Input original: ${fechaInput}`);
        console.log(`📅 Formateada (dd-mm-aa): ${fechaFormateada}`);
        console.log(`📅 Vuelta a input (YYYY-MM-DD): ${fechaParaInput}`);
        console.log(`✅ Conversión exitosa: ${fechaInput === fechaParaInput ? 'SÍ' : 'NO'}`);
    };

    // Función para corregir fechas existentes con años problemáticos
    window.corregirFechas = function() {
        console.log('🔧 Corrigiendo fechas con años problemáticos...');
        let gastosCorregidos = 0;
        
        ['fijosMensuales', 'variablesMensuales', 'vacaciones'].forEach(categoria => {
            gestor.gastos[categoria].forEach(gasto => {
                if (gasto.fecha) {
                    const fechaParts = gasto.fecha.split('-');
                    if (fechaParts.length === 3) {
                        const dia = fechaParts[0];
                        const mes = fechaParts[1];
                        let año = fechaParts[2];
                        
                        // Si el año es de 2 dígitos y resulta en un año irreal
                        if (año.length === 2) {
                            const añoCompleto = `20${año}`;
                            const añoNum = parseInt(añoCompleto);
                            const añoActual = new Date().getFullYear();
                            
                            // Solo corregir si el año es razonable (últimos 10 años o próximos 2)
                            if (añoNum < añoActual - 10 || añoNum > añoActual + 2) {
                                console.log(`⚠️ Fecha problemática encontrada: ${gasto.fecha}`);
                                // Cambiar a año actual
                                const nuevaFecha = `${dia}-${mes}-25`; // Asumir 2025
                                console.log(`🔄 Corrigiendo a: ${nuevaFecha}`);
                                gasto.fecha = nuevaFecha;
                                gastosCorregidos++;
                            }
                        }
                    }
                }
            });
        });
        
        if (gastosCorregidos > 0) {
            console.log(`✅ Se corrigieron ${gastosCorregidos} fechas`);
            gestor.guardarDatos();
            gestor.actualizarResumen();
            console.log('💾 Datos guardados y resumen actualizado');
        } else {
            console.log('ℹ️ No se encontraron fechas que necesiten corrección');
        }
    };
    
    // Establecer fecha actual por defecto en todos los inputs de fecha
    const fechaInputs = document.querySelectorAll('input[type="date"]');
    const fechaActual = obtenerFechaActual();
    console.log(`📅 Configurando ${fechaInputs.length} campos de fecha con: ${fechaActual}`);
    fechaInputs.forEach(input => {
        input.value = fechaActual;
        console.log(`✅ Fecha establecida en ${input.id}: ${input.value}`);
        // Asegurar que siempre muestren el calendario
        input.setAttribute('type', 'date');
        input.setAttribute('pattern', '[0-9]{4}-[0-9]{2}-[0-9]{2}');
    });
    
    // Configurar funcionalidad de mostrar/ocultar formularios
    console.log('🔧 Configurando toggle de formularios...');
    setupFormToggle();
    console.log('✅ Aplicación inicializada completamente');
});

function limpiarTodos() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los gastos? Esta acción no se puede deshacer.')) {
        gestor.gastos = {
            fijosMensuales: [],
            variablesMensuales: [],
            vacaciones: []
        };
        gestor.guardarDatos();
        // Recargar la página para que vuelva a cargar desde el JSON
        location.reload();
    }
}