# 📱 Gestión de Gastos Móvil

Una aplicación web responsiva diseñada exclusivamente para dispositivos móviles que te permite gestionar tus gastos fijos y variables de manera sencilla y organizada.

## 🚀 Características

### Gastos Fijos
- **Mensuales**: Hipoteca, Internet, Seguro de Vida, Seguro del Hogar y opciones personalizadas
- **Semestrales**: IBI, Basura, Cochera y opciones personalizadas

### Gastos Variables
- **Mensuales**: Luz, Supermercado, Gasolina, Restaurantes, Ropa y opciones personalizadas
- **Trimestrales**: Agua, Gas y opciones personalizadas

### Funcionalidades Principales
- ✅ Interfaz optimizada para móvil
- ✅ Navegación por pestañas intuitiva
- ✅ Formularios con opciones predefinidas y personalizadas
- ✅ Agregar, editar y eliminar gastos
- ✅ Resumen automático de totales
- ✅ Almacenamiento local (los datos persisten en tu navegador)
- ✅ Datos de ejemplo incluidos
- ✅ Diseño responsive y moderno
- ✅ Animaciones suaves
- ✅ Modo oscuro automático (respeta la configuración del sistema)

## 📂 Estructura del Proyecto

```
gastos-movil/
├── index.html          # Página principal
├── styles.css          # Estilos CSS optimizados para móvil
├── script.js           # Funcionalidad JavaScript
└── README.md           # Este archivo
```

## 🔧 Instalación y Uso

1. **Descarga los archivos** en una carpeta local
2. **Abre `index.html`** en tu navegador móvil o en el modo de desarrollador móvil de tu navegador de escritorio
3. **¡Comienza a usar la aplicación!**

### Para usar en móvil:
- Transfiere los archivos a tu dispositivo móvil
- Abre `index.html` con cualquier navegador móvil (Chrome, Safari, Firefox, etc.)
- Opcionalmente, agrega la página a tu pantalla de inicio para acceso rápido

## 📱 Cómo Usar

### 1. Navegación
- Usa las pestañas **"Gastos Fijos"** y **"Gastos Variables"** para cambiar entre categorías
- Cada pestaña contiene subcategorías (mensuales, semestrales, trimestrales)

### 2. Agregar Gastos
- Selecciona la fecha del gasto
- Elige una descripción predefinida o selecciona "Otro (personalizado)"
- Introduce el importe en euros
- Pulsa "Agregar Gasto"

### 3. Gestionar Gastos
- **Editar**: Pulsa el botón "Editar" en cualquier gasto
- **Eliminar**: Pulsa el botón "Eliminar" (se solicitará confirmación)
- Los gastos se ordenan automáticamente por fecha (más recientes primero)

### 4. Resumen
- En la parte inferior siempre verás un resumen con:
  - Total de Gastos Fijos
  - Total de Gastos Variables
  - Total General

## 🎨 Personalización

### Gastos Predefinidos Incluidos

**Gastos Fijos Mensuales:**
- Hipoteca
- Internet
- Seguro de Vida
- Seguro del Hogar

**Gastos Fijos Semestrales:**
- IBI
- Basura
- Cochera

**Gastos Variables Mensuales:**
- Luz
- Supermercado
- Gasolina
- Restaurantes
- Ropa

**Gastos Variables Trimestrales:**
- Agua
- Gas

### Datos de Ejemplo
La aplicación incluye algunos gastos de ejemplo para ayudarte a comenzar. Puedes eliminarlos individualmente o usar la función `limpiarTodos()` desde la consola del navegador.

## 💾 Almacenamiento de Datos

- Los datos se guardan automáticamente en el **localStorage** de tu navegador
- Los datos persisten incluso si cierras el navegador
- **Importante**: Los datos se almacenan localmente en tu dispositivo y no se comparten

### Exportar/Importar Datos (Función Avanzada)
Puedes usar las siguientes funciones desde la consola del navegador:

```javascript
// Exportar datos a archivo JSON
exportarDatos();

// Importar datos desde archivo JSON
importarDatos();

// Limpiar todos los datos
limpiarTodos();
```

## 🌙 Modo Oscuro

La aplicación detecta automáticamente la preferencia de tema de tu dispositivo:
- Se activará el modo oscuro si tu dispositivo está configurado en tema oscuro
- Se mantendrá el modo claro si tu dispositivo está configurado en tema claro

## 📱 Compatibilidad

- **Navegadores móviles**: Chrome, Safari, Firefox, Edge
- **Sistemas**: iOS, Android
- **Tamaños de pantalla**: Optimizado para pantallas de 320px a 480px de ancho
- **Versiones**: Funciona en navegadores modernos (últimos 2 años)

## 🔧 Características Técnicas

- **Responsive Design**: CSS Grid y Flexbox
- **Progressive Web App Ready**: Puede agregarse a la pantalla de inicio
- **Sin dependencias externas**: Solo usa Font Awesome para iconos
- **Almacenamiento local**: localStorage API
- **Animaciones CSS**: Transiciones suaves y micro-interacciones
- **Accesibilidad**: Diseño accesible con contrastes adecuados

## 🚀 Próximas Mejoras Posibles

- Gráficos de gastos por categoría
- Exportación a CSV/Excel
- Recordatorios de pagos recurrentes
- Búsqueda y filtros avanzados
- Categorías completamente personalizables
- Sincronización en la nube
- Modo PWA completo con instalación

## 📄 Licencia

Este proyecto es de uso libre. Puedes modificarlo y distribuirlo según tus necesidades.

---

¡Esperamos que disfrutes usando esta aplicación para gestionar tus gastos de manera más organizada! 🎉