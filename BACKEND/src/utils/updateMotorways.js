require("dotenv").config();
const mongoose = require("mongoose");
const ServiceStation = require("../models/ServiceStation");
// reverseGeocode is provided by Mapbox, not TomTom
const { reverseGeocode } = require("../services/mapboxService");

const extractMotorway = (text = "") => {
  const m = String(text).match(/\bM\d{1,2}\b/i);
  return m ? m[0].toUpperCase() : null;
};

async function run() {
  const uri = process.env.MONGO_URL || process.env.MONGO_URI;
  if (!uri) { console.error("❌ MONGO_URL not set"); process.exit(1); }
  await mongoose.connect(uri);
  console.log("✅ Mongo connected");

  const stations = await ServiceStation.find({
    motorway: { $in: ["Unknown", "Not provided by TomTom"] },
  }).limit(80); // start small

  console.log("Stations to update:", stations.length);

  for (const st of stations) {
    const [lng, lat] = st.location.coordinates;

    try {
      const rg = await reverseGeocode({ lat, lng });
      const txt =
        rg?.addresses?.[0]?.address?.streetName ||
        rg?.addresses?.[0]?.address?.freeformAddress ||
        "";

      const motorway = extractMotorway(txt);

      if (motorway) {
        st.motorway = motorway;
        await st.save();
        console.log("✅ Updated", st.name, "->", motorway);
      } else {
        console.log("⚠️ No motorway found for", st.name);
      }
    } catch (e) {
      console.log("❌ Reverse failed for", st.name);
    }

    // small delay so we don’t hit rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("✅ Done");
  process.exit(0);
}

run();