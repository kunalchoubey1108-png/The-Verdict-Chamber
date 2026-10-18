import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Brutalist Cyberpunk / Neo-Industrial Palette
        raw: {
          bg: "#090A0D",
          surface: "#111318",
          card: "#181B22",
          border: "#262A34",
          light: "#EFEFEB",
          dim: "#8E93A0",
        },
        // Accent Colors from the Reference Stickers
        cb: {
          orange: "#E28743",    // CBRPNK amber/orange
          amber: "#F2A900",     // Yellow/Amber alert
          green: "#5B8E69",     // DPM SYSTM sage military green
          red: "#D64038",       // Warning crimson / 02
          blue: "#3370FF",      // Gridline cyan/blue
        },
        carbon: "#181B22",
        onyx: "#111318",
        graphite: "#262A34",
        bone: "#EFEFEB",
        // Existing mappings mapped to high-impact brutalist tones
        bg: "#090A0D",
        surface: "#111318",
        "surface-2": "#181B22",
        ink: "#FFFFFF",
        "ink-2": "#EFEFEB",
        "ink-muted": "#8E93A0",
        hairline: "#262A34",
        grid: "#262A34",
        accent: "#E28743",
        good: "#5B8E69",
        warn: "#F2A900",
        serious: "#E28743",
        critical: "#D64038",
      },
      fontFamily: {
        display: ["var(--font-bebas)", "'Bebas Neue'", "Impact", "sans-serif"],
        headline: ["var(--font-syne)", "'Syne'", "'Space Grotesk'", "sans-serif"],
        tech: ["var(--font-space)", "'Space Grotesk'", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "'JetBrains Mono'", "monospace"],
        sans: ["var(--font-inter)", "'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        sm: "3px",
        md: "6px",
        card: "18px", // Curved corner label style from image 1
        tag: "24px",
        pill: "9999px",
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #000000",
        "brutal-orange": "4px 4px 0px 0px #E28743",
        "brutal-white": "4px 4px 0px 0px #FFFFFF",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "ticker": "ticker 18s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
