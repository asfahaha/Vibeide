/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Bauhaus Design System
        canvas: '#FAFAFA',
        surface: '#FFFFFF',
        border: '#E0E0E0',

        // Functional Colors
        primary: {
          DEFAULT: '#0066CC',
          hover: '#0052A3',
          light: 'rgba(0, 102, 204, 0.05)',
          medium: 'rgba(0, 102, 204, 0.10)',
        },
        accent: {
          DEFAULT: '#FF6B35',
          hover: '#E55A2B',
        },
        success: '#00A86B',
        error: '#DC143C',

        // Typography Colors
        text: {
          DEFAULT: '#1A1A1A',
          secondary: '#666666',
          tertiary: '#999999',
          inverse: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'elevation-2': '0 4px 12px rgba(0, 0, 0, 0.10)',
        'elevation-3': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'lg': '8px',
      },
      fontSize: {
        'xs': ['11px', '16px'],
        'sm': ['13px', '20px'],
        'base': ['15px', '24px'],
        'lg': ['17px', '28px'],
        'xl': ['20px', '28px'],
      },
    },
  },
  plugins: [],
}
