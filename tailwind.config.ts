import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Paleta minimalista IntelliX.AI inspired
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Cores customizadas IntelliX
  			cyan: {
  				DEFAULT: '#00D9FF',
  				50: '#E5F9FF',
  				100: '#CCF3FF',
  				200: '#99E7FF',
  				300: '#66DBFF',
  				400: '#33CFFF',
  				500: '#00D9FF',
  				600: '#00AED9',
  				700: '#0082A3',
  				800: '#00566D',
  				900: '#002B37'
  			},
  			gold: {
  				DEFAULT: '#FFB800',
  				50: '#FFF9E5',
  				100: '#FFF3CC',
  				200: '#FFE799',
  				300: '#FFDB66',
  				400: '#FFCF33',
  				500: '#FFB800',
  				600: '#CC9300',
  				700: '#996E00',
  				800: '#664A00',
  				900: '#332500'
  			},
  			dark: {
  				DEFAULT: '#0A0A0A',
  				50: '#1A1A1A',
  				100: '#141414',
  				200: '#0F0F0F',
  				300: '#0A0A0A',
  				400: '#050505',
  				500: '#000000'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: ['Inter', 'system-ui', 'sans-serif']
  		},
  		boxShadow: {
  			'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.3)',
  			'glow-gold': '0 0 20px rgba(255, 184, 0, 0.3)',
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
