export const THEME = {
  colors: {
    background: '#0a0a0f', // OLED dark mode slate-900
    surface: '#12121a', // Slightly lighter slate
    surfaceHover: '#1c1c28',
    primary: '#22d3ee', // Neon cyan-400
    primaryGlow: 'rgba(34, 211, 238, 0.5)',
    accent: '#a855f7', // Purple accents
    accentGlow: 'rgba(168, 85, 247, 0.5)',
    text: {
      main: '#f8fafc', // slate-50
      muted: '#94a3b8', // slate-400
      inverse: '#020617', // slate-950
    },
    board: {
      brown: '#8B4513',
      light_blue: '#87CEFA',
      pink: '#FF69B4',
      orange: '#FFA500',
      red: '#FF0000',
      yellow: '#FFD700',
      green: '#008000',
      dark_blue: '#00008B',
      utility: '#E5E7EB',
      airport: '#9CA3AF',
      tax: '#EF4444',
      card: '#F59E0B'
    }
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: 'text-4xl font-bold tracking-tight',
    h2: 'text-3xl font-bold tracking-tight',
    h3: 'text-2xl font-semibold',
    body: 'text-base font-normal',
    caption: 'text-sm font-medium',
  },
  effects: {
    glassmorphism: 'bg-slate-900/60 backdrop-blur-md border border-white/10',
    neonGlow: 'shadow-[0_0_15px_rgba(34,211,238,0.5)]',
    transition: 'transition-all duration-300 ease-in-out',
  }
};
