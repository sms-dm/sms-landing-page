/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sms-blue': '#003366',
        'sms-light-blue': '#E6F2FF',
        'sms-cyan': '#00CED1',
        'sms-dark': '#1a1a2e',
        'sms-gray': '#2d2d44',
        // Status colors for consistency
        'status-critical': '#ef4444', // red-500
        'status-warning': '#f59e0b',  // amber-500
        'status-good': '#10b981',     // emerald-500
        'status-info': '#3b82f6',     // blue-500
        // Severity colors
        'severity-critical': '#dc2626', // red-600
        'severity-high': '#f97316',     // orange-500
        'severity-medium': '#eab308',   // yellow-500
        'severity-low': '#3b82f6',      // blue-500
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

