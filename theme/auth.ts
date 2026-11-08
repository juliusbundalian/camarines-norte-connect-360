/** Temporary Figma auth tokens, isolated from the Poppins onboarding theme. */
export const authTokens = {
  colors: {
    background: "#F5F5F9",
    primary: "#39B54A",
    action: "#FFAB00",
    text: "rgba(34,48,62,0.9)",
    secondary: "rgba(34,48,62,0.7)",
    muted: "rgba(34,48,62,0.4)",
    border: "rgba(34,48,62,0.22)",
    subtle: "rgba(133,146,163,0.16)",
    error: "#B3261E",
    errorBackground: "#FCE8E6",
  },
  fonts: { regular: "PublicSans-Regular", medium: "PublicSans-Medium" },
  space: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24 },
  size: {
    appBar: 64,
    action: 48,
    input: 56,
    icon: 24,
    ruleIcon: 16,
    prefix: 62,
  },
  radius: { button: 12, field: 16 },
  opacity: { disabled: 0.4 },
  type: {
    heading: { fontSize: 24, lineHeight: 32 },
    body: { fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
    label: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
    small: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  },
} as const;
