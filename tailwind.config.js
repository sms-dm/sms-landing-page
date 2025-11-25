/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sms: {
          neonBlue: '#00D9FF',
          electricBlue: '#0096FF',
          darkBlue: '#001E3C',
          deepBlue: '#0A1929',
          lightGray: '#E3E8EF',
          mediumGray: '#8892A6'
        }
      },
      fontFamily: {
        'tech': ['Orbitron', 'sans-serif'],
        'sans': ['Inter', 'sans-serif']
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 1s ease-out',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'particle-flow': 'particle-flow 20s linear infinite',
        'data-pulse': 'data-pulse 2s ease-in-out infinite',
        'spin-slow': 'spin 10s linear infinite'
      },
      keyframes: {
        'matrix-rain': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'glow': {
          '0%': { textShadow: '0 0 5px #00D9FF, 0 0 10px #00D9FF, 0 0 15px #00D9FF' },
          '100%': { textShadow: '0 0 10px #00D9FF, 0 0 20px #00D9FF, 0 0 30px #00D9FF' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'particle-flow': {
          '0%': { transform: 'translateX(-100%) translateY(0)' },
          '100%': { transform: 'translateX(100%) translateY(-100%)' }
        },
        'data-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      backgroundImage: {
        'matrix-gradient': 'linear-gradient(to bottom, #0d0208, #1a1a1a)',
        'radial-glow': 'radial-gradient(circle at center, #00ff4120 0%, transparent 70%)'
      }
    },
  },
  plugins: [],
}