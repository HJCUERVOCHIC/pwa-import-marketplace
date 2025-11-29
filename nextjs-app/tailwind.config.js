/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Solo para logo y precios
        brand: {
          primary: "#D4AF37",
          primaryDark: "#B8952A",
          primarySoft: "#F2E6C6",
        },
        // Azul Elegante - Botones principales y acciones
        blue: {
          elegant: "#1e40af",
          elegantDark: "#1e3a8a",
          elegantLight: "#dbeafe",
          accent: "#3b82f6",
        },
        // Midnight Blue - Dashboard y elementos destacados
        midnight: {
          primary: "#0f172a",
          secondary: "#1e3a8a",
          light: "#3b82f6",
          lighter: "#60a5fa",
        },
        // Neutrals
        neutrals: {
          ivory: "#F5F1E8",
          white: "#FFFFFF",
          black: "#1A1A1A",
          grayStrong: "#4A4A4A",
          graySoft: "#7A7A7A",
          grayBorder: "#D6D0C3",
          grayBg: "#F3F3F3",
        },
        // States
        state: {
          hover: "#1e3a8a",
          active: "#172554",
          disabledBg: "#E0E0E0",
          disabledFg: "#A5A5A5",
        },
        // Feedback
        feedback: {
          success: "#3FA27B",
          successLight: "#E8F5EF",
          warning: "#E6B800",
          error: "#C24747",
          errorSoft: "#B85C5C",
          info: "#4A90E2",
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'chic': '10px',
        'chic-sm': '8px',
      },
      boxShadow: {
        'chic-sm': '0 1px 2px rgba(0, 0, 0, 0.06)',
        'chic-md': '0 6px 16px rgba(0, 0, 0, 0.08)',
        'chic-lg': '0 12px 30px rgba(0, 0, 0, 0.12)',
        'gold': '0 4px 14px rgba(212, 175, 55, 0.25)',
        'blue': '0 4px 12px rgba(30, 64, 175, 0.25)',
        'midnight': '0 10px 40px rgba(15, 23, 42, 0.5)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #B8952A 100%)',
        'gradient-gold-soft': 'linear-gradient(135deg, #F2E6C6 0%, #FFFFFF 100%)',
        'gradient-blue': 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        'gradient-midnight': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        'gradient-midnight-card': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      },
    },
  },
  plugins: [],
}