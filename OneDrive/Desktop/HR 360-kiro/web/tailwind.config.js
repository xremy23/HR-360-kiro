/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          teal: '#038F8D',
          white: '#FFFFFF',
          black: '#000000',
        },
        // Secondary Colors
        secondary: {
          dark: '#024F45',
          medium: '#017473',
          light: '#9AC0C3',
        },
        // Semantic Colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        'display': '"Funnel Display", serif',
        'sans': '"Funnel Sans", "DM Sans", sans-serif',
      },
      fontSize: {
        'display1': ['48px', { lineHeight: '56px', fontWeight: '700' }],
        'display2': ['40px', { lineHeight: '48px', fontWeight: '700' }],
        'display3': ['32px', { lineHeight: '40px', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}
