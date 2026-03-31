/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f4fc',
          100: '#d0e8f7',
          500: '#2D8BC4',
          600: '#256B9A',
          700: '#1e5a82',
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
