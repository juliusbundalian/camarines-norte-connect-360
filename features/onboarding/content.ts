export const onboardingPages = [
  {
    title: "Discover the\nCamarines Norte",
    description:
      "Explore stunning beaches, heritage sites, & hidden gems across the province",
    icon: "palm",
    steps: require("../../assets/onboarding/steps-1.svg"),
  },
  {
    title: "Explore Property Opportunities",
    description:
      "Find homes, lots, & investment properties around Camarines Norte",
    icon: "home",
    steps: require("../../assets/onboarding/steps-2.svg"),
  },
  {
    title: "Stay Connected \nwith the Community",
    description:
      "Get local updates, join events, & share your voice through surveys & feedbacks",
    icon: "community",
    steps: require("../../assets/onboarding/steps-3.svg"),
  },
] as const;
export type OnboardingContent = (typeof onboardingPages)[number];
