# Frontend - PWA Import Marketplace

Aplicación React con Vite para gestión de productos importados.

## Stack Tecnológico

- **React 18** - Framework UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos
- **React Router** - Navegación
- **Supabase Client** - Backend API
- **Lucide React** - Iconos

## Setup Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno

Crea el archivo `.env.local` con tus credenciales de Supabase:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación se abrirá en `http://localhost:3000`

## Comandos Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter
```

## Estructura del Proyecto
```
frontend/
├── src/
│   ├── components/      # Componentes reutilizables
│   │   └── Layout.jsx
│   ├── pages/          # Páginas principales
│   │   ├── ListasPage.jsx
│   │   └── ProductosPage.jsx
│   ├── services/       # Servicios externos
│   │   └── supabaseClient.js
│   ├── utils/          # Funciones utilitarias
│   ├── App.jsx         # Componente principal
│   ├── main.jsx        # Entry point
│   └── index.css       # Estilos globales
├── public/             # Assets estáticos
└── index.html          # HTML base
```

## Rutas de la Aplicación

- `/` - Página principal (Listas de Oferta)
- `/listas/:idLista/productos` - Productos de una lista específica