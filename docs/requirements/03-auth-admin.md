# Módulo 03: Autenticación de Administradores (Login / Roles)

## Descripción General
Este módulo gestiona el acceso seguro al **panel administrativo** de la aplicación PWA Import Marketplace.  
Permite que únicamente los **usuarios autorizados** (administradores) ingresen mediante **correo electrónico y contraseña** registrados en **Supabase Auth**.  
El sistema implementa control de sesión mediante **tokens JWT**, mantiene roles y protege todas las rutas del entorno `/admin`.

---

## Actores
- **Superadministrador (superadmin):**  
  Usuario con control total del sistema.  
  Puede crear, activar o desactivar otros administradores, y definir roles.  
- **Administrador (admin_full):**  
  Usuario operativo con permisos para gestionar listas y productos.  
  No puede crear ni modificar cuentas de otros usuarios.

---

## Reglas de Negocio
1. Todos los accesos se autentican mediante **Supabase Auth**.  
2. El inicio de sesión requiere un **email verificado** y una **contraseña válida**.  
3. Los **roles y estados (activo/inactivo)** se definen en la tabla `administradores` del backend (sin registro público).  
4. Solo los usuarios con `activo = true` pueden iniciar sesión.  
5. Cada sesión genera un **token JWT** con vigencia máxima de **24 horas**.  
6. El **token** se almacena localmente (`localStorage`) y se usa para autorizar todas las peticiones privadas.  
7. Al expirar el token, el usuario debe volver a iniciar sesión.  
8. El cierre de sesión borra completamente el token y datos del usuario local.  
9. Las rutas que inician con `/admin/...` deben estar protegidas mediante verificación del token.  
10. No existe flujo de “registrar cuenta” o “recuperar contraseña” dentro de la aplicación (esto se gestiona en Supabase directamente o por el superadmin).  
11. Los accesos y eventos importantes deben registrarse (login, logout, intentos fallidos, bloqueo de cuenta).  

---

## Flujo Principal

1. El usuario accede a la ruta `/admin/login`.  
2. Se muestra formulario con:
   - Campo **Email**  
   - Campo **Contraseña**
3. Al enviar el formulario:
   - Se ejecuta `supabase.auth.signInWithPassword({ email, password })`
4. Si las credenciales son válidas:
   - Supabase devuelve el token de sesión JWT y datos del usuario.
   - Se guarda el token y el rol (`superadmin` o `admin_full`) en `localStorage`.
   - Se actualiza `last_login_at` en la base de datos.
   - El usuario es redirigido a `/admin/dashboard`.
5. Si las credenciales son inválidas:
   - Se muestra mensaje: “Correo o contraseña incorrectos”.
6. Si la cuenta está inactiva:
   - Se muestra mensaje: “Tu cuenta ha sido desactivada, contacta al administrador”.
7. Si el token expira:
   - El sistema redirige automáticamente a `/admin/login`.

---

## Flujos Alternativos / Excepciones

- **Error de red o Supabase Auth inaccesible:**  
  → Mostrar mensaje: “No se pudo conectar al servicio de autenticación, intenta nuevamente.”

- **Intentos consecutivos de login fallidos (más de 5):**  
  → Bloquear temporalmente la cuenta por seguridad durante 10 minutos.

- **Token manipulado o inválido:**  
  → El sistema elimina el token local y redirige a `/admin/login`.

- **Intento de acceso a ruta privada sin token:**  
  → Redirigir automáticamente a `/admin/login`.

- **Superadmin desactiva cuenta mientras está logueado:**  
  → La sesión activa debe invalidarse al siguiente request protegido.

---

## Validaciones Requeridas
- Email: formato válido (`usuario@dominio.com`).  
- Contraseña: mínimo 8 caracteres.  
- Ambos campos obligatorios.  
- Mostrar retroalimentación visual durante la autenticación (cargando, error, éxito).  
- Bloqueo de login tras varios intentos fallidos (seguridad).  

---

## Datos a Capturar / Almacenar

| Campo | Tipo | Obligatorio | Descripción / Restricciones |
|--------|------|-------------|-----------------------------|
| `id_admin` | UUID | ✅ | Identificador único (asignado por Supabase) |
| `email` | string | ✅ | Email de acceso |
| `password_hash` | string | ✅ | Hash gestionado por Supabase Auth |
| `nombre` | string | ✅ | Nombre visible del administrador |
| `role` | enum | ✅ | `superadmin` o `admin_full` |
| `activo` | boolean | ✅ | Define si la cuenta puede acceder |
| `last_login_at` | timestamp | automático | Actualizado en login exitoso |
| `created_at` | timestamp | automático | Fecha de creación |
| `updated_at` | timestamp | automático | Última modificación |
| `intentos_fallidos` | integer | automático | Se incrementa con cada fallo |
| `bloqueado_hasta` | timestamp | opcional | Fecha/hora de desbloqueo si se bloquea la cuenta |

---

## Cálculos / Lógica Interna

### 1. Control de bloqueo de cuenta
```
if intentos_fallidos >= 5:
    bloqueado_hasta = now() + 10 minutos
    mostrar("Tu cuenta ha sido bloqueada temporalmente.")
```

### 2. Validación de cuenta activa
```
if activo == false:
    mostrar("Tu cuenta ha sido desactivada, contacta al administrador.")
```

### 3. Token expirado
```
if token_expirado():
    limpiar_token_local()
    redirigir("/admin/login")
```

### 4. Logout manual
```
supabase.auth.signOut()
limpiar_token_local()
redirigir("/admin/login")
```

---

## Casos de Uso Ejemplo

### **Escenario 1: Login exitoso**
1. El admin `laura@importusa.com` accede a `/admin/login`.
2. Ingresa su email y contraseña correctos.
3. Supabase Auth valida y devuelve:
   ```json
   {
     "user": {
       "id": "uuid123",
       "email": "laura@importusa.com",
       "role": "admin_full"
     },
     "session": {
       "access_token": "jwt_token_here",
       "expires_in": 86400
     }
   }
   ```
4. El sistema guarda el token, redirige al dashboard y registra `last_login_at`.

---

### **Escenario 2: Cuenta inactiva**
1. El usuario `carlos@importusa.com` intenta acceder.
2. Supabase valida credenciales pero el campo `activo=false`.
3. Se muestra mensaje: “Tu cuenta ha sido desactivada, contacta al administrador.”

---

### **Escenario 3: Token expirado**
1. El usuario deja la sesión abierta 24 horas.
2. Al intentar acceder a `/admin/listas`, el sistema detecta token vencido.
3. El token se borra y se redirige automáticamente a `/admin/login`.

---

## Criterios de Aceptación
- [ ] El acceso al panel `/admin` está protegido por autenticación Supabase.  
- [ ] Solo usuarios con `activo=true` pueden iniciar sesión.  
- [ ] Roles `superadmin` y `admin_full` determinan permisos dentro del panel.  
- [ ] Tokens JWT expiran en 24 horas y fuerzan logout al vencerse.  
- [ ] Intentos fallidos repetidos bloquean temporalmente la cuenta.  
- [ ] El sistema registra `last_login_at` en cada inicio de sesión exitoso.  
- [ ] El logout limpia completamente los datos locales.  
- [ ] Accesos inválidos o sin token redirigen a `/admin/login`.  
- [ ] Se registra auditoría básica de accesos (login, logout, errores).  
