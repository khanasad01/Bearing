/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-sunken': 'var(--surface-sunken)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        
        // Semantic: Plan / Actual
        plan: 'var(--plan)',
        'plan-soft': 'var(--plan-soft)',
        actual: 'var(--actual)',
        ember: 'var(--ember)',
        'ember-text': 'var(--ember-text)',
        'ember-soft': 'var(--ember-soft)',
        
        // Semantic: AI + Status
        insight: 'var(--insight)',
        'insight-soft': 'var(--insight-soft)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
      },
      fontFamily: {
        ui: ['var(--font-ui)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      keyframes: {
        // Add any custom animations if needed
      },
      animation: {
        // Add any custom animations if needed
      },
    },
  },
  plugins: [],
};
