import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", // Reverted to system background
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#166534", // RESTORED: Deep Green (Safe/Growth)
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D97706", // Amber/Gold for accents
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#ECFDF5", // Light Green background
          foreground: "#065F46",
        },
        // Custom semantic colors
        earth: "#5D4037",
        gold: "#F59E0B",
        leaf: "#4ADE80",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Custom animations
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            opacity: "1", 
            boxShadow: "0 0 0 0px rgba(22, 101, 52, 0.7)" // Green glow
          },
          "50%": { 
            opacity: "0.9", 
            boxShadow: "0 0 0 10px rgba(22, 101, 52, 0)" 
          },
        },
        grow: {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "grow": "grow 2s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;