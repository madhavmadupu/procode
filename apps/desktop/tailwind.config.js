/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./src/renderer/**/*.{ts,tsx,html}"],
  theme: {
  	extend: {
  		colors: {
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
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				accent: 'hsl(var(--sidebar-accent))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			editor: {
  				DEFAULT: 'hsl(var(--editor))',
  				foreground: 'hsl(var(--editor-foreground))',
  				lineHighlight: 'hsl(var(--editor-line-highlight))',
  				selection: 'hsl(var(--editor-selection))'
  			},
  			statusBar: {
  				DEFAULT: 'hsl(var(--status-bar))',
  				foreground: 'hsl(var(--status-bar-foreground))'
  			},
  			titleBar: {
  				DEFAULT: 'hsl(var(--title-bar))',
  				foreground: 'hsl(var(--title-bar-foreground))'
  			},
  			activityBar: {
  				DEFAULT: 'hsl(var(--activity-bar))',
  				foreground: 'hsl(var(--activity-bar-foreground))',
  				foregroundActive: 'hsl(var(--activity-bar-foreground-active))'
  			},
  			tab: {
  				active: 'hsl(var(--tab-active))',
  				inactive: 'hsl(var(--tab-inactive))',
  				border: 'hsl(var(--tab-border))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		zIndex: {
  			editor: 'var(--z-editor)',
  			sidebar: 'var(--z-sidebar)',
  			activityBar: 'var(--z-activity-bar)',
  			statusBar: 'var(--z-status-bar)',
  			tabBar: 'var(--z-tab-bar)',
  			breadcrumb: 'var(--z-breadcrumb)',
  			panelHeader: 'var(--z-panel-header)',
  			dropdown: 'var(--z-dropdown)',
  			tooltip: 'var(--z-tooltip)',
  			modal: 'var(--z-modal)',
  			toast: 'var(--z-toast)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
