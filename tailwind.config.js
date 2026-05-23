/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#3525cd",
        "primary-container": "#4f46e5",
        "on-primary": "#ffffff",
        "secondary": "#006591",
        "secondary-container": "#39b8fd",
        "on-secondary": "#ffffff",
        "background": "#f8f9ff",
        "on-background": "#0b1c30",
        "surface": "#f8f9ff",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#464555",
        "surface-container": "#e5eeff",
        "surface-container-low": "#eff4ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "outline-variant": "#c7c4d8",
        "outline": "#777587",
        "tertiary": "#7e3000",
        "tertiary-container": "#a44100",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "24px",
        "margin-desktop": "40px",
        "container-max": "1280px",
        "unit": "8px",
        "margin-mobile": "16px"
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ]
}
