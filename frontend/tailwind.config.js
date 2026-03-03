/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          500: '#10b981',
          600: '#059669',
        },
        /* Student Connect onboarding */
        connect: {
          purple: '#6B4EE0',
          'purple-light': '#F5F3FF',
          'text': '#333333',
          'text-muted': '#666666',
          'text-light': '#999999',
          border: '#E5E7EB',
          'border-light': '#EEEEEE',
        }
      }
    },
  },
  plugins: [],
}
