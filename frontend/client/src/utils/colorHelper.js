export const COLOR_MAP = {
  red: '#DC2626',
  maroon: '#800000',
  crimson: '#991B1B',
  wine: '#722F37',
  burgundy: '#800020',
  ruby: '#E0115F',
  pink: '#EC4899',
  'rani pink': '#E11D48',
  'hot pink': '#FF1493',
  'baby pink': '#FBCFE8',
  'blush pink': '#FCE7F3',
  'rose gold': '#B76E79',
  peach: '#FDBA74',
  coral: '#FB7185',
  orange: '#EA580C',
  rust: '#B45309',
  gold: '#D4AF37',
  'royal gold': '#D4AF37',
  mustard: '#D97706',
  yellow: '#EAB308',
  lemon: '#FEF08A',
  green: '#16A34A',
  'emerald green': '#047857',
  emerald: '#047857',
  'bottle green': '#064E3B',
  'mint green': '#6EE7B7',
  mint: '#6EE7B7',
  'mehendi green': '#556B2F',
  olive: '#65A30D',
  'olive green': '#65A30D',
  sage: '#9CA3AF',
  'sage green': '#94A3B8',
  blue: '#2563EB',
  'royal blue': '#1D4ED8',
  'navy blue': '#1E3A8A',
  navy: '#1E3A8A',
  'sky blue': '#38BDF8',
  teal: '#0D9488',
  turquoise: '#06B6D4',
  indigo: '#4F46E5',
  purple: '#9333EA',
  lavender: '#C084FC',
  violet: '#7C3AED',
  magenta: '#D946EF',
  lilac: '#DDD6FE',
  black: '#1C1917',
  white: '#FFFFFF',
  ivory: '#FFFFF0',
  cream: '#FEF3C7',
  beige: '#F5F5DC',
  nude: '#E2D5C3',
  brown: '#78350F',
  tan: '#D2B48C',
  grey: '#6B7280',
  gray: '#6B7280',
  silver: '#E5E7EB',
  charcoal: '#374151'
}

export const getColorHex = (colorName) => {
  if (!colorName || typeof colorName !== 'string') return '#CBD5E1'
  const clean = colorName.trim().toLowerCase()
  if (COLOR_MAP[clean]) return COLOR_MAP[clean]
  
  const found = Object.keys(COLOR_MAP).find(k => clean.includes(k) || k.includes(clean))
  if (found) return COLOR_MAP[found]
  
  return '#D4AF37'
}
