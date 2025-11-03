# Changelog

Todos los cambios notables del proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.2.0] - 2025-11-03

### 🔒 Seguridad (Sesión 007 - En Progreso)

#### Agregado
- Sistema de protección completa de rutas con ProtectedRoute
- Información de usuario en header del Layout (nombre, rol, logout)
- Navegación entre Dashboard y Listas en header
- Campo `creado_por` en creación de listas (auditoría)
- Sistema de auto-recuperación en AuthContext
- Versionado automático de localStorage
- Manejo robusto de errores en AuthContext
- Logs mejorados con emojis para debugging
- Validación de sesión activa antes de operaciones
- Documentación exhaustiva de seguridad (75 KB)
- Scripts SQL de habilitación y verificación de RLS

#### Cambiado
- App.jsx: Todas las rutas ahora requieren autenticación
- Layout.jsx: Nuevo diseño con información de usuario
- AuthContext.tsx: Mejorado con 8 protecciones críticas
- ModalCrearLista.jsx: Agrega campo creado_por automáticamente
- Estructura de rutas: / redirige a /admin/dashboard

#### Arreglado
- Loop infinito de "Verificando sesión..." resuelto
- Manejo de datos corruptos en localStorage
- Exports de TypeScript en proyecto JSX
- Logout ahora siempre funciona incluso con errores
- Inicialización garantizada del AuthContext

#### Pendiente
- Habilitar RLS en todas las tablas (SQL listo)
- Campo `publicado_por` en productos
- Proteger Storage con políticas RLS
- Realizar 12+ pruebas de seguridad

---

## [0.1.0] - 2025-10-30

### ✨ Funcionalidades Base (Sesiones 002-006)

#### Módulo 01: Gestión de Productos y Cálculo de Precios (Sesiones 002-005)

**Agregado:**
- Modelo de datos completo en Supabase
  - Tabla `listas_oferta` con 8 columnas + metadata
  - Tabla `productos` con 20 columnas + metadata
- Triggers automáticos en PostgreSQL
  - `trigger_calcular_valores_producto`: Cálculos automáticos
  - `trigger_congelar_snapshot`: Snapshot al publicar
  - `trigger_recalcular_productos`: Recálculo selectivo
- Frontend completo con React 18 + Vite + Tailwind
- Visualización de listas en grid responsivo
- Formulario completo de creación de listas
  - Campo TRM (tasa de cambio)
  - Selector visual TAX (Porcentaje vs Valor Fijo USD)
  - Validaciones en tiempo real
- Editor completo de productos con dos columnas
  - Información básica del producto
  - Calculadora de precios en tiempo real
- Sistema de upload de imágenes a Supabase Storage
  - Múltiples imágenes por producto
  - Preview antes de guardar
  - Captura desde cámara (móvil)
- Modo manual/automático para precio final
- Redondeo automático a miles (no decenas)
- Formato de moneda colombiana (COP)
- Validaciones completas (cliente y BD)

**Decisiones Técnicas:**
- TRM y TAX a nivel de Lista (no por producto)
- Redondeo a miles para precios
- Triggers en PostgreSQL para garantizar cálculos
- Supabase Storage para imágenes (no Base64)
- Snapshot congelado al publicar producto

---

#### Módulo 03: Autenticación de Administradores (Sesión 006)

**Agregado:**
- Sistema completo de autenticación con Supabase Auth
- Tabla `administradores` con roles (superadmin, admin_full)
- Tabla `auth_logs` para auditoría de accesos
- Componentes de autenticación:
  - LoginPage con formulario y validación
  - LoginForm con React Hook Form + Zod
  - ProtectedRoute (HOC para proteger rutas)
  - LogoutButton con 3 variantes visuales
  - AuthContext para gestión global de sesión
- DashboardPage funcional
- Control de roles por usuario
- Bloqueo temporal tras 5 intentos fallidos (10 min)
- Registro completo de eventos en auth_logs:
  - login_success, login_failed
  - logout, account_blocked
  - password_reset
- Tokens JWT con expiración de 24h
- Auto-refresh de tokens
- Funciones SQL:
  - handle_successful_login()
  - handle_failed_login()
  - check_admin_can_login()
  - handle_logout()
