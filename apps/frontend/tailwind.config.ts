const config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#fffdf8",
          100: "#f8f3ec",
          200: "#efe3d3",
          300: "#e5d1bc",
          400: "#c7a98d",
          500: "#a98263",
          600: "#8c6346",
          700: "#69472f",
          800: "#4b321f",
          900: "#2f1e13",
        },
        coral: {
          50: "#fff2ed",
          100: "#ffe2d7",
          200: "#ffcab5",
          300: "#ffa581",
          400: "#ff8a65",
          500: "#ff6d4b",
          600: "#e85b3d",
          700: "#bf452f",
          800: "#943527",
          900: "#5f241e",
        },
        indigo: {
          50: "#f3f0ff",
          100: "#e6dcff",
          200: "#d1beff",
          300: "#b293ff",
          400: "#956fff",
          500: "#7c5cff",
          600: "#6340f0",
          700: "#4f31c6",
          800: "#402996",
          900: "#2e1c66",
        },
        teal: {
          50: "#effdfa",
          100: "#d8f8f3",
          200: "#b2efe7",
          300: "#7fe0d5",
          400: "#48c6b5",
          500: "#27ad9a",
          600: "#1f8d80",
          700: "#1d7068",
          800: "#1b5955",
          900: "#174847",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: [
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "44px" }],
        "5xl": ["48px", { lineHeight: "52px" }],
        "6xl": ["56px", { lineHeight: "60px" }],
        "7xl": ["64px", { lineHeight: "68px" }],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        black: "900",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
        "soft-lg": "0 20px 40px rgba(15, 23, 42, 0.1)",
        "soft-xl": "0 25px 50px rgba(15, 23, 42, 0.12)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      animation: {
        blob: "blob 14s infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
      keyframes: {
        blob: {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
          },
          "25%": {
            transform: "translate(20px, -50px) scale(1.1)",
          },
          "50%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "75%": {
            transform: "translate(50px, 50px) scale(1.05)",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "0.85",
          },
          "50%": {
            opacity: "1",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1200px 0" },
          "100%": { backgroundPosition: "1200px 0" },
        },
      },
      transitionDuration: {
        "200": "200ms",
        "300": "300ms",
        "500": "500ms",
        "700": "700ms",
      },
    },
  },
  plugins: [],
};

export default config;
