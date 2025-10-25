const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const GASTOS_FILE = path.join(__dirname, 'gastos-fijos.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Servir archivos estáticos

// Función para leer datos del JSON
async function leerGastos() {
    try {
        const data = await fs.readFile(GASTOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo gastos:', error);
        // Si no existe el archivo, crear estructura básica
        const estructuraBasica = {
            gastosFijosMensuales: [],
            gastosFijosSemestrales: [],
            configuracion: {
                version: "1.0",
                fechaActualizacion: new Date().toISOString().split('T')[0],
                moneda: "EUR"
            }
        };
        await guardarGastos(estructuraBasica);
        return estructuraBasica;
    }
}

// Función para escribir datos al JSON
async function guardarGastos(datos) {
    try {
        // Actualizar fecha de modificación
        if (datos.configuracion) {
            datos.configuracion.fechaActualizacion = new Date().toISOString().split('T')[0];
        }
        
        await fs.writeFile(GASTOS_FILE, JSON.stringify(datos, null, 2), 'utf8');
        console.log('✅ Gastos guardados correctamente en', new Date().toLocaleTimeString());
        return true;
    } catch (error) {
        console.error('❌ Error guardando gastos:', error);
        return false;
    }
}

// RUTAS DE LA API

// GET /api/gastos - Obtener todos los gastos
app.get('/api/gastos', async (req, res) => {
    try {
        const gastos = await leerGastos();
        res.json({
            success: true,
            data: gastos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener gastos: ' + error.message
        });
    }
});

// POST /api/guardar-gastos - Guardar todos los gastos
app.post('/api/guardar-gastos', async (req, res) => {
    try {
        const datosCompletos = req.body;
        
        // Validar estructura básica
        if (!datosCompletos || typeof datosCompletos !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos'
            });
        }
        
        // Asegurar que existan las propiedades necesarias
        const datosNormalizados = {
            gastosFijosMensuales: datosCompletos.gastosFijosMensuales || [],
            gastosFijosSemestrales: datosCompletos.gastosFijosSemestrales || [],
            gastosVariablesMensuales: datosCompletos.gastosVariablesMensuales || [],
            gastosVariablesTrimestrales: datosCompletos.gastosVariablesTrimestrales || [],
            configuracion: {
                version: "1.0",
                fechaActualizacion: new Date().toISOString().split('T')[0],
                moneda: "EUR",
                ...datosCompletos.configuracion
            }
        };
        
        const exito = await guardarGastos(datosNormalizados);
        
        if (exito) {
            res.json({
                success: true,
                message: 'Gastos guardados correctamente',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error al guardar gastos'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
});

// POST /api/agregar-gasto - Agregar un gasto específico
app.post('/api/agregar-gasto', async (req, res) => {
    try {
        const { categoria, gasto } = req.body;
        
        if (!categoria || !gasto) {
            return res.status(400).json({
                success: false,
                error: 'Categoría y gasto son requeridos'
            });
        }
        
        // Leer datos actuales
        const datosActuales = await leerGastos();
        
        // Agregar el nuevo gasto a la categoría correspondiente
        switch (categoria) {
            case 'fijosMensuales':
                datosActuales.gastosFijosMensuales = datosActuales.gastosFijosMensuales || [];
                datosActuales.gastosFijosMensuales.push(gasto);
                break;
            case 'fijosSemestrales':
                datosActuales.gastosFijosSemestrales = datosActuales.gastosFijosSemestrales || [];
                datosActuales.gastosFijosSemestrales.push(gasto);
                break;
            case 'variablesMensuales':
                datosActuales.gastosVariablesMensuales = datosActuales.gastosVariablesMensuales || [];
                datosActuales.gastosVariablesMensuales.push(gasto);
                break;
            case 'variablesTrimestrales':
                datosActuales.gastosVariablesTrimestrales = datosActuales.gastosVariablesTrimestrales || [];
                datosActuales.gastosVariablesTrimestrales.push(gasto);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Categoría inválida'
                });
        }
        
        const exito = await guardarGastos(datosActuales);
        
        if (exito) {
            res.json({
                success: true,
                message: 'Gasto agregado correctamente',
                data: datosActuales
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error al guardar el gasto'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
});

// DELETE /api/eliminar-gasto - Eliminar un gasto específico
app.delete('/api/eliminar-gasto', async (req, res) => {
    try {
        const { categoria, gastoId } = req.body;
        
        if (!categoria || !gastoId) {
            return res.status(400).json({
                success: false,
                error: 'Categoría y ID del gasto son requeridos'
            });
        }
        
        // Leer datos actuales
        const datosActuales = await leerGastos();
        
        // Eliminar el gasto de la categoría correspondiente
        let encontrado = false;
        switch (categoria) {
            case 'fijosMensuales':
                const indexFM = datosActuales.gastosFijosMensuales.findIndex(g => g.id == gastoId);
                if (indexFM !== -1) {
                    datosActuales.gastosFijosMensuales.splice(indexFM, 1);
                    encontrado = true;
                }
                break;
            case 'fijosSemestrales':
                const indexFS = datosActuales.gastosFijosSemestrales.findIndex(g => g.id == gastoId);
                if (indexFS !== -1) {
                    datosActuales.gastosFijosSemestrales.splice(indexFS, 1);
                    encontrado = true;
                }
                break;
            case 'variablesMensuales':
                const indexVM = datosActuales.gastosVariablesMensuales?.findIndex(g => g.id == gastoId);
                if (indexVM !== -1) {
                    datosActuales.gastosVariablesMensuales.splice(indexVM, 1);
                    encontrado = true;
                }
                break;
            case 'variablesTrimestrales':
                const indexVT = datosActuales.gastosVariablesTrimestrales?.findIndex(g => g.id == gastoId);
                if (indexVT !== -1) {
                    datosActuales.gastosVariablesTrimestrales.splice(indexVT, 1);
                    encontrado = true;
                }
                break;
        }
        
        if (!encontrado) {
            return res.status(404).json({
                success: false,
                error: 'Gasto no encontrado'
            });
        }
        
        const exito = await guardarGastos(datosActuales);
        
        if (exito) {
            res.json({
                success: true,
                message: 'Gasto eliminado correctamente',
                data: datosActuales
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error al eliminar el gasto'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
});

// Ruta principal - servir la aplicación
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
🚀 Servidor de Gastos Móvil iniciado
📍 URL: http://localhost:${PORT}
🗂️  Archivo JSON: ${GASTOS_FILE}
⏰ ${new Date().toLocaleString()}
    `);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n👋 Cerrando servidor...');
    process.exit(0);
});