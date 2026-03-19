const ServiceStation = require("../models/ServiceStation");

const ALL_STATIONS = [
  // ── London / M25 area ──────────────────────────────────────────────────────
  { name:"Heston Services",          motorway:"M4",  operator:"Welcome Break", address:"Hounslow, TW5 9NB, UK",        facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[-0.4236,51.4895]} },
  { name:"South Mimms Services",     motorway:"M25", operator:"BP",            address:"South Mimms, EN6 3QQ, UK",     facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-0.2167,51.7167]} },
  { name:"Thurrock Services",        motorway:"M25", operator:"Moto",          address:"Thurrock, RM20 3LP, UK",       facilities:["fuel","food","toilets","ev","parking"],          location:{type:"Point",coordinates:[0.3167,51.4833]}  },
  { name:"Cobham Services",          motorway:"M25", operator:"Extra",         address:"Cobham, KT11 3DB, UK",         facilities:["fuel","food","toilets","ev","parking"],          location:{type:"Point",coordinates:[-0.4098,51.3184]} },
  { name:"Clacket Lane Services",    motorway:"M25", operator:"Moto",          address:"Clacket Lane, TN16 2ER, UK",  facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[0.0167,51.2833]}  },
  { name:"Toddington Services",      motorway:"M1",  operator:"Moto",          address:"Toddington, LU5 6HR, UK",     facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[-0.5167,51.9333]} },
  { name:"Birchanger Green Services",motorway:"M11", operator:"Welcome Break", address:"Birchanger, CM23 5QZ, UK",    facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[0.2333,51.8833]}  },
  // Extra London-area stations for better 5–10km coverage
  { name:"Brent Cross Services",     motorway:"A406",operator:"BP",            address:"Brent Cross, NW4 3FP, UK",    facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-0.2200,51.5760]} },
  { name:"Staples Corner Services",  motorway:"A406",operator:"Shell",         address:"Staples Corner, NW2 6LW, UK", facilities:["fuel","food","toilets"],                         location:{type:"Point",coordinates:[-0.2350,51.5580]} },
  { name:"Chiswick Services",        motorway:"M4",  operator:"Esso",          address:"Chiswick, W4 5YE, UK",        facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-0.2650,51.4940]} },
  { name:"Hammersmith Services",     motorway:"A4",  operator:"BP",            address:"Hammersmith, W6 9HB, UK",     facilities:["fuel","food","toilets"],                         location:{type:"Point",coordinates:[-0.2230,51.4930]} },
  { name:"Heathrow Gateway Services",motorway:"M4",  operator:"Moto",          address:"Heathrow, TW6 2GW, UK",       facilities:["fuel","food","toilets","ev","parking","coffee"],location:{type:"Point",coordinates:[-0.4500,51.4700]} },
  { name:"Osterley Services",        motorway:"M4",  operator:"Shell",         address:"Osterley, TW7 5NP, UK",       facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-0.3600,51.4820]} },
  { name:"Ealing Services",          motorway:"A40", operator:"BP",            address:"Ealing, W5 3HN, UK",          facilities:["fuel","food","toilets"],                         location:{type:"Point",coordinates:[-0.3050,51.5130]} },
  { name:"Wembley Services",         motorway:"A406",operator:"Esso",          address:"Wembley, HA9 0FJ, UK",        facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-0.2790,51.5560]} },
  // ── M4 corridor ───────────────────────────────────────────────────────────
  { name:"Reading Services",         motorway:"M4",  operator:"Moto",          address:"Reading, RG30 3UQ, UK",       facilities:["fuel","food","toilets","ev","parking","coffee"],location:{type:"Point",coordinates:[-0.9724,51.4502]} },
  { name:"Membury Services",         motorway:"M4",  operator:"Welcome Break", address:"Membury, RG17 7TZ, UK",       facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[-1.5333,51.5167]} },
  { name:"Chieveley Services",       motorway:"M4",  operator:"Moto",          address:"Chieveley, RG20 8XY, UK",     facilities:["fuel","food","toilets","ev","parking"],          location:{type:"Point",coordinates:[-1.2833,51.4667]} },
  { name:"Leigh Delamere Services",  motorway:"M4",  operator:"Moto",          address:"Leigh Delamere, SN14 6LB, UK",facilities:["fuel","food","toilets","parking","coffee"],     location:{type:"Point",coordinates:[-2.1833,51.5000]} },
  // ── M40 ───────────────────────────────────────────────────────────────────
  { name:"Beaconsfield Services",    motorway:"M40", operator:"Extra",         address:"Beaconsfield, HP9 2SE, UK",   facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-0.6506,51.6089]} },
  // ── M1 ────────────────────────────────────────────────────────────────────
  { name:"Leicester Forest Services",motorway:"M1",  operator:"Moto",          address:"Leicester, LE3 3GB, UK",      facilities:["fuel","food","toilets","ev","parking"],          location:{type:"Point",coordinates:[-1.2167,52.6167]} },
  { name:"Trowell Services",         motorway:"M1",  operator:"Moto",          address:"Trowell, NG9 3PL, UK",        facilities:["fuel","food","toilets","ev","parking"],          location:{type:"Point",coordinates:[-1.2833,52.9500]} },
  { name:"Woodall Services",         motorway:"M1",  operator:"Moto",          address:"Woodall, S26 7XR, UK",        facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[-1.3167,53.3667]} },
  // ── M3 ────────────────────────────────────────────────────────────────────
  { name:"Fleet Services",           motorway:"M3",  operator:"Moto",          address:"Fleet, GU51 1AA, UK",         facilities:["fuel","food","toilets","ev","parking","coffee"],location:{type:"Point",coordinates:[-0.8500,51.2833]} },
  // ── M5 ────────────────────────────────────────────────────────────────────
  { name:"Gordano Services",         motorway:"M5",  operator:"Welcome Break", address:"Gordano, BS20 7XG, UK",       facilities:["fuel","food","toilets","ev","parking"],          location:{type:"Point",coordinates:[-2.7167,51.4833]} },
  { name:"Strensham Services",       motorway:"M5",  operator:"Roadchef",      address:"Strensham, WR8 9JS, UK",      facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-2.1167,52.0833]} },
  { name:"Frankley Services",        motorway:"M5",  operator:"Welcome Break", address:"Frankley, B32 4AR, UK",       facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-2.0333,52.4000]} },
  { name:"Taunton Deane Services",   motorway:"M5",  operator:"Moto",          address:"Taunton, TA3 7PF, UK",        facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-3.0833,51.0167]} },
  { name:"Exeter Services",          motorway:"M5",  operator:"Moto",          address:"Exeter, EX5 2LL, UK",         facilities:["fuel","food","toilets","ev","parking","coffee"],location:{type:"Point",coordinates:[-3.4167,50.7333]} },
  // ── M6 ────────────────────────────────────────────────────────────────────
  { name:"Corley Services",          motorway:"M6",  operator:"Welcome Break", address:"Corley, CV7 8NR, UK",         facilities:["fuel","food","toilets","ev","parking"],          location:{type:"Point",coordinates:[-1.5500,52.4667]} },
  { name:"Hilton Park Services",     motorway:"M6",  operator:"Welcome Break", address:"Hilton Park, WV11 2AT, UK",   facilities:["fuel","food","toilets","ev","parking"],          location:{type:"Point",coordinates:[-2.0500,52.6333]} },
  { name:"Keele Services",           motorway:"M6",  operator:"Welcome Break", address:"Keele, ST5 5HG, UK",          facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[-2.2667,53.0000]} },
  { name:"Knutsford Services",       motorway:"M6",  operator:"Welcome Break", address:"Knutsford, WA16 0TL, UK",     facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[-2.3667,53.3167]} },
  { name:"Charnock Richard Services",motorway:"M6",  operator:"Welcome Break", address:"Charnock Richard, PR7 5LR, UK",facilities:["fuel","food","toilets","ev","parking"],        location:{type:"Point",coordinates:[-2.6667,53.6333]} },
  { name:"Lancaster Services",       motorway:"M6",  operator:"Welcome Break", address:"Lancaster, LA2 9DU, UK",      facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[-2.6167,54.0500]} },
  { name:"Tebay Services",           motorway:"M6",  operator:"Westmorland",   address:"Tebay, CA10 3SS, UK",         facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-2.5833,54.4333]} },
  // ── M62 / A1 ──────────────────────────────────────────────────────────────
  { name:"Hartshead Moor Services",  motorway:"M62", operator:"Moto",          address:"Hartshead Moor, HD6 4JX, UK",facilities:["fuel","food","toilets","parking","coffee"],      location:{type:"Point",coordinates:[-1.7500,53.7167]} },
  { name:"Wetherby Services",        motorway:"A1",  operator:"Moto",          address:"Wetherby, LS22 5GT, UK",      facilities:["fuel","food","toilets","parking"],               location:{type:"Point",coordinates:[-1.3833,53.9167]} },
];

exports.seedStations = async (req, res, next) => {
  try {
    const clear = req.query.clear === "true";
    if (clear) await ServiceStation.deleteMany({});

    let inserted = 0, skipped = 0;
    for (const s of ALL_STATIONS) {
      const exists = await ServiceStation.findOne({ name: s.name, motorway: s.motorway });
      if (!exists) {
        await ServiceStation.create(s);
        inserted++;
      } else {
        skipped++;
      }
    }

    const total = await ServiceStation.countDocuments();
    res.status(201).json({
      message: "Seed completed",
      inserted,
      skipped,
      totalStations: total,
    });
  } catch (err) {
    next(err);
  }
};
