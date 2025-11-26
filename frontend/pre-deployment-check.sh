#!/bin/bash
# ============================================
# PRE-DEPLOYMENT CHECK SCRIPT
# Chic Import USA - Session 012
# ============================================

echo "🔍 VERIFICACIÓN PRE-DEPLOYMENT"
echo "================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0

# Función para imprimir con color
print_status() {
    if [ "$1" == "ERROR" ]; then
        echo -e "${RED}❌ $2${NC}"
        ((ERRORS++))
    elif [ "$1" == "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ $2${NC}"
    fi
}

echo "📦 1. VERIFICANDO DEPENDENCIAS"
echo "--------------------------------"

# Verificar node_modules
if [ -d "node_modules" ]; then
    print_status "OK" "node_modules existe"
else
    print_status "ERROR" "node_modules no encontrado. Ejecuta: npm install"
fi

# Verificar react-helmet-async
if [ -d "node_modules/react-helmet-async" ]; then
    print_status "OK" "react-helmet-async instalado"
else
    print_status "ERROR" "react-helmet-async no instalado. Ejecuta: npm install react-helmet-async"
fi

echo ""
echo "📄 2. VERIFICANDO ARCHIVOS REQUERIDOS"
echo "---------------------------------------"

# Verificar archivos críticos
FILES=(
    "package.json"
    "vite.config.js"
    "src/App.jsx"
    "src/pages/CatalogoProductoPage.jsx"
    "src/config/app.config.js"
    "src/services/whatsappService.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "OK" "$file existe"
    else
        print_status "ERROR" "$file no encontrado"
    fi
done

# Verificar vercel.json (opcional pero recomendado)
if [ -f "vercel.json" ]; then
    print_status "OK" "vercel.json configurado"
else
    print_status "WARNING" "vercel.json no encontrado (opcional)"
fi

echo ""
echo "🔐 3. VERIFICANDO VARIABLES DE ENTORNO"
echo "----------------------------------------"

# Verificar .env
if [ -f ".env" ]; then
    print_status "OK" ".env existe"
    
    # Verificar variables críticas
    if grep -q "VITE_PUBLIC_URL" .env; then
        URL=$(grep "VITE_PUBLIC_URL" .env | cut -d '=' -f2)
        if [[ "$URL" == *"localhost"* ]]; then
            print_status "WARNING" "VITE_PUBLIC_URL apunta a localhost. Actualiza después del deploy."
        elif [[ "$URL" == *"vercel.app"* ]] || [[ "$URL" == *"chicimportusa.com"* ]]; then
            print_status "OK" "VITE_PUBLIC_URL configurado para producción"
        else
            print_status "WARNING" "VITE_PUBLIC_URL tiene valor inusual: $URL"
        fi
    else
        print_status "ERROR" "VITE_PUBLIC_URL no encontrado en .env"
    fi
    
    if grep -q "VITE_SUPABASE_URL" .env; then
        print_status "OK" "VITE_SUPABASE_URL configurado"
    else
        print_status "ERROR" "VITE_SUPABASE_URL no encontrado en .env"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        print_status "OK" "VITE_SUPABASE_ANON_KEY configurado"
    else
        print_status "ERROR" "VITE_SUPABASE_ANON_KEY no encontrado en .env"
    fi
else
    print_status "ERROR" ".env no encontrado. Crea uno basado en .env.example"
fi

echo ""
echo "🔨 4. VERIFICANDO BUILD"
echo "------------------------"

# Intentar build
echo "Ejecutando: npm run build"
if npm run build > /dev/null 2>&1; then
    print_status "OK" "Build exitoso"
    
    # Verificar dist
    if [ -d "dist" ]; then
        print_status "OK" "Carpeta dist generada"
    else
        print_status "ERROR" "Carpeta dist no generada"
    fi
else
    print_status "ERROR" "Build falló. Revisa los errores con: npm run build"
fi

echo ""
echo "🔍 5. VERIFICANDO CONTENIDO DE ARCHIVOS"
echo "-----------------------------------------"

# Verificar que App.jsx tenga HelmetProvider
if grep -q "HelmetProvider" src/App.jsx; then
    print_status "OK" "App.jsx incluye HelmetProvider"
else
    print_status "ERROR" "App.jsx no incluye HelmetProvider"
fi

# Verificar que CatalogoProductoPage tenga Helmet
if grep -q "from 'react-helmet-async'" src/pages/CatalogoProductoPage.jsx; then
    print_status "OK" "CatalogoProductoPage.jsx importa Helmet"
else
    print_status "ERROR" "CatalogoProductoPage.jsx no importa Helmet"
fi

# Verificar meta tags OG
if grep -q "og:title" src/pages/CatalogoProductoPage.jsx; then
    print_status "OK" "Meta tags Open Graph incluidos"
else
    print_status "ERROR" "Meta tags Open Graph no encontrados"
fi

echo ""
echo "🔧 6. VERIFICANDO GIT"
echo "----------------------"

# Verificar git
if [ -d ".git" ]; then
    print_status "OK" "Repositorio git inicializado"
    
    # Verificar cambios sin commit
    if [ -n "$(git status --porcelain)" ]; then
        print_status "WARNING" "Hay cambios sin commit. Recuerda hacer commit antes del deploy."
    else
        print_status "OK" "Todos los cambios están committeados"
    fi
else
    print_status "WARNING" "Git no inicializado. Ejecuta: git init"
fi

# Verificar .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore && grep -q "dist" .gitignore; then
        print_status "OK" ".gitignore configurado correctamente"
    else
        print_status "WARNING" ".gitignore incompleto (debe incluir .env y dist)"
    fi
else
    print_status "WARNING" ".gitignore no encontrado"
fi

echo ""
echo "================================"
echo "📊 RESUMEN"
echo "================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ¡LISTO PARA DEPLOY!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. git add ."
    echo "2. git commit -m 'Session 012: Open Graph meta tags'"
    echo "3. git push"
    echo "4. Deploy en Vercel (ver VERCEL_DEPLOYMENT_GUIDE.md)"
else
    echo -e "${RED}❌ HAY $ERRORS ERRORES QUE CORREGIR${NC}"
    echo ""
    echo "Por favor, corrige los errores antes de deployar."
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Hay $WARNINGS advertencias (opcionales)${NC}"
fi

echo ""
echo "================================"

exit $ERRORS
