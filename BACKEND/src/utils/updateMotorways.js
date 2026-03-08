require("dotenv").config();
const mongoose = require("mongoose");
const ServiceStation = require("../models/ServiceStation");
const { reverseGeocode } = require("../services/tomtomService");

const extractMotorway = (text = "") => {
  const m = String(text).match(/\bM\d{1,2}\b/i);
  return m ? m[0].toUpperCase() : null;
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
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