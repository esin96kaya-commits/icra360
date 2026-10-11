import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#142B4A",
        teal: "#16A6A1",
        canvas: "#F4F7F9",
        ink: "#18212F",
        success: "#238A65",
        warning: "#E8A23A",
        danger: "#C94A4A",
      },
    },
  },
  plugins: [],
};

export default config;
