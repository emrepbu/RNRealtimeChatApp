export const Theme = {
  colors: {
    primary: '#007AFF',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#1C1C1E',
    subtext: '#8E8E93',
    border: '#EFEFEF',
    error: '#FF3B30',
    success: '#34C759',
    white: '#FFFFFF',
    placeholder: '#999999',
    divider: '#EFEFEF',
    lightGray: '#CCC',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 30,
    round: 999,
  },
  glass: {
    intensity: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  typography: {
    sizes: {
      tiny: 11,
      small: 12,
      caption: 14,
      body: 16,
      header: 18,
      title: 28,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    }
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
    },
    primary: {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.15,
      shadowRadius: 30,
      elevation: 8,
    }
  }
};
