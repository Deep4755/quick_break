const HelpArticle = require("../models/HelpArticle");

// ── categories config ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: "account-login",    name: "Account & Login",      description: "Manage your account settings and login issues",  iconKey: "user",      displayOrder: 1 },
  { slug: "saved-stations",   name: "Saved Stations",       description: "Learn how to save and manage your favourite stations", iconKey: "bookmark", displayOrder: 2 },
  { slug: "reviews",          name: "Reviews",              description: "Post reviews and rate service stations",          iconKey: "star",      displayOrder: 3 },
  { slug: "reports",          name: "Reports",              description: "Create and submit station reports",               iconKey: "report",    displayOrder: 4 },
  { slug: "navigation",       name: "Navigation",           description: "Get directions and use map features",             iconKey: "navigate",  displayOrder: 5 },
  { slug: "bexxa-assistant",  name: "Bexxa AI Assistant",   description: "Voice search and AI-powered features",            iconKey: "bexxa",     displayOrder: 6 },
];

// ── seed data ─────────────────────────────────────────────────────────────────
const SEED_ARTICLES = [
  // Account & Login
  { title: "How do I log in to QuickBreak?", slug: "how-to-login", category: "account-login", summary: "Steps to log in to your QuickBreak account.", content: "To log in, click the Login button in the top-right corner of the navbar. Enter your registered email address and password, then click Sign In. If you have forgotten your password, use the Forgot Password link on the login page.", keywords: ["login","sign in","account","password"], isFaq: false, faqOrder: 99 },
  { title: "I forgot my password", slug: "forgot-password", category: "account-login", summary: "How to reset your QuickBreak password.", content: "If you have forgotten your password, click the Forgot Password link on the login page. Enter your registered email address and we will send you a reset link. Follow the link in the email to set a new password. If you do not receive the email, check your spam folder.", keywords: ["password","reset","forgot","email"], isFaq: false, faqOrder: 99 },
  { title: "Can I use QuickBreak without an account?", slug: "use-without-account", category: "account-login", summary: "Yes — Guest Access lets you browse without signing up.", content: "Yes. QuickBreak offers Guest Access so you can browse nearby stations, view station details, use navigation, and read reviews without creating an account. Visit the Guest Access page to get started. Note that saving stations, posting reviews, and creating reports require a free account.", keywords: ["guest","no account","browse","sign up"], isFaq: true, faqOrder: 4 },
  { title: "How guest access works", slug: "guest-access-explained", category: "account-login", summary: "Understanding the guest browsing mode.", content: "Guest Access is a limited browsing mode that lets you explore QuickBreak without registering. As a guest you can browse nearby stations, view details, use navigation, and read reviews. You cannot save stations, post reviews, or create reports. Guest sessions are stored temporarily and expire after 7 days. You can upgrade to a full account at any time.", keywords: ["guest","access","session","limited"], isFaq: false, faqOrder: 99 },

  // Saved Stations
  { title: "How do I save a station?", slug: "how-to-save-station", category: "saved-stations", summary: "Bookmark stations from the Nearby page.", content: "To save a station, go to the Nearby Stations page and find the station you want. Click the bookmark icon in the top-right corner of the station card. The icon will turn green to confirm it has been saved. You must be logged in to save stations — guest users will see a prompt to create a free account.", keywords: ["save","bookmark","station","nearby"], isFaq: true, faqOrder: 1 },
  { title: "Why can't I save stations in guest mode?", slug: "guest-cannot-save", category: "saved-stations", summary: "Saving requires a free account.", content: "Saving stations is an account feature that stores your favourites in the cloud so you can access them on any device. Guest mode is a temporary browsing session and does not support persistent data. Create a free QuickBreak account to unlock saving stations and other features.", keywords: ["guest","save","account","bookmark"], isFaq: false, faqOrder: 99 },
  { title: "How do I remove a saved station?", slug: "remove-saved-station", category: "saved-stations", summary: "Remove stations from your saved list.", content: "To remove a saved station, go to your Saved Stations page from the navbar. Find the station you want to remove and click the red Remove button on the station card. You can also click the filled green bookmark icon on the Nearby page to unsave a station.", keywords: ["remove","unsave","delete","saved"], isFaq: false, faqOrder: 99 },
  { title: "Where can I view my saved stations?", slug: "view-saved-stations", category: "saved-stations", summary: "Access your saved stations from the navbar.", content: "Click Saved Stations in the navbar to view all your saved stations. You can search, filter by amenity, sort by date saved or distance, and switch between grid and list views. You can also navigate directly to any saved station or view its full details.", keywords: ["saved","view","list","access"], isFaq: false, faqOrder: 99 },

  // Reviews
  { title: "How do I post a review?", slug: "how-to-post-review", category: "reviews", summary: "Share your experience at a service station.", content: "Go to the Station Reviews page from the More menu in the navbar. Click Write a Review. Search for the station you visited, select a star rating, add a title and your review text, and optionally add tags. You can post as a logged-in user or as a guest by providing your name. Click Submit Review when done.", keywords: ["review","post","write","rating"], isFaq: false, faqOrder: 99 },
  { title: "Why can't I post a review?", slug: "cannot-post-review", category: "reviews", summary: "Common reasons a review submission may fail.", content: "Reviews require a station name, a star rating between 1 and 5, a title, and review text. If you are submitting as a guest you must also provide your name. Make sure all required fields are filled in. If you are logged in and still having issues, try refreshing the page and submitting again.", keywords: ["review","error","submit","failed"], isFaq: true, faqOrder: 2 },
  { title: "How helpful votes work", slug: "helpful-votes", category: "reviews", summary: "Mark reviews as helpful to surface the best content.", content: "Each review has a Helpful button. Click it to mark a review as helpful. Logged-in users can only vote once per review. Guest users can also vote. Reviews with more helpful votes appear higher in the Most Helpful sort order, helping other travellers find the most useful reviews.", keywords: ["helpful","vote","review","upvote"], isFaq: false, faqOrder: 99 },
  { title: "How ratings are calculated", slug: "ratings-calculation", category: "reviews", summary: "Understanding the average rating system.", content: "Each station's average rating is calculated from all approved reviews submitted for that station. Ratings are on a scale of 1 to 5 stars. The average is rounded to one decimal place. Only approved reviews are included in the calculation.", keywords: ["rating","average","stars","score"], isFaq: false, faqOrder: 99 },

  // Reports
  { title: "How do I create a station report?", slug: "how-to-create-report", category: "reports", summary: "Submit real-time conditions for a service station.", content: "Go to Create Report in the navbar (you must be logged in). Search for the station you want to report on and select it. Fill in the cleanliness rating, how busy it is, parking status, and EV charger status. Add an optional comment and click Submit Report. You can also use the Bexxa voice assistant to fill in the form hands-free.", keywords: ["report","create","submit","station"], isFaq: false, faqOrder: 99 },
  { title: "What information can I include in a report?", slug: "report-fields", category: "reports", summary: "Fields available when creating a report.", content: "A station report includes: Cleanliness Rating (1–5 stars), How Busy (Quiet / Moderate / Very Busy), Parking Status (Available / Limited / Full), EV Charger Status (Working / Some Broken / Out of Order / No EV Chargers), and an optional Comment of up to 200 characters.", keywords: ["report","fields","cleanliness","parking","ev"], isFaq: true, faqOrder: 6 },
  { title: "Why was my report not submitted?", slug: "report-not-submitted", category: "reports", summary: "Troubleshooting report submission errors.", content: "Reports require you to select a station first. If you see an error, make sure you have searched for and selected a station from the dropdown. You must also be logged in — guest users cannot submit reports. If the problem persists, check your internet connection and try again.", keywords: ["report","error","failed","submit"], isFaq: false, faqOrder: 99 },
  { title: "Who can create reports?", slug: "who-can-report", category: "reports", summary: "Reports require a logged-in account.", content: "Only logged-in QuickBreak users can create station reports. Guest users are not able to submit reports. This helps maintain the quality and accountability of the information shared with the community. Create a free account to start contributing reports.", keywords: ["report","account","guest","permission"], isFaq: false, faqOrder: 99 },

  // Navigation
  { title: "How do I navigate to a station?", slug: "how-to-navigate", category: "navigation", summary: "Get directions to any service station.", content: "On the Nearby Stations page, find the station you want to visit and click the Navigate button on its card. This opens Google Maps with turn-by-turn directions from your current location to the station. Make sure your browser has permission to access your location for the most accurate directions.", keywords: ["navigate","directions","maps","google"], isFaq: false, faqOrder: 99 },
  { title: "How distance information works", slug: "distance-info", category: "navigation", summary: "How QuickBreak calculates distances to stations.", content: "QuickBreak uses your device's GPS location to calculate the straight-line distance to each nearby station. Distances are shown in kilometres (km) or metres (m) for very close stations. The actual driving distance may differ. For accurate driving directions, use the Navigate button to open Google Maps.", keywords: ["distance","km","location","gps"], isFaq: true, faqOrder: 7 },
  { title: "Can I use QuickBreak on mobile?", slug: "mobile-use", category: "navigation", summary: "QuickBreak works on all modern mobile browsers.", content: "Yes. QuickBreak is fully responsive and works on all modern mobile browsers including Chrome, Safari, and Firefox on iOS and Android. For the best experience, allow location access when prompted so the app can find stations near you. There is no separate app to download — just visit the website in your mobile browser.", keywords: ["mobile","phone","ios","android","responsive"], isFaq: true, faqOrder: 8 },
  { title: "How to filter stations by amenities", slug: "filter-by-amenities", category: "navigation", summary: "Find stations with specific facilities.", content: "On the Nearby Stations page, use the filter controls in the toolbar to narrow results. You can filter by radius (5km, 10km, 25km, 50km) to find stations within a specific distance. Station cards show amenity badges such as EV Charging and Open 24/7 so you can quickly identify stations that meet your needs.", keywords: ["filter","amenities","ev","facilities","search"], isFaq: true, faqOrder: 5 },

  // Bexxa AI Assistant
  { title: "How do I use Bexxa?", slug: "how-to-use-bexxa", category: "bexxa-assistant", summary: "Getting started with the Bexxa AI assistant.", content: "Bexxa is QuickBreak's AI assistant. You can access it from the Bexxa AI Assistant page in the More menu. Type your question in the text box or click the microphone button to speak. Bexxa can help you find stations, answer questions about facilities, and assist with creating reports. Try prompts like 'Find stations on the M25' or 'Which stations have EV charging?'", keywords: ["bexxa","ai","assistant","voice","chat"], isFaq: false, faqOrder: 99 },
  { title: "Does Bexxa work offline?", slug: "bexxa-offline", category: "bexxa-assistant", summary: "Bexxa requires an internet connection.", content: "Bexxa requires an active internet connection to process your requests and query the QuickBreak database. It does not work offline. Make sure you have a stable connection before using Bexxa, especially when driving on motorways where signal can be intermittent.", keywords: ["bexxa","offline","internet","connection"], isFaq: false, faqOrder: 99 },
  { title: "Can I use Bexxa hands-free?", slug: "bexxa-hands-free", category: "bexxa-assistant", summary: "Use voice input with Bexxa while driving.", content: "Yes. Bexxa supports voice input so you can use it hands-free. Click the microphone button on the Bexxa page or the Create Report page to activate voice input. Speak your question or report details clearly and Bexxa will process your speech. This feature uses your browser's built-in speech recognition and requires microphone permission.", keywords: ["bexxa","hands-free","voice","microphone","driving"], isFaq: true, faqOrder: 3 },
  { title: "What can I ask Bexxa?", slug: "what-to-ask-bexxa", category: "bexxa-assistant", summary: "Examples of questions and commands for Bexxa.", content: "You can ask Bexxa things like: 'Find stations on the M1', 'Which stations near me have EV charging?', 'What are the top-rated stations on the M25?', 'Find a Moto service station', 'Are there any stations with showers?'. You can also use Bexxa on the Create Report page to fill in report details by voice.", keywords: ["bexxa","ask","questions","commands","examples"], isFaq: false, faqOrder: 99 },
];

