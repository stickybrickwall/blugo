/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/pages/Login.tsx",
    "./src/pages/Signup.tsx",
    "./src/pages/Home.tsx",
    "./src/pages/Quiz.tsx",
    "./src/pages/Results.tsx"
  ],
  theme: {
    extend: {
    colors: {
      background: "#f5f8fc",
      primary: "#1f628e",
    },
    fontFamily: {
        nunito: ['"Nunito"', 'sans-serif', '"Quicksand"', '"Poppins"'],
    },
  },
  plugins: [],
}
}

