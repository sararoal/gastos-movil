// firebase-database.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    deleteDoc, 
    getDocs, 
    onSnapshot,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

class FirebaseDatabase {
    constructor() {
        this.app = null;
        this.db = null;
        this.isInitialized = false;
        this.gastosCollection = 'gastos-compartidos';
    }

    // Inicializar Firebase
    async init() {
        try {
            console.log('🔥 Inicializando Firebase...');
            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);
            this.isInitialized = true;
            console.log('✅ Firebase inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            return false;
        }
    }

    // Verificar si Firebase está disponible
    isAvailable() {
        return this.isInitialized && this.db;
    }

    // Guardar todos los gastos
    async guardarGastos(gastos) {
        if (!this.isAvailable()) {
            throw new Error('Firebase no está inicializado');
        }

        try {
            console.log('💾 Guardando gastos en Firebase...');
            
            const gastosData = {
                gastosFijosMensuales: gastos.fijosMensuales || [],
                gastosFijosSemestrales: gastos.fijosSemestrales || [],
                gastosVariablesMensuales: gastos.variablesMensuales || [],
                gastosVariablesTrimestrales: gastos.variablesTrimestrales || [],
                ultimaActualizacion: serverTimestamp(),
                version: "1.0"
            };

            // Usar un documento fijo para que sea compartido
            const docRef = doc(this.db, this.gastosCollection, 'datos-principales');
            await setDoc(docRef, gastosData);
            
            console.log('✅ Gastos guardados en Firebase');
            return { success: true, message: 'Datos guardados en la nube' };
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error);
            throw error;
        }
    }

    // Cargar todos los gastos
    async cargarGastos() {
        if (!this.isAvailable()) {
            throw new Error('Firebase no está inicializado');
        }

        try {
            console.log('📥 Cargando gastos desde Firebase...');
            
            const docRef = doc(this.db, this.gastosCollection, 'datos-principales');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('✅ Gastos cargados desde Firebase');
                
                return {
                    success: true,
                    data: {
                        gastosFijosMensuales: data.gastosFijosMensuales || [],
                        gastosFijosSemestrales: data.gastosFijosSemestrales || [],
                        gastosVariablesMensuales: data.gastosVariablesMensuales || [],
                        gastosVariablesTrimestrales: data.gastosVariablesTrimestrales || [],
                        ultimaActualizacion: data.ultimaActualizacion
                    }
                };
            } else {
                // Si no existe el documento, crear uno vacío
                console.log('📝 No hay datos previos, creando estructura inicial...');
                const gastosVacios = {
                    fijosMensuales: [],
                    fijosSemestrales: [],
                    variablesMensuales: [],
                    variablesTrimestrales: []
                };
                
                await this.guardarGastos(gastosVacios);
                
                return {
                    success: true,
                    data: {
                        gastosFijosMensuales: [],
                        gastosFijosSemestrales: [],
                        gastosVariablesMensuales: [],
                        gastosVariablesTrimestrales: []
                    }
                };
            }
        } catch (error) {
            console.error('❌ Error cargando desde Firebase:', error);
            throw error;
        }
    }

    // Escuchar cambios en tiempo real
    onGastosChange(callback) {
        if (!this.isAvailable()) {
            console.warn('⚠️ Firebase no disponible para escuchar cambios');
            return null;
        }

        try {
            console.log('👂 Escuchando cambios en tiempo real...');
            const docRef = doc(this.db, this.gastosCollection, 'datos-principales');
            
            return onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    console.log('🔄 Cambios detectados en Firebase');
                    callback({
                        success: true,
                        data: {
                            gastosFijosMensuales: data.gastosFijosMensuales || [],
                            gastosFijosSemestrales: data.gastosFijosSemestrales || [],
                            gastosVariablesMensuales: data.gastosVariablesMensuales || [],
                            gastosVariablesTrimestrales: data.gastosVariablesTrimestrales || []
                        }
                    });
                }
            }, (error) => {
                console.error('❌ Error escuchando cambios:', error);
                callback({ success: false, error: error.message });
            });
        } catch (error) {
            console.error('❌ Error configurando listener:', error);
            return null;
        }
    }

    // Agregar un gasto específico
    async agregarGasto(categoria, gasto) {
        try {
            // Cargar datos actuales
            const datosActuales = await this.cargarGastos();
            if (!datosActuales.success) {
                throw new Error('No se pudieron cargar los datos actuales');
            }

            // Agregar nuevo gasto
            const gastos = {
                fijosMensuales: datosActuales.data.gastosFijosMensuales || [],
                fijosSemestrales: datosActuales.data.gastosFijosSemestrales || [],
                variablesMensuales: datosActuales.data.gastosVariablesMensuales || [],
                variablesTrimestrales: datosActuales.data.gastosVariablesTrimestrales || []
            };

            // Asignar ID único si no lo tiene
            if (!gasto.id) {
                gasto.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            // Agregar a la categoría correspondiente
            switch (categoria) {
                case 'fijosMensuales':
                    gastos.fijosMensuales.push(gasto);
                    break;
                case 'fijosSemestrales':
                    gastos.fijosSemestrales.push(gasto);
                    break;
                case 'variablesMensuales':
                    gastos.variablesMensuales.push(gasto);
                    break;
                case 'variablesTrimestrales':
                    gastos.variablesTrimestrales.push(gasto);
                    break;
                default:
                    throw new Error('Categoría inválida');
            }

            // Guardar todos los datos actualizados
            await this.guardarGastos(gastos);
            
            return { success: true, message: 'Gasto agregado correctamente' };
        } catch (error) {
            console.error('❌ Error agregando gasto:', error);
            throw error;
        }
    }

    // Eliminar un gasto específico
    async eliminarGasto(categoria, gastoId) {
        try {
            // Cargar datos actuales
            const datosActuales = await this.cargarGastos();
            if (!datosActuales.success) {
                throw new Error('No se pudieron cargar los datos actuales');
            }

            const gastos = {
                fijosMensuales: datosActuales.data.gastosFijosMensuales || [],
                fijosSemestrales: datosActuales.data.gastosFijosSemestrales || [],
                variablesMensuales: datosActuales.data.gastosVariablesMensuales || [],
                variablesTrimestrales: datosActuales.data.gastosVariablesTrimestrales || []
            };

            // Eliminar de la categoría correspondiente
            let encontrado = false;
            switch (categoria) {
                case 'fijosMensuales':
                    const indexFM = gastos.fijosMensuales.findIndex(g => g.id == gastoId);
                    if (indexFM !== -1) {
                        gastos.fijosMensuales.splice(indexFM, 1);
                        encontrado = true;
                    }
                    break;
                case 'fijosSemestrales':
                    const indexFS = gastos.fijosSemestrales.findIndex(g => g.id == gastoId);
                    if (indexFS !== -1) {
                        gastos.fijosSemestrales.splice(indexFS, 1);
                        encontrado = true;
                    }
                    break;
                case 'variablesMensuales':
                    const indexVM = gastos.variablesMensuales.findIndex(g => g.id == gastoId);
                    if (indexVM !== -1) {
                        gastos.variablesMensuales.splice(indexVM, 1);
                        encontrado = true;
                    }
                    break;
                case 'variablesTrimestrales':
                    const indexVT = gastos.variablesTrimestrales.findIndex(g => g.id == gastoId);
                    if (indexVT !== -1) {
                        gastos.variablesTrimestrales.splice(indexVT, 1);
                        encontrado = true;
                    }
                    break;
            }

            if (!encontrado) {
                throw new Error('Gasto no encontrado');
            }

            // Guardar datos actualizados
            await this.guardarGastos(gastos);
            
            return { success: true, message: 'Gasto eliminado correctamente' };
        } catch (error) {
            console.error('❌ Error eliminando gasto:', error);
            throw error;
        }
    }
}

// Exportar instancia única
const firebaseDB = new FirebaseDatabase();
export default firebaseDB;