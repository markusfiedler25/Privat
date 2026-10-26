/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', surface2: 'var(--surface-2)', ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)',
        pine: 'var(--pine)', pinesoft: 'var(--pine-soft)', sky: 'var(--sky)', skysoft: 'var(--sky-soft)',
        amber: 'var(--amber)', ambersoft: 'var(--amber-soft)', ok: 'var(--ok)', oksoft: 'var(--ok-soft)',
        err: 'var(--err)', errsoft: 'var(--err-soft)', onaccent: 'var(--on-accent)'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Atkinson Hyperlegible"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
