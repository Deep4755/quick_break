const mongoose = require("mongoose");

const bexxaContentSchema = new mongoose.Schema({
  heroBadge:    { type: String, default: "AI-Powered Assistant" },
  heroTitle:    { type: String, default: "Meet Bexxa" },
  heroSubtitle: { type: String, default: "Your smart travel assistant for motorway service stations. Ask questions, find stations, and plan your journey—all with your voice." },
  isOnline:     { type: Boolean, default: true },
  suggestedPrompts: {
    type: [String],
    default: [
      "Find the nearest Shell station",
      "Show stations with EV charging",
      "What's at junction 15A?",
      "Stations open 24/7 near me",
    ],
  },
  features: {
    type: [{ title: String, description: String, iconKey: String }],
    default: [
      { title: "Voice Search",             description: "Hands-free station finding while driving. Just say what you need.",                    iconKey: "mic" },
      { title: "Station Recommendations",  description: "Smart suggestions based on your location and preferences.",                           iconKey: "map" },
      { title: "Amenity Awareness",        description: "Instantly find stations with specific facilities like EV charging or showers.",        iconKey: "bolt" },
      { title: "Faster Journey Planning",  description: "Get quick answers about upcoming motorway services.",                                  iconKey: "route" },
    ],
  },
  steps: {
    type: [{ stepNumber: String, title: String, description: String }],
    default: [
      { stepNumber: "01", title: "Activate Bexxa",      description: "Tap the microphone button or say 'Hey Bexxa' to start." },
      { stepNumber: "02", title: "Ask Your Question",   description: "Speak naturally about what you need — stations, amenities, or directions." },
      { stepNumber: "03", title: "Get Instant Results", description: "Bexxa finds the best matches and displays them clearly on your map." },
      { stepNumber: "04", title: "Navigate & Go",       description: "Choose your station and start navigation with one tap." },
    ],
  },
  faqs: {
    type: [{ question: String, answer: String }],
    default: [
      { question: "What can I ask Bexxa?",          answer: "You can ask Bexxa to find nearby stations, filter by amenities like EV charging or fuel, look up specific junctions, or find stations open 24/7." },
      { question: "Does Bexxa work offline?",        answer: "Bexxa requires an internet connection to search live station data. However, your saved stations are accessible offline." },
      { question: "Is Bexxa free to use?",           answer: "Yes, Bexxa is completely free for all QuickBreak users, including guest users." },
      { question: "Can I use Bexxa while driving?",  answer: "Bexxa is designed with voice-first interaction so you can use it hands-free. Always ensure it is safe and legal to use your device while driving." },
    ],
  },
  ctaTitle: { type: String, default: "Ready to try Bexxa?" },
  ctaText:  { type: String, default: "Start exploring motorway service stations with your AI assistant today." },
}, { timestamps: true });

module.exports = mongoose.model("BexxaContent", bexxaContentSchema);
