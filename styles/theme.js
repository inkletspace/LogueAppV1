export const colors = {
  primary: '#A855F7', // Main purple
  primaryDark: '#9333EA',
  primaryLight: '#C084FC',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  
  // Category colors (matching your original app)
  cardColors: [
    '#F3E8FF', // Light purple
    '#FEE2E2', // Light red
    '#DBEAFE', // Light blue
    '#D1FAE5', // Light green
    '#FED7AA', // Light orange
    '#E0E7FF', // Light indigo
    '#FCE7F3', // Light pink
    '#FBBF24', // Yellow
    '#F3F4F6', // Light gray
    '#C7D2FE', // Another purple
    '#A5F3FC', // Cyan
    '#C6F6D5', // Mint
  ]
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 12,
    color: colors.textSecondary,
  },
};