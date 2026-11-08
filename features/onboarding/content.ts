export const onboardingPages = [
  {
    title: "Discover\nDaet, Camarines Norte",
    description:
      "Explore beaches, heritage sites, & hidden gems in Daet, Camarines Norte",
    icon: "palm",
    steps: require("../../assets/onboarding/steps-1.svg"),
  },
  {
    title: "Explore Property Opportunities",
    description:
      "Find homes, lots, & investment properties in Daet, Camarines Norte",
    icon: "home",
    steps: require("../../assets/onboarding/steps-2.svg"),
  },
  {
    title: "Stay Connected \nwith the Community",
    description:
      "Get updates from Daet, join local events, & share your voice through surveys & feedbacks",
    icon: "community",
    steps: require("../../assets/onboarding/steps-3.svg"),
  },
] as const;
export type OnboardingContent = (typeof onboardingPages)[number];
