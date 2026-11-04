import { MD3LightTheme } from 'react-native-paper';
import { tokens } from './tokens';
export { tokens };
export const theme = { ...MD3LightTheme, roundness: tokens.radius / 3,
  colors: { ...MD3LightTheme.colors, primary: tokens.colors.primary, background: tokens.colors.background, surface: tokens.colors.surface, onSurface: tokens.colors.text, onSurfaceVariant: tokens.colors.muted, error: tokens.colors.error, outline: tokens.colors.outline, onPrimary: tokens.colors.onPrimary } };
