/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ============================================
      // COLORES CHIC IMPORT USA
      // ============================================
      colors: {
        // Colores de marca
        brand: {
          primary: '#D4AF37',      // Gold
          secondary: '#2F6F4F',    // Emerald
          accent: '#8A1C1C',       // Bordeaux
        },
        // Gold (primario)
        gold: {
          50: '#FBF7EB',
          100: '#F3E8C7',
          200: '#E8D89F',
          300: '#DCC877',
          400: '#D4AF37',          // Base
          500: '#BD9A2F',          // Hover
          600: '#A88428',          // Active
          700: '#8A6B20',
          800: '#6D5419',
          900: '#503E12',
        },
        // Emerald (secundario)
        emerald: {
          50: '#EEF5F1',
          100: '#D4E8DC',
          200: '#A9D1B9',
          300: '#7FBA96',
          400: '#54A373',
          500: '#2F6F4F',          // Base
          600: '#285E44',          // Hover
          700: '#214C37',          // Active
          800: '#1A3B2B',
          900: '#132A1F',
        },
        // Bordeaux (acento)
        bordeaux: {
          50: '#F7EEEE',
          100: '#EDD5D5',
          200: '#DBABAB',
          300: '#C98181',
          400: '#B75757',
          500: '#8A1C1C',          // Base
          600: '#701616',          // Hover
          700: '#5A1212',          // Active
          800: '#440E0E',
          900: '#2E0909',
        },
        // Neutrales refinados
        neutral: {
          black: '#111111',
          charcoal: '#2B2B2B',
          slate: '#4A4A4A',
          stone: '#8A8A8A',
          sand: '#CBBFA5',
          border: '#E7E2D6',
          'border-strong': '#D6D0C3',
          gray: '#F7F7F7',
          white: '#FFFFFF',
          ivory: '#F7F3E8',
        },
        // Feedback colors
        success: '#2E7D32',
        warning: '#C28F2C',
        danger: '#B3261E',
        info: '#1E88E5',
      },
      
      // ============================================
      // TIPOGRAFÍA
      // ============================================
      fontFamily: {
        display: ['Playfair Display', 'Times New Roman', 'Times', 'serif'],
        body: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'Times New Roman', 'Times', 'serif'],
      },
      fontSize: {
        'h1': ['40px', { lineHeight: '48px', fontWeight: '600' }],
        'h2': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '32px', fontWeight: '600' }],
      },
      
      // ============================================
      // ESPACIADO PERSONALIZADO
      // ============================================
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
      },
      
      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        'xs': '6px',
        'sm': '10px',
        'md': '14px',
        'lg': '18px',
        'xl': '24px',
        'pill': '9999px',
      },
      
      // ============================================
      // SOMBRAS
      // ============================================
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.08)',
        'md': '0 6px 16px rgba(0, 0, 0, 0.10)',
        'lg': '0 12px 28px rgba(0, 0, 0, 0.12)',
        'gold': '0 6px 16px rgba(212, 175, 55, 0.15)',
        'emerald': '0 6px 16px rgba(47, 111, 79, 0.15)',
      },
      
      // ============================================
      // ANIMACIONES
      // ============================================
      transitionTimingFunction: {
        'elegant': 'cubic-bezier(0.2, 0.0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '120ms',
        'base': '180ms',
        'slow': '260ms',
      },
      
      // ============================================
      // BACKGROUNDS
      // ============================================
      backgroundColor: {
        'app': '#F7F3E8',        // ivory
        'card': '#FFFFFF',
        'elevated': '#FFFFFF',
        'muted': '#F7F7F7',
      },
      
      // ============================================
      // RING (FOCUS)
      // ============================================
      ringColor: {
        'focus': '#9CC9B3',
      },
      ringWidth: {
        'focus': '2px',
      },
      ringOffsetWidth: {
        'focus': '2px',
      },
    },
  },
  plugins: [],
}
