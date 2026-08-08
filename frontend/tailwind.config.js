/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8fafc",
          100: "#eef2ff",
          900: "#0f172a",
        },
      },
      boxShadow: {
        soft: "0 18px 60px -28px rgba(15, 23, 42, 0.25)",
      },
    },
  },
  plugins: [],
};
