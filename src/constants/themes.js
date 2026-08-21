/**
 * Chessboard color theme definitions
 */
export const THEMES = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    subtitle: 'Classic Digital',
    lightSquare: '#ebecd0',
    darkSquare: '#779556',
    accent: '#10b981',
    boardBorder: 'border-slate-800',
    preview: ['#ebecd0', '#779556']
  },
  wood: {
    id: 'wood',
    name: 'Warm Wood',
    subtitle: 'Tournament Timber',
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    accent: '#d97706',
    boardBorder: 'border-amber-950',
    preview: ['#f0d9b5', '#b58863']
  },
  slate: {
    id: 'slate',
    name: 'Slate Dark',
    subtitle: 'Modern Minimalist',
    lightSquare: '#dee3e6',
    darkSquare: '#8ca2ad',
    accent: '#64748b',
    boardBorder: 'border-slate-800',
    preview: ['#dee3e6', '#8ca2ad']
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Neon',
    subtitle: 'Cyberpunk Blue',
    lightSquare: '#1e293b',
    darkSquare: '#0284c7',
    accent: '#06b6d4',
    boardBorder: 'border-cyan-900/60',
    preview: ['#1e293b', '#0284c7']
  }
};

export const DEFAULT_THEME = 'emerald';
