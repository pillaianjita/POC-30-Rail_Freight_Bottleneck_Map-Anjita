/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Real Rails DNA palette — MANDATORY
        obsidian: '#030712',
        surface: '#0B1117',
        'surface-raised': '#111827',
        'slate-border': '#1F2937',
        'cyan-accent': '#38BDF8',
        'indigo-accent': '#818CF8',
        // Severity colors
        critical: '#EF4444',
        high: '#F97316',
        medium: '#EAB308',
        low: '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 0 0.5px #38BDF8, 0 0 8px rgba(56,189,248,0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};