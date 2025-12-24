export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          surface: 'var(--color-surface)',
        }
      }
    },
  },
}