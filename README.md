# Incendios Patagonia

Sistema de monitoreo en tiempo real de incendios forestales para la región de Esquel y alrededores (Patagonia Argentina), utilizando datos satelitales de NASA FIRMS.

## 🚀 Características

- **Visualización en tiempo real** de focos de incendio detectados por satélites NASA
- **Mapa interactivo** con múltiples capas (puntos, heatmap, eventos)
- **Análisis de tendencias** basado en FRP (Fire Radiative Power)
- **Clustering inteligente** de focos en eventos de incendio
- **Geocodificación local** con nombres de lugares conocidos
- **Interfaz responsive** optimizada para móviles y desktop
- **Actualización automática** cada 60 segundos

## 📊 Indicadores

### Focos
Muestra cada detección individual como punto rojo. Útil para ver la ubicación exacta de cada foco detectado.

### Mapa de Calor (Heatmap)
Visualiza la densidad e intensidad de focos usando colores cálidos. Las áreas más rojas indican mayor concentración e intensidad.

### Eventos (Clusters)
Agrupa focos cercanos en eventos de incendio. Cada círculo representa un evento con su centro aproximado.

**Estados de tendencia:**
- 🔴 **Rojo ↑ Creciente**: El incendio está aumentando en intensidad
- 🟢 **Verde ↓ Decreciente**: El incendio está disminuyendo
- 🟠 **Naranja → Estable**: El incendio mantiene su intensidad
- ⚫ **Gris ○ Extinto**: No hay detecciones recientes

## 🛠️ Tecnologías

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Leaflet** + react-leaflet para mapas
- **leaflet.heat** para visualización de calor
- **NASA FIRMS API** como fuente de datos

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/incendios-patagonia.git
cd incendios-patagonia

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local y agregar tu FIRMS_MAP_KEY de NASA
```

### Obtener API Key de NASA FIRMS

1. Visita https://firms.modaps.eosdis.nasa.gov/api/
2. Regístrate para obtener tu `MAP_KEY`
3. Agrega la clave en `.env.local`:
   ```
   FIRMS_MAP_KEY=tu_clave_aqui
   ```

## 🚀 Uso

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🗺️ Área de Cobertura

Por defecto, la aplicación monitorea la región de:
- **Esquel** y alrededores
- **Epuyén**
- **Parque Nacional Los Alerces**
- Y otras localidades de la Patagonia Argentina

El bounding box puede configurarse vía query parameters en el endpoint `/api/firms/points`.

## 📡 Fuentes de Datos

La aplicación utiliza múltiples fuentes satelitales de NASA FIRMS:
- **VIIRS_SNPP_NRT** (Suomi NPP)
- **VIIRS_NOAA20_NRT** (NOAA-20)

Los datos se unifican automáticamente para mayor cobertura temporal.

## 🔧 Configuración

### Parámetros de Clustering

- **Distancia máxima**: 1500 metros (1.5 km)
- **Puntos mínimos**: 4 detecciones por cluster

### Rangos Temporales

- **6h, 12h, 24h**: Filtrado en frontend (API devuelve 1 día)
- **48h**: API devuelve 2 días
- **7d**: API devuelve 5 días (máximo permitido por NASA)

## 📱 Responsive

La aplicación está optimizada para:
- **Desktop**: Paneles flotantes, sidebar expandido
- **Móvil**: Layout adaptativo, paneles a pantalla completa

## 🎯 Funcionalidades Principales

1. **Monitoreo en tiempo real** con actualización automática
2. **Análisis de tendencias** comparando períodos de 24h
3. **Geocodificación local** con nombres de lugares conocidos
4. **Múltiples capas visuales** activables/desactivables
5. **Lista de eventos** con navegación directa al mapa
6. **Información detallada** en popups y sidebar

## 📝 Estructura del Proyecto

```
incendios-patagonia/
├── app/
│   ├── api/
│   │   └── firms/
│   │       └── points/          # Endpoint API FIRMS
│   ├── components/              # Componentes React
│   │   ├── FireMap.tsx         # Componente principal
│   │   ├── FirePointsLayer.tsx # Capa de puntos
│   │   ├── FireHeatLayer.tsx   # Capa de heatmap
│   │   ├── FireEventsLayer.tsx # Capa de eventos
│   │   ├── FireEventsSidebar.tsx # Sidebar de eventos
│   │   ├── ControlPanel.tsx    # Panel de control
│   │   └── MapControls.tsx     # Controles temporales
│   └── lib/
│       ├── clustering.ts       # Algoritmo DBSCAN
│       ├── trendAnalysis.ts    # Análisis de tendencias
│       ├── time.ts             # Utilidades de tiempo
│       └── places.ts           # Geocodificación local
└── README.md
```

## 🔐 Variables de Entorno

- `FIRMS_MAP_KEY`: API key de NASA FIRMS (requerida)

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en GitHub.

---

**Nota**: Esta aplicación utiliza datos públicos de NASA FIRMS y está diseñada para uso informativo. No reemplaza sistemas oficiales de alerta de incendios.