async function seedIfEmpty() {
  const count = await HelpArticle.countDocuments();
  if (count > 0) return;
  await HelpArticle.insertMany(SEED_ARTICLES);
  console.log("[HelpArticle] Seeded", SEED_ARTICLES.length, "articles");
}

// ── GET /api/help-center/page-data ────────────────────────────────────────────
exports.getPageData = async (req, res, next) => {
  try {
    await seedIfEmpty();
    const faqs = await HelpArticle.find({ isFaq: true, isPublished: true })
      .sort({ faqOrder: 1 })
      .select("title slug summary content category")
      .lean();
    res.json({
      hero: {
        badge:    "Support Center",
        title:    "Help Center",
        subtitle: "Find answers and support for using QuickBreak",
      },
      categories: CATEGORIES,
      faqs,
      cta: {
        title: "Still need help?",
        text:  "Can't find what you're looking for? Our support team is ready to assist you.",
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/help-center/categories ──────────────────────────────────────────
exports.getCategories = (req, res) => {
  res.json(CATEGORIES);
};

// ── GET /api/help-center/faqs ─────────────────────────────────────────────────
exports.getFaqs = async (req, res, next) => {
  try {
    await seedIfEmpty();
    const faqs = await HelpArticle.find({ isFaq: true, isPublished: true })
      .sort({ faqOrder: 1 })
      .select("title slug summary content category")
      .lean();
    res.json(faqs);
  } catch (err) { next(err); }
};

// ── GET /api/help-center/articles ─────────────────────────────────────────────
exports.getArticles = async (req, res, next) => {
  try {
    await seedIfEmpty();
    const { search = "", category = "", faqOnly = "", page = 1, limit = 20 } = req.query;

    const query = { isPublished: true };
    if (category.trim()) query.category = category.trim();
    if (faqOnly === "true") query.isFaq = true;

    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      query.$or = [
        { title: re }, { summary: re }, { content: re },
        { keywords: re }, { category: re },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await HelpArticle.countDocuments(query);
    const articles = await HelpArticle.find(query)
      .sort({ faqOrder: 1, createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .select("title slug category summary isFaq keywords")
      .lean();

    res.json({ articles, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

// ── GET /api/help-center/articles/:slug ───────────────────────────────────────
exports.getArticleBySlug = async (req, res, next) => {
  try {
    await seedIfEmpty();
    const article = await HelpArticle.findOne({ slug: req.params.slug, isPublished: true }).lean();
    if (!article) { res.status(404); throw new Error("Article not found"); }

    // related: same category, different slug
    const related = await HelpArticle.find({
      category: article.category,
      slug: { $ne: article.slug },
      isPublished: true,
    }).limit(4).select("title slug summary").lean();

    res.json({ ...article, related });
  } catch (err) { next(err); }
};
