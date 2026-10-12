/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { paper: '#f6f4ed', ink: '#25291f', moss: '#78966c', sage: '#dfe8d6', sand: '#e9e3d5' },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    boxShadow: { soft: '0 8px 28px rgba(52, 58, 42, .08)' }
  }},
  plugins: []
}