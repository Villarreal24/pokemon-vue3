/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        tiny: '0.5rem', // Tamaño de texto personalizado
      },
      backgroundColor: {
        blue: '#3490dc',
        green: '#38c172',
        black: '#000000',
        yellow: '#ffed4a',
        pink: '#FFFFFF',
        bola: '#FFFFFF'
      }
      // colors: {
      //   // blue: '#3490dc',
      //   green: '#38c172',
      //   black: '#000000',
      //   yellow: '#ffed4a',
      //   // ... otros colores
      // },
    },
  },
  plugins: [],
}

