# 🛍️ PWA Import Marketplace

Plataforma PWA para la comercialización de productos importados desde USA con cálculo automático de precios en COP.

![Estado](https://img.shields.io/badge/estado-desarrollo-yellow)
![Módulo 01](https://img.shields.io/badge/módulo%2001-completado-green)
![Módulo 03](https://img.shields.io/badge/módulo%2003-pendiente-red)

---

## 📋 Índice

- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Inicio Rápido](#-inicio-rápido)
- [Estado del Desarrollo](#-estado-del-desarrollo)
- [Retomar Desarrollo con Claude](#-retomar-desarrollo-con-claude)
- [Documentación](#-documentación)
- [Comandos Útiles](#-comandos-útiles)

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool y dev server
- **Tailwind CSS 3.4** - Framework de estilos
- **React Router DOM** - Navegación
- **Lucide React** - Iconos

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL (Base de datos)
  - Auth (Autenticación JWT)
  - Storage (Almacenamiento de imágenes)
  - Edge Functions (Lógica serverless)

### Hosting
- **Frontend:** Vercel
- **Backend:** Supabase Cloud

---

## 📁 Estructura del Proyecto

```
pwa-import-marketplace/
├── docs/                          # 📚 Documentación completa
│   ├── requirements/              # Requerimientos de negocio
│   ├── architecture/              # Arquitectura técnica
│   ├── prompts/                   # Historial de desarrollo
│   ├── api/                       # Documentación de APIs
│   └── deployment/                # Guías de despliegue
│
├── frontend/                      # 🎨 Aplicación React PWA
│   ├── src/
│   │   ├── components/            # Componentes reutilizables
│   │   ├── pages/                 # Páginas principales
│   │   └── services/              # Servicios (Supabase, upload)
│   ├── .env.local                 # Variables de entorno
│   └── package.json
│
├── supabase/                      # ⚙️ Configuración backend
│   ├── migrations/                # Migraciones SQL
│   └── schema_listas_productos.sql
│
├── scripts/                       # 🔧 Scripts de utilidad
│
├── PROJECT_CONTEXT.md             # 📖 Contexto completo del proyecto
├── CURRENT_STATUS.md              # 📊 Estado actual y próximos pasos
├── START_HERE.md                  # 🚀 Guía rápida para Claude
└── README.md                      # Este archivo
```

---

## ⚡ Inicio Rápido

### Prerequisitos
- Node.js 18+ y npm
- Cuenta de Supabase (gratuita)
- Git

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/HJCUERVOCHIC/pwa-import-marketplace.git
cd pwa-import-marketplace
```

2. **Configurar Supabase**
```bash
# Crear proyecto en https://supabase.com/dashboard
# Copiar URL y anon key del proyecto
```

3. **Configurar variables de entorno**
```bash
cd frontend
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

4. **Instalar dependencias**
```bash
npm install
```

5. **Aplicar migraciones SQL**
```bash
# En Supabase Dashboard → SQL Editor
# Ejecutar el contenido de: supabase/schema_listas_productos.sql
```

6. **Iniciar servidor de desarrollo**
```bash
npm run dev
# Abre http://localhost:3000
```

### Configuración Adicional

Ver guía completa: `/docs/deployment/setup-local.md`

---

## 📊 Estado del Desarrollo

### ✅ Módulo 01: Gestión de Productos y Cálculo de Precios (COMPLETADO)

**Funcionalidades operativas:**
- ✅ Modelo de datos con triggers automáticos
- ✅ Visualización de listas de oferta
- ✅ Formulario de creación de listas (TRM + TAX)
- ✅ Editor de productos con calculadora en tiempo real
- ✅ Upload múltiple de imágenes a Supabase Storage
- ✅ Cálculos automáticos (costo, precio, ganancia)
- ✅ Modo manual/automático para precio final
- ✅ Validaciones completas (cliente + base de datos)
- ✅ Redondeo automático a miles
- ✅ Formato de moneda colombiana

**Pendientes menores:**
- [ ] Edición de productos existentes
- [ ] Publicación de productos
- [ ] Edición y duplicado de listas

### 🔴 Módulo 03: Autenticación de Administradores (PRIORIDAD ALTA)

**Por implementar:**
- [ ] Configurar Supabase Auth
- [ ] Página de login
- [ ] Protección de rutas
- [ ] Gestión de roles (superadmin, admin_full)
- [ ] Habilitar RLS (Row Level Security)
- [ ] Políticas de seguridad en Storage

**Estado actual de seguridad:** ⚠️ **SIN PROTECCIÓN** (solo desarrollo local)

### 📋 Otros Módulos

- **Módulo 02:** Gestión de Listas (40% completado)
- **Módulo 04:** Catálogo Público (no iniciado)
- **Módulo 05:** PWA Features (no iniciado)

Ver estado detallado: [`CURRENT_STATUS.md`](./CURRENT_STATUS.md)

---

## 🔄 Retomar Desarrollo con Claude

Si has alcanzado el límite de conversación con Claude y necesitas continuar, sigue estos pasos:

### 1️⃣ Inicia una nueva conversación

### 2️⃣ Comparte estos archivos con Claude

Arrastra y suelta en el chat:
```
PROJECT_CONTEXT.md          # Contexto completo (arquitectura, decisiones)
CURRENT_STATUS.md           # Estado actual y próximos pasos
START_HERE.md               # Guía rápida para Claude
```

### 3️⃣ Comparte la URL del repositorio

```
https://github.com/HJCUERVOCHIC/pwa-import-marketplace
```

### 4️⃣ Claude estará al día

Claude leerá la documentación y podrá continuar exactamente donde quedaste, conociendo:
- ✅ Toda la arquitectura del proyecto
- ✅ Decisiones técnicas tomadas
- ✅ Estado actual del desarrollo
- ✅ Funcionalidades completadas
- ✅ Próximos pasos recomendados
- ✅ Problemas conocidos y soluciones

### 🎯 Ventajas de este Sistema

- **Sin pérdida de contexto:** Claude conoce toda la historia del proyecto
- **Continuidad garantizada:** Puede retomar desde el punto exacto
- **Decisiones documentadas:** No se repiten debates técnicos
- **Historial completo:** Cada sesión queda registrada en `/docs/prompts/`

### 📝 Después de Cada Sesión

Al terminar una sesión de desarrollo, Claude creará:
```
docs/prompts/session-00X-descripcion.md    # Documenta lo realizado
```

Y actualizará (si es necesario):
```
CURRENT_STATUS.md           # Estado actualizado
PROJECT_CONTEXT.md          # Si hubo cambios importantes
```

---

## 📚 Documentación

### Archivos Principales
- **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Contexto completo del proyecto
- **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - Estado actual y próximos pasos
- **[START_HERE.md](./START_HERE.md)** - Guía rápida para Claude

### Requerimientos de Negocio
- [Módulo 01: Productos y Cálculo de Precios](./docs/requirements/01-productos-calculo-precios.md)
- [Módulo 03: Autenticación de Administradores](./docs/requirements/03-auth-admin.md)

### Arquitectura Técnica
- [Modelo de Datos Completo](./docs/architecture/modelo-datos.md)

### Historial de Desarrollo
- [Sesión 002: Modelo de Datos](./docs/prompts/session-002-modelo-datos.md)
- [Sesión 003: Frontend Inicial](./docs/prompts/session-003-frontend-inicial.md)
- [Sesión 004: Formulario de Listas](./docs/prompts/session-004-formulario-listas.md)
- [Sesión 005: Editor de Productos](./docs/prompts/session-005-editor-productos.md)

---

## 🔧 Comandos Útiles

### Desarrollo
```bash
cd frontend
npm run dev              # Inicia servidor de desarrollo (puerto 3000)
npm run build            # Build para producción
npm run preview          # Preview del build
npm run lint             # Linter (si está configurado)
```

### Base de Datos (Supabase SQL Editor)
```sql
-- Ver todas las listas
SELECT * FROM listas_oferta ORDER BY created_at DESC;

-- Ver productos de una lista
SELECT * FROM productos WHERE id_lista = 'uuid-aqui';

-- Ver estructura de tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'productos';

-- Ver triggers activos
SELECT * FROM pg_trigger WHERE tgname LIKE '%producto%';

-- Ver imágenes en Storage
SELECT * FROM storage.objects WHERE bucket_id = 'productos-imagenes';
```

### Git
```bash
git status                                    # Ver cambios
git add .                                     # Agregar todos los cambios
git commit -m "feat: descripción"            # Commit con mensaje
git push origin main                          # Push a GitHub
git log --oneline --graph --all              # Ver historial
```

---

## 🔐 Configuración de Seguridad

### ⚠️ Desarrollo (Estado Actual)
```
✓ RLS deshabilitado (acceso completo para pruebas)
✓ Storage público (imágenes accesibles sin auth)
✓ Sin autenticación requerida
```

### 🔒 Producción (Pendiente - Módulo 03)
```
✓ RLS habilitado con políticas por rol
✓ Storage privado con acceso controlado
✓ Autenticación obligatoria para panel admin
✓ Tokens JWT con expiración 24h
✓ Auditoría de accesos
```

---

## 🤝 Contribuir

### Flujo de Trabajo

1. **Crear rama para feature**
```bash
git checkout -b feature/nombre-funcionalidad
```

2. **Desarrollar y commitear**
```bash
git add .
git commit -m "feat: descripción del cambio"
```

3. **Documentar en `/docs/prompts/`**
```bash
# Crear session-00X-descripcion.md
```

4. **Push y Pull Request**
```bash
git push origin feature/nombre-funcionalidad
# Crear PR en GitHub
```

### Convenciones

- **Commits:** Usar [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` nueva funcionalidad
  - `fix:` corrección de bug
  - `docs:` cambios en documentación
  - `refactor:` refactorización de código
  - `test:` agregar tests

- **Sesiones:** Documentar en `/docs/prompts/session-XXX-descripcion.md`

---

## 📄 Licencia

[Definir licencia]

---

## 📞 Contacto

**Repositorio:** [github.com/HJCUERVOCHIC/pwa-import-marketplace](https://github.com/HJCUERVOCHIC/pwa-import-marketplace)

---

## 🙏 Agradecimientos

Desarrollado con la asistencia de **Claude (Anthropic)** para la arquitectura, implementación y documentación del proyecto.

---

**Estado del Proyecto:** 🟢 Activo - En Desarrollo  
**Última Actualización:** 2025-11-03  
**Próxima Prioridad:** Módulo 03 - Autenticación de Administradores
