/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Maritime Brand Colors
        'brand-teal-deep': '#024645',
        'brand-teal-medium': '#038F8D',
        'brand-cyan': '#49D7D1',
        'brand-purple': '#8965F5',
        'brand-bg-light': '#f2f7f7',
        'brand-slate-light': '#9AC0C3',
        
        // Semantic Colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        'display': '"Outfit", "Inter", ui-sans-serif, system-ui, sans-serif',
        'sans': '"Inter", ui-sans-serif, system-ui, sans-serif',
        'mono': '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '40px', fontWeight: '900' }],
        'h2': ['28px', { lineHeight: '36px', fontWeight: '900' }],
        'h3': ['24px', { lineHeight: '32px', fontWeight: '900' }],
        'h4': ['20px', { lineHeight: '28px', fontWeight: '900' }],
        'h5': ['18px', { lineHeight: '26px', fontWeight: '700' }],
        'body1': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body2': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body3': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'label1': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'label2': ['12px', { lineHeight: '18px', fontWeight: '600' }],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s infinite ease-in-out',
        'fade-in': 'fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.99)' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          'from': { transform: 'translateY(100%)' },
          'to': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

