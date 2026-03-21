const LegalDocument = require("../models/LegalDocument");

// ── Privacy Policy seed ───────────────────────────────────────────────────────
const PRIVACY_SEED = {
  slug:        "privacy-policy",
  title:       "Privacy Policy",
  subtitle:    "How QuickBreak handles user data and privacy",
  badgeLabel:  "Legal Document",
  lastUpdated: new Date("2026-03-21"),
  contactBox: {
    teamName:     "QuickBreak Privacy Team",
    email:        "privacy@quickbreak.uk",
    responseTime: "Within 30 days",
  },
  sections: [
    {
      key: "introduction", title: "Introduction", order: 1,
      blocks: [
        { type: "paragraph", content: "Welcome to QuickBreak. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our motorway service station finder platform." },
        { type: "paragraph", content: "By using QuickBreak, you agree to the terms outlined in this Privacy Policy. If you do not agree with our practices, please do not use our services." },
      ],
    },
    {
      key: "information-we-collect", title: "Information We Collect", order: 2,
      blocks: [
        { type: "paragraph", content: "We collect the following types of information:" },
        {
          type: "infoCards",
          cards: [
            { title: "Account Information", body: "When you create an account, we collect your name, email address, and password. This information is used to manage your account and provide personalised features." },
            { title: "Location Data",       body: "With your permission, we collect your location data to show nearby motorway service stations. You can disable location services at any time in your device settings." },
            { title: "Usage Information",   body: "We collect information about how you interact with QuickBreak, including searches, stations viewed, and features used. This helps us improve our service." },
          ],
        },
      ],
    },
    {
      key: "how-we-use-information", title: "How We Use Information", order: 3,
      blocks: [
        { type: "paragraph", content: "We use your information to:" },
        {
          type: "bullets",
          items: [
            "Provide and maintain QuickBreak services",
            "Show you nearby motorway service stations based on your location",
            "Personalise your experience with saved stations and preferences",
            "Respond to your support requests and communications",
            "Improve and optimise our platform based on usage patterns",
          ],
        },
      ],
    },
    {
      key: "cookies", title: "Cookies", order: 4,
      blocks: [
        { type: "paragraph", content: "QuickBreak uses cookies and similar tracking technologies to enhance your experience. Cookies are small text files stored on your device that help us remember your preferences and understand how you use our service." },
        { type: "paragraph", content: "You can control cookies through your browser settings. However, disabling cookies may limit some functionality of QuickBreak." },
      ],
    },
    {
      key: "saved-stations-data", title: "Saved Stations Data", order: 5,
      blocks: [
        { type: "paragraph", content: "When you save motorway service stations to your account, we store this information to provide you with quick access across devices. Your saved stations list is private and only visible to you." },
        { type: "paragraph", content: "You can remove saved stations at any time from your Saved Stations page. Deleted saved stations are permanently removed from our systems." },
      ],
    },
    {
      key: "reviews-and-reports", title: "Reviews and Reports", order: 6,
      blocks: [
        { type: "paragraph", content: "Reviews and reports you submit are publicly visible to help other QuickBreak users make informed decisions. Your name or username will be associated with your reviews." },
        { type: "paragraph", content: "We moderate reviews and reports to ensure they meet our community guidelines. You retain ownership of your content, but grant QuickBreak permission to display it on our platform." },
      ],
    },
    {
      key: "third-party-services", title: "Third-Party Services", order: 7,
      blocks: [
        { type: "paragraph", content: "QuickBreak may use third-party services for analytics, mapping, and other features. These services may collect information as governed by their own privacy policies." },
        {
          type: "bullets",
          items: [
            "Google Maps for navigation and location services",
            "Analytics providers to understand usage patterns",
          ],
        },
      ],
    },
    {
      key: "user-rights", title: "User Rights", order: 8,
      blocks: [
        { type: "paragraph", content: "You have the following rights regarding your personal data:" },
        {
          type: "rightsBox",
          rights: [
            { title: "Access",      description: "Request a copy of your personal data" },
            { title: "Correction",  description: "Update or correct inaccurate information" },
            { title: "Deletion",    description: "Request deletion of your account and data" },
            { title: "Portability", description: "Export your data in a common format" },
          ],
        },
      ],
    },
    {
      key: "contact-privacy-requests", title: "Contact for Privacy Requests", order: 9,
      blocks: [
        { type: "paragraph", content: "If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:" },
        { type: "contactBox" },
      ],
    },
  ],
};

