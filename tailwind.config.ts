import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Standard shadcn variables
        background: '#0f131b',
        foreground: '#dfe2ec',
        card: {
          DEFAULT: '#1c2027',
          foreground: '#dfe2ec',
        },
        popover: {
          DEFAULT: '#1c2027',
          foreground: '#dfe2ec',
        },
        primary: {
          DEFAULT: '#ffaaf7',
          foreground: '#5a005e',
        },
        secondary: {
          DEFAULT: '#aec6ff',
          foreground: '#002e6b',
        },
        muted: {
          DEFAULT: '#1c2027',
          foreground: '#d5c1cf',
        },
        accent: {
          DEFAULT: '#31353d',
          foreground: '#ffaaf7',
        },
        destructive: {
          DEFAULT: '#ffb4ab',
          foreground: '#690005',
        },
        border: '#31353d',
        input: '#31353d',
        ring: '#ffaaf7',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Midnight Sovereign custom theme colors
        "on-tertiary-fixed-variant": "#61307e",
        "on-error": "#690005",
        "on-secondary-fixed-variant": "#1d4588",
        "on-error-container": "#ffdad6",
        "surface-container-high": "#262a32",
        "inverse-surface": "#dfe2ec",
        "primary-container": "#8b2b8c",
        "on-primary": "#5a005e",
        "tertiary-fixed-dim": "#e6b4ff",
        "on-background": "#dfe2ec",
        "secondary-fixed-dim": "#aec6ff",
        "on-primary-container": "#ffb0f7",
        "surface-container-lowest": "#0a0e15",
        "on-secondary-fixed": "#001a42",
        "primary-fixed-dim": "#ffaaf7",
        "inverse-on-surface": "#2d3038",
        "inverse-primary": "#963596",
        "secondary-container": "#1d4588",
        "on-secondary-container": "#93b4ff",
        "surface-variant": "#31353d",
        "on-surface": "#dfe2ec",
        "surface-container-highest": "#31353d",
        "tertiary": "#e6b4ff",
        "tertiary-container": "#71408e",
        "primary-fixed": "#ffd6f7",
        "on-primary-fixed": "#37003a",
        "secondary-fixed": "#d8e2ff",
        "surface-container": "#1c2027",
        "on-tertiary-fixed": "#30004a",
        "error": "#ffb4ab",
        "on-secondary": "#002e6b",
        "surface-container-low": "#181c23",
        "outline-variant": "#51424e",
        "on-tertiary": "#491766",
        "outline": "#9d8c99",
        "tertiary-fixed": "#f5d9ff",
        "surface-dim": "#0f131b",
        "on-tertiary-container": "#e8baff",
        "on-primary-fixed-variant": "#7a187c",
        "surface-bright": "#353941",
        "surface-tint": "#ffaaf7",
        "on-surface-variant": "#d5c1cf",
        "error-container": "#93000a"
      },
      fontFamily: {
        'display-lg': ['EB Garamond', 'serif'],
        'headline-lg': ['EB Garamond', 'serif'],
        'headline-lg-mobile': ['EB Garamond', 'serif'],
        'title-md': ['EB Garamond', 'serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'label-md': ['Inter', 'sans-serif'],
        'label-sm': ['Inter', 'sans-serif'],
        'label-caps': ['Inter', 'sans-serif'],
      },
      spacing: {
        "margin-mobile": "16px",
        "gutter": "24px",
        "margin-desktop": "64px",
        "base": "8px",
        "max-width": "1280px",
        "container-max": "1280px",
        "section-gap": "160px"
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
