const ServiceStation = require("../models/ServiceStation");

const demoStations = [
  {
    name: "Heston Services",
    motorway: "M4",
    operator: "Welcome Break",
    address: "Hounslow, UK",
    facilities: ["fuel", "food", "toilets", "parking"],
    location: { type: "Point", coordinates: [-0.4236, 51.4895] },
  },
  {
    name: "Reading Services",
    motorway: "M4",
    operator: "Moto",
    address: "Reading, UK",
    facilities: ["fuel", "food", "toilets", "ev", "parking", "coffee"],
    location: { type: "Point", coordinates: [-0.9724, 51.4502] },
  },
  {
    name: "Beaconsfield Services",
    motorway: "M40",
    operator: "Extra",
    address: "Beaconsfield, UK",
    facilities: ["fuel", "food", "toilets", "parking"],
    location: { type: "Point", coordinates: [-0.6506, 51.6089] },
  },
  {
    name: "Cobham Services",
    motorway: "M25",
    operator: "Extra",
    address: "Surrey, UK",
    facilities: ["fuel", "food", "toilets", "ev", "parking"],
    location: { type: "Point", coordinates: [-0.4098, 51.3184] },
  },
];

exports.seedStations = async (req, res, next) => {
  try {
    // optional: clear existing
    const clear = req.query.clear === "true";
    if (clear) {
      await ServiceStation.deleteMany({});
    }

    // avoid duplicates by name + motorway
    for (const s of demoStations) {
      const exists = await ServiceStation.findOne({ name: s.name, motorway: s.motorway });
      if (!exists) {
        await ServiceStation.create(s);
      }
    }

    const count = await ServiceStation.countDocuments();
    res.status(201).json({ message: "Seed completed", totalStations: count });
  } catch (err) {
    next(err);
  }
};