// ── Terms of Service seed ─────────────────────────────────────────────────────
const TERMS_SEED = {
  slug:        "terms-of-service",
  title:       "Terms of Service",
  subtitle:    "Terms and conditions for using QuickBreak",
  badgeLabel:  "Legal Document",
  lastUpdated: new Date("2026-03-21"),
  contactBox: {
    teamName:     "QuickBreak Legal Team",
    email:        "legal@quickbreak.uk",
    supportEmail: "support@quickbreak.uk",
    responseTime: "Within 7 business days",
  },
  acknowledgementText: "By using QuickBreak, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.",
  sections: [
    {
      key: "acceptance", title: "Acceptance of Terms", order: 1,
      blocks: [
        { type: "paragraph", content: "Welcome to QuickBreak. By accessing or using our motorway service station finder platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services." },
        { type: "paragraph", content: "These terms apply to all users of QuickBreak, including visitors browsing as guests and registered users with full accounts." },
        { type: "paragraph", content: "We reserve the right to update these terms at any time. Continued use of QuickBreak after changes are posted constitutes acceptance of the modified terms." },
      ],
    },
    {
      key: "user-responsibilities", title: "User Responsibilities", order: 2,
      blocks: [
        { type: "paragraph", content: "As a user of QuickBreak, you agree to:" },
        {
          type: "bullets",
          items: [
            "Provide accurate information when creating an account or submitting content",
            "Use QuickBreak only for lawful purposes and in compliance with UK laws",
            "Maintain the security of your account credentials",
            "Not attempt to gain unauthorised access to our systems or other user accounts",
            "Use the platform safely and responsibly, especially while driving",
          ],
        },
        { type: "paragraph", content: "Failure to comply with these responsibilities may result in account suspension or termination." },
      ],
    },
    {
      key: "guest-access-rules", title: "Guest Access Rules", order: 3,
      blocks: [
        { type: "paragraph", content: "QuickBreak offers guest access to allow users to explore the platform without creating an account. Guest users may:" },
        {
          type: "guestActivitiesBox",
          title: "Permitted Guest Activities",
          items: [
            "Browse nearby motorway service stations",
            "View station details and amenities",
            "Read existing reviews",
            "Use navigation features",
          ],
        },
        { type: "paragraph", content: "Guest users cannot save stations, post reviews, or create reports. These features require a registered account to ensure accountability and maintain platform quality." },
      ],
    },
    {
      key: "reviews-user-content", title: "Reviews and User Content", order: 4,
      blocks: [
        { type: "paragraph", content: "When you post reviews, reports, or other content on QuickBreak, you agree that:" },
        {
          type: "infoCards",
          cards: [
            { title: "Content Standards",  body: "Your content must be truthful, respectful, and based on your genuine experience. Reviews should not contain offensive language, personal attacks, spam, or misleading information." },
            { title: "Content License",    body: "You retain ownership of your content but grant QuickBreak a worldwide, royalty-free licence to display, distribute, and use your content to operate and improve the platform." },
            { title: "Content Moderation", body: "We reserve the right to review, edit, or remove any content that violates these terms or our community guidelines. Repeated violations may result in account suspension." },
          ],
        },
      ],
    },
    {
      key: "saved-stations-account", title: "Saved Stations and Account Features", order: 5,
      blocks: [
        { type: "paragraph", content: "Registered users can save motorway service stations to their account for quick access. Saved stations are stored securely and synchronised across devices when you log in." },
        { type: "paragraph", content: "You may add or remove saved stations at any time. If you delete your account, all saved stations and associated data will be permanently removed." },
        { type: "paragraph", content: "Account features such as personalised recommendations and preferences are provided to enhance your experience but may be modified or discontinued at our discretion." },
      ],
    },
    {
      key: "limitations-of-service", title: "Limitations of Service", order: 6,
      blocks: [
        { type: "paragraph", content: "QuickBreak is provided \"as is\" without warranties of any kind. We strive to provide accurate and up-to-date information about motorway service stations, but we cannot guarantee:" },
        {
          type: "bullets",
          items: [
            "The accuracy, completeness, or timeliness of station information",
            "Uninterrupted or error-free operation of the platform",
            "That stations will have the amenities or services listed",
          ],
        },
        {
          type: "noticeBox",
          title: "Important Notice",
          text:  "QuickBreak is a navigation and information tool. Always prioritise safe driving practices. Do not use QuickBreak while operating a vehicle unless using hands-free voice features. We are not liable for accidents or incidents that occur while using our platform.",
        },
      ],
    },
    {
      key: "third-party-links", title: "Third-Party Links", order: 7,
      blocks: [
        { type: "paragraph", content: "QuickBreak may contain links to third-party websites, services, or applications (such as navigation apps, mapping services, or service station websites). These links are provided for your convenience." },
        { type: "paragraph", content: "We do not endorse, control, or assume responsibility for third-party content, services, or privacy practices. Your interactions with third parties are governed by their terms and policies." },
        { type: "paragraph", content: "We recommend reviewing the terms of service and privacy policies of any third-party sites you visit through QuickBreak." },
      ],
    },
    {
      key: "termination", title: "Termination", order: 8,
      blocks: [
        { type: "paragraph", content: "You may stop using QuickBreak or delete your account at any time. To delete your account, contact our support team or use the account settings page." },
        { type: "paragraph", content: "We reserve the right to suspend or terminate accounts that violate these Terms of Service, engage in fraudulent activity, or abuse the platform. We will make reasonable efforts to notify you before termination unless immediate action is required." },
        { type: "paragraph", content: "Upon termination, your access to account features will cease, and your data may be deleted in accordance with our Privacy Policy. User-generated content such as reviews may remain visible if they comply with our guidelines." },
      ],
    },
    {
      key: "contact-information", title: "Contact Information", order: 9,
      blocks: [
        { type: "paragraph", content: "If you have questions about these Terms of Service or need to report a violation, please contact us:" },
        { type: "termsContactBox" },
        { type: "acknowledgement" },
      ],
    },
  ],
};

async function seedIfMissing(data) {
  // Use findOneAndUpdate with upsert so re-deploys pick up content changes
  await LegalDocument.findOneAndUpdate(
    { slug: data.slug },
    { $setOnInsert: data },
    { upsert: true, new: false }
  );
}

// Force-refresh terms seed (picks up new sections/blocks on restart)
async function refreshTerms() {
  await LegalDocument.findOneAndUpdate(
    { slug: "terms-of-service" },
    { $set: TERMS_SEED },
    { upsert: true }
  );
}
// ── GET /api/legal/:slug ──────────────────────────────────────────────────────
exports.getDocument = async (req, res, next) => {
  try {
    await seedIfMissing(PRIVACY_SEED);
    await refreshTerms(); // always keep terms up to date

    const doc = await LegalDocument.findOne({ slug: req.params.slug, isPublished: true }).lean();
    if (!doc) { res.status(404); throw new Error("Document not found"); }

    res.json(doc);
  } catch (err) { next(err); }
};
