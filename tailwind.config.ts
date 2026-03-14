import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bbdbff",
          300: "#8bc4ff",
          400: "#54a3ff",
          500: "#2a7fff",
          600: "#125fea",
          700: "#104bcc",
          800: "#143fa5",
          900: "#173883"
        }
      }
    }
  },
  plugins: []
}

export default config
