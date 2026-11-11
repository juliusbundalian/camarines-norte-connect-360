import {menuTokens} from '../../theme/menu';

export const propertyTheme = {
  fonts: menuTokens.fonts,
  colors: {
    ...menuTokens.colors,
    chip: '#E9EBEF',
    chipText: '#68778A',
    border: '#CED0D4',
    yellow: '#FFA600',
    lightYellow: '#FFF1D6',
    overlay: 'rgba(34,48,62,0.54)',
  },
} as const;
