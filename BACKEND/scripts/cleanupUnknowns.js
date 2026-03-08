require("dotenv").config();
const mongoose = require("mongoose");
const ServiceStation = require("../src/models/ServiceStation");

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set in env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB");

  const cursor = ServiceStation.find().cursor();
  let updated = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const upd = {};

    if (doc.motorway === "Unknown") upd.motorway = null;
    if (doc.address === "" || doc.address === "Unknown") upd.address = null;
    if (doc.operator === "Unknown") upd.operator = null;

    if (doc.lastStatus) {
      const ls = {};
      if (doc.lastStatus.parkingStatus === "Unknown") ls.parkingStatus = null;
      if (doc.lastStatus.evStatus === "Unknown") ls.evStatus = null;
      if (Object.keys(ls).length) upd.lastStatus = { ...doc.lastStatus, ...ls };
    }

    if (Object.keys(upd).length) {
      await ServiceStation.updateOne({ _id: doc._id }, { $set: upd });
      updated++;
      console.log(`Updated ${doc._id}`);
    }
  }

  console.log(`Done. Documents updated: ${updated}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
