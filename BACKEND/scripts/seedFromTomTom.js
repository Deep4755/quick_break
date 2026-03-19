/**
 * seedFromTomTom.js — populates quickbreak.servicestations from TomTom
 * Run from project root: node BACKEND/scripts/seedFromTomTom.js
 */
// Works whether you run from project root OR from BACKEND folder
const path = require("path");
const envPath = path.join(__dirname, "../.env");
require("dotenv").config({ path: envPath });

const mongoose = require("mongoose");
const axios    = require("axios");

// Inline schema — avoids model caching issues when run standalone
const stationSchema = new mongoose.Schema({
  tomtomId:   { type: String, unique: true, sparse: true },
  name:       { type: String, required: true },
  motorway:   String,
  operator:   String,
  address:    String,
  facilities: [String],
  location: {
    type:        { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
}, { timestamps: true });
stationSchema.index({ location: "2dsphere" });
const Station = mongoose.model("ServiceStation", stationSchema);

// UK motorway hotspots
const LOCATIONS = [
  { label: "M4 Heston",           lat: 51.4895, lng: -0.4236 },
  { label: "M4 Reading",          lat: 51.4502, lng: -0.9724 },
  { label: "M25 Cobham",          lat: 51.3184, lng: -0.4098 },
  { label: "M40 Beaconsfield",    lat: 51.6089, lng: -0.6506 },
  { label: "M1 Toddington",       lat: 51.9333, lng: -0.5167 },
  { label: "M6 Corley",           lat: 52.4667, lng: -1.5500 },
  { label: "M6 Keele",            lat: 53.0000, lng: -2.2667 },
  { label: "M1 Leicester Forest", lat: 52.6167, lng: -1.2167 },
  { label: "M5 Strensham",        lat: 52.0833, lng: -2.1167 },
  { label: "M3 Fleet",            lat: 51.2833, lng: -0.8500 },
  { label: "M11 Birchanger",      lat: 51.8833, lng:  0.2333 },
  { label: "M62 Hartshead Moor",  lat: 53.7167, lng: -1.7500 },
];

const extractMotorway = (text) => {
  const m = String(text || "").match(/\bM\d{1,2}\b/i);
  return m ? m[0].toUpperCase() : null;
};

const guessOperator = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("shell"))         return "Shell";
  if (n.includes("bp"))            return "BP";
  if (n.includes("esso"))          return "Esso";
  if (n.includes("tesco"))         return "Tesco";
  if (n.includes("moto"))          return "Moto";
  if (n.includes("welcome break")) return "Welcome Break";
  if (n.includes("roadchef"))      return "Roadchef";
  if (n.includes("extra"))         return "Extra";
  return null;
};

const extractFacilities = (r) => {
  const raw = [];
  if (Array.isArray(r.poi?.categories))      raw.push(...r.poi.categories);
  if (Array.isArray(r.poi?.categorySet))     raw.push(...r.poi.categorySet);
  if (Array.isArray(r.poi?.classifications)) raw.push(...r.poi.classifications.map(c => c.name || c));
  if (r.poi?.category) raw.push(r.poi.category);
  const txt  = raw.join(" ").toLowerCase();
  const cats = [];
  if (/fuel|petrol|gas/.test(txt))              cats.push("fuel");
  if (/restaurant|cafe|food/.test(txt))         cats.push("food");
  if (/toilet|restroom/.test(txt))              cats.push("toilets");
  if (/parking/.test(txt))                      cats.push("parking");
  if (/electric|ev|charging|charger/.test(txt)) cats.push("ev");
  const brand = r.poi?.brands?.[0]?.name || "";
  if (["Shell","BP","Esso","Texaco","JET","Total"].includes(brand) && !cats.includes("fuel")) {
    cats.push("fuel");
  }
  return [...new Set(cats)];
};

async function fetchTomTom(lat, lng) {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY missing in .env");
  const res = await axios.get(
    "https://api.tomtom.com/search/2/search/service%20station.json",
    { params: { key, lat, lon: lng, radius: 8000, limit: 20, language: "en-GB" }, timeout: 12000 }
  );
  return res.data?.results || [];
}

