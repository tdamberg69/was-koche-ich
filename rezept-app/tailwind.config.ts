import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EFEAE0",
        ink: "#20241F",
        sage: {
          50: "#F1F4EE",
          100: "#DCE4D3",
          300: "#A9BC93",
          500: "#6E8455",
          700: "#4A5C39",
          900: "#2C3823",
        },
        ochre: {
          400: "#D4A73C",
          500: "#BC8C2A",
          600: "#96701F",
        },
        rust: "#A34B33",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
