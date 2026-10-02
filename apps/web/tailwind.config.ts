import type { Config } from 'tailwindcss';

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Semantic tokens (light + dark come from globals.css)
        bg: token('bg'),
        surface: token('surface'),
        raised: token('raised'),
        line: token('line'),
        fg: {
          DEFAULT: token('fg'),
          muted: token('fg-muted'),
          subtle: token('fg-subtle'),
        },
        accent: {
          DEFAULT: token('accent'),
          fg: token('accent-fg'),
          ink: token('accent-ink'),
          foreground: token('accent-fg'),
        },
        danger: token('danger'),
        success: token('success'),

        // Brand scales for one-off use
        yellow: {
          50: '#FFFBEA',
          100: '#FFF3C4',
          200: '#FFE58A',
          300: '#FFD84D',
          400: '#FFCE1F',
          500: '#FFC800',
          600: '#D9A900',
          700: '#A67F00',
          800: '#735800',
          900: '#3D2F00',
        },
        ink: {
          50: '#F5F5F3',
          100: '#E6E6E3',
          200: '#C9CACC',
          300: '#A3A9B0',
          400: '#7E858D',
          500: '#5A6068',
          600: '#3A3F45',
          700: '#2C3035',
          800: '#17191C',
          900: '#0E0F11',
          950: '#08090A',
        },

        // shadcn/ui
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        secondary: { DEFAULT: token('secondary'), foreground: token('secondary-foreground') },
        destructive: { DEFAULT: token('destructive'), foreground: token('destructive-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        popover: { DEFAULT: token('popover'), foreground: token('popover-foreground') },
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
