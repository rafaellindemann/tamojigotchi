module.exports = {
    // outras configurações...
    plugins: [
      // outros plugins...
      require('@tailwindcss/forms'),
    ],
    theme: {
      extend: {
        animation: {
          'fade': 'fadeIn 0.5s ease-in-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
        },
      },
    },
  }