async function run() {
  console.log("\n🔌 Connecting to Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected — database:", mongoose.connection.db.databaseName);

  let inserted = 0, updated = 0, skipped = 0;

  // ── Hardcoded fallback stations (always inserted first) ───────────────────
  const FALLBACK = [
    { name:"Heston Services",         motorway:"M4",  operator:"Welcome Break", address:"Hounslow, TW5 9NB, UK",          facilities:["fuel","food","toilets","parking","coffee"],       location:{type:"Point",coordinates:[-0.4236,51.4895]} },
    { name:"Reading Services",         motorway:"M4",  operator:"Moto",          address:"Reading, RG30 3UQ, UK",          facilities:["fuel","food","toilets","ev","parking","coffee"],  location:{type:"Point",coordinates:[-0.9724,51.4502]} },
    { name:"Beaconsfield Services",    motorway:"M40", operator:"Extra",         address:"Beaconsfield, HP9 2SE, UK",      facilities:["fuel","food","toilets","parking"],                location:{type:"Point",coordinates:[-0.6506,51.6089]} },
    { name:"Cobham Services",          motorway:"M25", operator:"Extra",         address:"Cobham, KT11 3DB, UK",           facilities:["fuel","food","toilets","ev","parking"],           location:{type:"Point",coordinates:[-0.4098,51.3184]} },
    { name:"Toddington Services",      motorway:"M1",  operator:"Moto",          address:"Toddington, LU5 6HR, UK",        facilities:["fuel","food","toilets","parking","coffee"],       location:{type:"Point",coordinates:[-0.5167,51.9333]} },
    { name:"Corley Services",          motorway:"M6",  operator:"Welcome Break", address:"Corley, CV7 8NR, UK",            facilities:["fuel","food","toilets","ev","parking"],           location:{type:"Point",coordinates:[-1.5500,52.4667]} },
    { name:"Keele Services",           motorway:"M6",  operator:"Welcome Break", address:"Keele, ST5 5HG, UK",             facilities:["fuel","food","toilets","parking","coffee"],       location:{type:"Point",coordinates:[-2.2667,53.0000]} },
    { name:"Leicester Forest Services",motorway:"M1",  operator:"Moto",          address:"Leicester, LE3 3GB, UK",         facilities:["fuel","food","toilets","ev","parking"],           location:{type:"Point",coordinates:[-1.2167,52.6167]} },
    { name:"Strensham Services",       motorway:"M5",  operator:"Roadchef",      address:"Strensham, WR8 9JS, UK",         facilities:["fuel","food","toilets","parking"],                location:{type:"Point",coordinates:[-2.1167,52.0833]} },
    { name:"Fleet Services",           motorway:"M3",  operator:"Moto",          address:"Fleet, GU51 1AA, UK",            facilities:["fuel","food","toilets","ev","parking","coffee"], location:{type:"Point",coordinates:[-0.8500,51.2833]} },
    { name:"Birchanger Green Services",motorway:"M11", operator:"Welcome Break", address:"Birchanger, CM23 5QZ, UK",       facilities:["fuel","food","toilets","parking"],                location:{type:"Point",coordinates:[0.2333,51.8833]}  },
    { name:"Hartshead Moor Services",  motorway:"M62", operator:"Moto",          address:"Hartshead Moor, HD6 4JX, UK",   facilities:["fuel","food","toilets","parking","coffee"],       location:{type:"Point",coordinates:[-1.7500,53.7167]} },
    { name:"Trowell Services",         motorway:"M1",  operator:"Moto",          address:"Trowell, NG9 3PL, UK",           facilities:["fuel","food","toilets","ev","parking"],           location:{type:"Point",coordinates:[-1.2833,52.9500]} },
    { name:"Woodall Services",         motorway:"M1",  operator:"Moto",          address:"Woodall, S26 7XR, UK",           facilities:["fuel","food","toilets","parking","coffee"],       location:{type:"Point",coordinates:[-1.3167,53.3667]} },
    { name:"Wetherby Services",        motorway:"A1",  operator:"Moto",          address:"Wetherby, LS22 5GT, UK",         facilities:["fuel","food","toilets","parking"],                location:{type:"Point",coordinates:[-1.3833,53.9167]} },
    { name:"Scotch Corner Services",   motorway:"A1",  operator:"Moto",          address:"Scotch Corner, DL10 6NR, UK",   facilities:["fuel","food","toilets","parking"],                location:{type:"Point",coordinates:[-1.7000,54.4167]} },
    { name:"Washington Services",      motorway:"A1",  operator:"Moto",          address:"Washington, NE38 8QA, UK",       facilities:["fuel","food","toilets","ev","parking"],           location:{type:"Point",coordinates:[-1.5333,54.9000]} },
    { name:"Clacket Lane Services",    motorway:"M25", operator:"Moto",          address:"Clacket Lane, TN16 2ER, UK",    facilities:["fuel","food","toilets","parking","coffee"],       location:{type:"Point",coordinates:[0.0167,51.2833]}  },
    { name:"South Mimms Services",     motorway:"M25", operator:"BP",            address:"South Mimms, EN6 3QQ, UK",       facilities:["fuel","food","toilets","parking"],                location:{type:"Point",coordinates:[-0.2167,51.7167]} },
    { name:"Thurrock Services",        motorway:"M25", operator:"Moto",          address:"Thurrock, RM20 3LP, UK",         facilities:["fuel","food","toilets","ev","parking"],           location:{type:"Point",coordinates:[0.3167,51.4833]}  },
  ];

  console.log(`\n📦 Inserting ${FALLBACK.length} hardcoded stations...`);
  for (const s of FALLBACK) {
    try {
      await Station.findOneAndUpdate(
        { name: s.name, motorway: s.motorway },
        { $set: s },
        { upsert: true, setDefaultsOnInsert: true }
      );
      inserted++;
      console.log(`   + ${s.name}`);
    } catch(e) {
      if (e.code === 11000) { skipped++; } else { console.log(`   ⚠️  ${s.name}: ${e.message}`); skipped++; }
    }
  }

  // ── TomTom live fetch (bonus — skips gracefully if key is invalid) ─────────
  const tomtomKey = process.env.TOMTOM_API_KEY;
  if (!tomtomKey || tomtomKey === "PASTE_YOUR_NEW_KEY_HERE") {
    console.log("\n⚠️  No valid TOMTOM_API_KEY — skipping live fetch (hardcoded stations still inserted above)");
  } else {
    console.log("\n🌐 Fetching live data from TomTom...");
    for (const loc of LOCATIONS) {
      process.stdout.write(`📍 ${loc.label} ... `);
      let results;
      try {
        results = await fetchTomTom(loc.lat, loc.lng);
        process.stdout.write(`${results.length} results\n`);
      } catch (e) {
        console.log(`❌ ${e.response?.status || e.message} — skipping`);
        continue;
      }

      for (const r of results) {
        const tomtomId = r.id;
        if (!tomtomId) { skipped++; continue; }
        const coords = r.position ? [r.position.lon, r.position.lat] : null;
        if (!coords)  { skipped++; continue; }
        const name      = r.poi?.name || r.address?.freeformAddress || "Service Station";
        const address   = r.address?.freeformAddress || null;
        const doc = {
          tomtomId, name, address,
          motorway:   extractMotorway(address),
          operator:   r.poi?.brands?.[0]?.name || guessOperator(name) || null,
          facilities: extractFacilities(r),
          location:   { type: "Point", coordinates: coords },
        };
        try {
          const before = await Station.findOne({ tomtomId });
          await Station.findOneAndUpdate({ tomtomId }, { $set: doc }, { upsert: true, setDefaultsOnInsert: true });
          if (before) { updated++; } else { inserted++; console.log(`   + ${name}`); }
        } catch (e) {
          if (e.code === 11000) { skipped++; } else { console.log(`   ⚠️  ${name}: ${e.message}`); skipped++; }
        }
      }
      await new Promise(r => setTimeout(r, 700));
    }
  }

  const total = await Station.countDocuments();
  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Seed complete!`);
  console.log(`   Inserted : ${inserted}`);
  console.log(`   Updated  : ${updated}`);
  console.log(`   Skipped  : ${skipped}`);
  console.log(`   TOTAL in Atlas servicestations: ${total}`);
  console.log("─────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