- Políticas RLS básicas para tabla administradores

**Decisiones Técnicas:**
- Cliente Supabase único consolidado
- TypeScript para módulo auth (convive con JSX)
- JWT con persistencia en localStorage
- Gestión de sesión mediante Context API

---

### 🐛 Problemas Resueltos

#### Sesión 003:
- Error con Tailwind v4 → Downgrade a v3.4.0
- RLS bloqueando acceso → Deshabilitado temporalmente

#### Sesión 005:
- Order of Hooks en React → Hooks antes de returns
- Precio final no se inicializaba → Mover setState al final
- Labels confusos en botones de imagen

#### Sesión 006:
- Múltiples instancias de Supabase → Consolidación
- Políticas RLS muy restrictivas → Simplificadas para dev

#### Sesión 007:
- Loop infinito "Verificando sesión..." → Auto-recuperación
- Exports de TypeScript → Agregar export default
- localStorage corrupto → Versionado automático

---

### 📚 Documentación

**Agregado:**
- PROJECT_CONTEXT.md (contexto completo del proyecto)
- CURRENT_STATUS.md (estado actualizado)
- START_HERE.md (guía para Claude)
- docs/requirements/ (requerimientos de negocio)
- docs/architecture/ (arquitectura técnica)
- docs/prompts/ (historial de sesiones)
- README.md actualizado

**Sesiones documentadas:**
- Sesión 002: Diseño del modelo de datos
- Sesión 003: Setup inicial del frontend
- Sesión 004: Formulario de listas
- Sesión 005: Editor de productos
- Sesión 006: Módulo de autenticación
- Sesión 007: Implementación de seguridad (en curso)

---

### 🎯 Roadmap

#### Corto Plazo (próximas sesiones)
- [ ] Completar seguridad (RLS + Storage)
- [ ] Edición de productos existentes
- [ ] Edición de listas existentes
- [ ] Cambio de estado de productos/listas
- [ ] Eliminación (soft delete)

#### Medio Plazo (2-3 semanas)
- [ ] Vista pública del catálogo
- [ ] Búsqueda y filtros
- [ ] Detalle de producto
- [ ] Compartir en redes sociales
- [ ] PWA features (offline, manifest)

#### Largo Plazo (1-3 meses)
- [ ] Sistema de favoritos
- [ ] Analytics de visitas
- [ ] Notificaciones push
- [ ] Pasarela de pagos
- [ ] Integración WhatsApp Business

---

### 📊 Métricas Actuales

**Código:**
- Líneas de código (frontend): ~4,500
- Líneas de código (auth): ~1,200
- Componentes React: 12+
- Hooks personalizados: 5+

**Base de Datos:**
- Tablas: 4
- Triggers: 4
- Funciones SQL: 4
- Políticas RLS: 6+
- Constraints: 12
- Índices: 10

**Funcionalidades:**
- Completadas: 25+
- En progreso: 4
- Pendientes: 15+

**Seguridad:**
- Rutas protegidas: 3/3 (100%)
- RLS habilitado: 1/4 (25%)
- Campos de auditoría: 1/2 (50%)
- Autenticación: Completa

---

## [Sin versión] - Inicio del Proyecto

### Primera sesión
- Definición de alcance del proyecto
- Selección de stack tecnológico
- Configuración inicial de repositorio

---

## Tipos de Cambios

- **Agregado** - Para funcionalidades nuevas
- **Cambiado** - Para cambios en funcionalidades existentes
- **Deprecado** - Para funcionalidades que se eliminarán pronto
- **Eliminado** - Para funcionalidades eliminadas
- **Arreglado** - Para corrección de bugs
- **Seguridad** - Para vulnerabilidades corregidas

---

## Versionado

El proyecto sigue [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nueva funcionalidad compatible hacia atrás
- **PATCH** (0.0.X): Correcciones de bugs compatibles hacia atrás

**Estado actual: 0.2.0** (Pre-release)
- 0.x.x = Desarrollo activo
- 1.0.0 = Primera versión estable para producción

---

*Última actualización: 2025-11-03*
