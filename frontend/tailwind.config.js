/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // The Administratum 88k palette: a phosphor-green CRT terminal,
        // never a friendly SaaS gray. Every screen in this app is meant to
        // feel like a decades-old mainframe processing bureaucracy.
        term: {
          bg: '#0a0e0a',
          panel: '#0f1a10',
          border: '#123420',
          borderBright: '#1f5c34',
          green: '#33ff66',
          greenDim: '#1b7a3d',
          amber: '#ffb000',
          red: '#ff3b3b',
          text: '#c8ffd8',
        },
      },
      fontFamily: {
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      keyframes: {
        blink: { '0%, 49%': { opacity: '1' }, '50%, 100%': { opacity: '0' } },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.85' },
          '94%': { opacity: '1' },
        },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
        flicker: 'flicker 6s infinite',
      },
    },
  },
  plugins: [],
};
