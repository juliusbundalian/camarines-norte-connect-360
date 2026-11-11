export type LegalLink = {label: string; url: string};

export type LegalDocument = {
  title: string;
  documentTitle: string;
  publicationDate?: string;
  effectiveDate?: string;
  sections: readonly {
    heading: string;
    paragraphs: readonly {text: string; links?: readonly LegalLink[]}[];
  }[];
};

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  documentTitle: "CamNorte 360 Privacy Policy",
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        {
          text: "CamNorte 360 helps people browse property listings and maps in Daet, Camarines Norte, Philippines. [Legal operator name] operates the app and is responsible for the personal information described in this policy. Contact us at [public privacy email] or [operator mailing address]."
        }
      ]
    },
    {
      heading: "2. Information we handle",
      paragraphs: [
        {
          text: "You can browse published property listings without creating an account. The app stores onboarding completion on your device. Search and filter selections are used within the Properties screen to find matching listings."
        },
        {
          text: "If you register, we use your email address and account identifier to manage sign-in and password recovery through Firebase Authentication. Firebase Authentication processes the password you submit when registering or signing in."
        },
        {
          text: "When you set up or edit your profile, the information you provide can include your name, gender, date of birth, selected avatar, and optional mobile number. Cloud Firestore stores profile information, saved setup progress, and avatar preferences so you can resume setup and manage your account. Account records also contain timestamps and setup status."
        }
      ]
    },
    {
      heading: "3. Services that help operate the app",
      paragraphs: [
        {
          text: "We use Google Firebase for authentication and Cloud Firestore for profile records and published listings. Google processes information in connection with these services as described in its Firebase privacy information.",
          links: [
            {
              label: "Firebase privacy information",
              url: "https://firebase.google.com/support/privacy"
            }
          ]
        },
        {
          text: "The app uses Google Maps on supported devices to display listing locations. Map pins represent property coordinates, some of which are estimates. The app’s property map does not ask for your device location. Google may receive technical information when its services load. See the Google Privacy Policy.",
          links: [
            {
              label: "Google Privacy Policy",
              url: "https://policies.google.com/privacy"
            }
          ]
        },
        {
          text: "If you use your device’s Share feature, you choose where to send the listing information. The service you choose handles the shared information under its own policy."
        },
        {
          text: "Other recipients and processing locations: [To be confirmed]."
        }
      ]
    },
    {
      heading: "4. Retention and protection",
      paragraphs: [
        {
          text: "We use access controls intended to protect account records. Retention periods and deletion procedures: [To be confirmed]."
        }
      ]
    },
    {
      heading: "5. Your privacy rights",
      paragraphs: [
        {
          text: "Under applicable Philippine privacy law, you may have the right to be informed, access or correct your personal information, object to certain processing, request erasure or blocking, obtain a copy in a portable format where applicable, and seek redress. You may also lodge a complaint with the National Privacy Commission.",
          links: [
            {
              label: "National Privacy Commission",
              url: "https://privacy.gov.ph/data-subject-rights/"
            }
          ]
        },
        {
          text: "You can edit supported profile fields in Account. For other requests, including account and data deletion, contact [public privacy email]."
        }
      ]
    },
    {
      heading: "6. Changes to this policy",
      paragraphs: [
        {
          text: "The effective date at the top identifies the version that applies. Notice of material changes: [To be confirmed]."
        }
      ]
    }
  ]
};

export const termsAndConditions: LegalDocument = {
  title: "Terms & Conditions",
  documentTitle: "CamNorte 360 Terms & Conditions",
  sections: [
    {
      heading: "1. About these terms",
      paragraphs: [
        {
          text: "These terms govern use of CamNorte 360, a mobile app operated by [legal operator name]. The app currently lets people browse property information and maps in Daet, Camarines Norte, Philippines, and create an account to manage their profile. The Privacy Policy explains how we handle personal information.",
          links: [
            {
              label: "Privacy Policy",
              url: "/privacy-policy"
            }
          ]
        }
      ]
    },
    {
      heading: "2. Guest browsing and accounts",
      paragraphs: [
        {
          text: "You can browse published listings as a guest. If you create an account, provide accurate account and profile information and keep your sign-in credentials secure. Use the password recovery option if you need to reset your password. Contact [support email] if you suspect someone else is using your account."
        }
      ]
    },
    {
      heading: "3. Property information",
      paragraphs: [
        {
          text: "Listings are for browsing and initial research. Prices, availability, descriptions, measurements, photos, and contact details may change or contain errors. Map pins may be approximate. Before relying on a listing, confirm the property details, exact location, ownership, and transaction terms with the relevant seller or authorized representative."
        },
        {
          text: "Browsing or sharing a listing does not reserve the property, book a viewing, submit an inquiry, or create a sale or lease agreement. Any arrangements you make separately with a listing contact are between you and that party."
        }
      ]
    },
    {
      heading: "4. Using the app responsibly",
      paragraphs: [
        {
          text: "Use CamNorte 360 lawfully. Do not impersonate another person, use the app to mislead or harass others, access another person’s account without permission, or interfere with the app’s operation. Respect applicable rights in listing photos, text, maps, and other materials."
        }
      ]
    },
    {
      heading: "5. Maps and other services",
      paragraphs: [
        {
          text: "CamNorte 360 includes Google Maps features and content. Your use of those features and content is subject to the current Google Maps Additional Terms and Google Privacy Policy. If you share a listing through another app, that app’s terms and privacy policy may also apply.",
          links: [
            {
              label: "Google Maps Additional Terms",
              url: "https://maps.google.com/help/terms_maps/"
            },
            {
              label: "Google Privacy Policy",
              url: "https://policies.google.com/privacy"
            }
          ]
        }
      ]
    },
    {
      heading: "6. Updates and questions",
      paragraphs: [
        {
          text: "Features and listing information may change over time. The effective date at the top identifies this version of the terms. Notice of changes and any new acceptance requirements: [To be confirmed]."
        },
        {
          text: "For questions about these terms or to report a listing issue, contact [support email]. These terms do not limit rights that applicable law gives you."
        }
      ]
    }
  ]
};
