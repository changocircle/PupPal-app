/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // === PupPal Design System Colors ===
      colors: {
        primary: {
          DEFAULT: "#FF6B5C",
          dark: "#E8554A",
          light: "#FFF0EE",
          extralight: "#FFF8F7",
        },
        secondary: {
          DEFAULT: "#1B2333",
          light: "#2D3A4A",
          lighter: "#6B7280",
        },
        accent: {
          DEFAULT: "#FFB547",
          dark: "#F5A623",
          light: "#FFF6E5",
        },
        success: {
          DEFAULT: "#5CB882",
          light: "#E8F5EE",
        },
        warning: {
          DEFAULT: "#F5A623",
          light: "#FFF6E5",
        },
        error: {
          DEFAULT: "#EF6461",
          light: "#FDEDED",
        },
        info: {
          DEFAULT: "#5B9BD5",
          light: "#EBF3FA",
        },
        background: "#FFFAF7",
        surface: "#FFFFFF",
        border: "#F0EBE6",
        text: {
          primary: "#1B2333",
          secondary: "#6B7280",
          tertiary: "#9CA3AF",
          inverse: "#FFFFFF",
        },
        disabled: "#D1D5DB",
      },

      // === Typography ===
      fontFamily: {
        "brand-regular": ["PlusJakartaSans_400Regular"],
        "brand-medium": ["PlusJakartaSans_500Medium"],
        "brand-semibold": ["PlusJakartaSans_600SemiBold"],
        "brand-bold": ["PlusJakartaSans_700Bold"],
        "brand-extrabold": ["PlusJakartaSans_800ExtraBold"],
      },

      fontSize: {
        // Display: 36px / ExtraBold / lh:40px
        display: ["36px", { lineHeight: "40px" }],
        // H1: 30px / Bold / lh:36px
        h1: ["30px", { lineHeight: "36px" }],
        // H2: 24px / Bold / lh:30px
        h2: ["24px", { lineHeight: "30px" }],
        // H3: 20px / SemiBold / lh:26px
        h3: ["20px", { lineHeight: "26px" }],
        // Body large: 18px / Regular / lh:26px
        "body-lg": ["18px", { lineHeight: "26px" }],
        // Body: 16px / Regular / lh:24px
        body: ["16px", { lineHeight: "24px" }],
        // Body small: 14px / Regular / lh:20px
        "body-sm": ["14px", { lineHeight: "20px" }],
        // Caption: 12px / Medium / lh:16px
        caption: ["12px", { lineHeight: "16px" }],
        // Overline: 11px / SemiBold / lh:14px (uppercase, +1 tracking)
        overline: ["11px", { lineHeight: "14px", letterSpacing: "1px" }],
      },

      // === Spacing ===
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        base: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "40px",
        "4xl": "48px",
        "5xl": "64px",
      },

      // === Border Radius ===
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },

      // === Shadows (warm-toned) ===
      boxShadow: {
        card: "0px 2px 8px rgba(27, 35, 51, 0.06)",
        elevated: "0px 4px 16px rgba(27, 35, 51, 0.10)",
        modal: "0px 8px 32px rgba(27, 35, 51, 0.16)",
      },
    },
  },
  plugins: [],
};
