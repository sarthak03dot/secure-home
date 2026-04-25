/**
 * Hacker 2.0 Theme Configuration
 * Professional, tactical, and high-contrast
 */

export const theme = {
  colors: {
    // Core Base
    black: '#050505',
    white: '#ffffff',
    
    // Primary Accents
    green: '#00ff41',    // Matrix / Nominal
    red: '#ff3131',      // Alert / Danger
    
    // Surface Layers
    surface: {
      deep: '#0a0a0b',
      panel: '#121214',
      light: '#1a1a1c'
    },

    // Typography
    text: {
      primary: '#ffffff',
      secondary: '#94a3b8',
      muted: '#64748b',
      disabled: '#475569'
    },
    
    // Branding
    brand: {
      glow: 'rgba(0, 255, 65, 0.4)',
      danger: 'rgba(255, 49, 49, 0.5)'
    }
  },
  
  // Design Elements
  fx: {
    scanline: 'rgba(0, 255, 65, 0.1)',
    grid: 'rgba(255, 255, 255, 0.02)',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
  },

  typography: {
    heading: "'Outfit', sans-serif",
    mono: "'Space Grotesk', monospace"
  }
};

export default theme;
