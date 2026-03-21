const StationReview  = require("../models/StationReview");
const ServiceStation = require("../models/ServiceStation");

// ── seed helper (runs once if collection empty) ───────────────────────────────
const SEED_REVIEWS = [
  { stationName: "Heston Services",          brand: "Moto",          roadLabel: "M4 Motorway, Westbound",   address: "Heston, Hounslow TW5 9NA",                  rating: 4, title: "Good stop for coffee and clean toilets",    reviewText: "Really clean facilities and the Costa was great. Parking was a bit tight but overall a solid stop.",                    tags: ["Clean Toilets","Good Food","Friendly Staff"],    guestName: "Sarah M." },
  { stationName: "Beaconsfield Services",    brand: "Moto",          roadLabel: "M40 Motorway, Northbound", address: "Beaconsfield, Buckinghamshire HP9 2SF",      rating: 5, title: "Best coffee on the M40, quiet and spacious", reviewText: "Spacious car park, great food options and very clean. One of the best services on the M40.",                            tags: ["Good Food","Clean Toilets","EV Friendly"],       guestName: "James T." },
  { stationName: "Cobham Services",          brand: "Extra",         roadLabel: "M25 Motorway, Clockwise",  address: "Cobham, Surrey KT11 1JZ",                   rating: 5, title: "Excellent facilities, great for long journeys", reviewText: "Huge range of food, spotless toilets, and plenty of parking. Always my go-to on the M25.",                             tags: ["Good Food","Clean Toilets","Showers","Fuel","Parking","24/7 Open"], guestName: "Emma R." },
  { stationName: "Reading Services",         brand: "Welcome Break", roadLabel: "M4 Motorway, Eastbound",   address: "Reading, Berkshire RG2 0QB",                rating: 4, title: "Convenient stop before London, good variety of food", reviewText: "Decent food court with plenty of choice. Gets busy at peak times but staff are helpful.",                              tags: ["Good Food","EV Friendly","Parking","24/7 Open"], guestName: "David K." },
  { stationName: "South Mimms Services",     brand: "Welcome Break", roadLabel: "M25 Motorway, Clockwise",  address: "Potters Bar, Hertfordshire EN6 3QQ",         rating: 4, title: "Reliable stop on the M25, never too crowded",  reviewText: "Always a reliable stop. Clean, well-stocked shop and the burger place is decent.",                                     tags: ["Clean Toilets","Parking","24/7 Open"],           guestName: "Lisa P." },
  { stationName: "Leicester Forest East",    brand: "Extra",         roadLabel: "M1 Motorway, Northbound",  address: "Leicester, Leicestershire LE3 3GB",          rating: 5, title: "Perfect midway point for long trips up north", reviewText: "Great facilities, loads of food options and very clean. The EV charging bays are always available.",                  tags: ["EV Friendly","Good Food","Clean Toilets","Showers","Fuel","Parking"], guestName: "Tom W." },
  { stationName: "Norton Canes Services",    brand: "Roadchef",      roadLabel: "M6 Toll, Junction 17",     address: "Cannock, Staffordshire WS11 9UX",           rating: 3, title: "Average stop, does the job",                  reviewText: "Nothing special but clean enough. Limited food options compared to bigger services.",                                  tags: ["Clean Toilets","Fuel"],                          guestName: "Anna B." },
  { stationName: "Keele Services",           brand: "Welcome Break", roadLabel: "M6 Motorway, Northbound",  address: "Newcastle under Lyme, Staffordshire ST5 5HH", rating: 4, title: "Good services, friendly staff",              reviewText: "Friendly staff and clean facilities. The WHSmith is well stocked. EV charging available.",                             tags: ["EV Friendly","Friendly Staff","Clean Toilets"],  guestName: "Mark H." },
  { stationName: "Leigh Delamere Services",  brand: "Moto",          roadLabel: "M4 Motorway, Westbound",   address: "Chippenham, Wiltshire SN14 6LB",            rating: 4, title: "Great stop heading to Wales",                 reviewText: "Always clean and well maintained. Good range of food and the fuel prices are reasonable.",                             tags: ["Good Food","Clean Toilets","Fuel","24/7 Open"],  guestName: "Rachel G." },
  { stationName: "Membury Services",         brand: "Welcome Break", roadLabel: "M4 Motorway, Eastbound",   address: "Hungerford, Berkshire RG17 7TZ",            rating: 3, title: "Decent but can get very busy",                reviewText: "Good facilities but gets extremely busy on bank holidays. Parking can be a nightmare.",                                 tags: ["Good Food","EV Friendly"],                       guestName: "Chris N." },
];

async function seedIfEmpty() {
  const count = await StationReview.countDocuments();
  if (count > 0) return;
  // Assign a fake stationId so they appear in aggregations
  const docs = SEED_REVIEWS.map((r, i) => ({
    ...r,
    stationId: `seed-${i + 1}`,
    source: "seed",
  }));
  await StationReview.insertMany(docs);
  console.log("[StationReview] Seeded", docs.length, "reviews");
}

// ── GET /api/reviews ──────────────────────────────────────────────────────────
exports.getReviews = async (req, res, next) => {
  try {
    await seedIfEmpty();

    const { search = "", brand = "", rating = "", tag = "", sort = "most_recent", page = 1, limit = 10 } = req.query;

    const query = { isApproved: true };

    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      query.$or = [{ stationName: re }, { brand: re }, { title: re }, { reviewText: re }];
    }
    if (brand.trim())  query.brand  = new RegExp(brand.trim(), "i");
    if (rating)        query.rating = Number(rating);
    if (tag.trim())    query.tags   = tag.trim();

    const sortMap = {
      most_recent:    { createdAt: -1 },
      highest_rated:  { rating: -1, createdAt: -1 },
      lowest_rated:   { rating: 1,  createdAt: -1 },
      most_helpful:   { helpfulCount: -1, createdAt: -1 },
    };
    const sortObj = sortMap[sort] || sortMap.most_recent;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await StationReview.countDocuments(query);
    const reviews = await StationReview.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "name")
      .lean();

    res.json({ reviews, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

// ── GET /api/reviews/stats ────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    await seedIfEmpty();

    const [agg] = await StationReview.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: null,
          totalReviews:  { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    // Most reviewed brand
    const brandAgg = await StationReview.aggregate([
      { $match: { isApproved: true, brand: { $ne: "" } } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    // Top rated stations (min 1 review, sorted by avg rating then count)
    const topStations = await StationReview.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id:         "$stationId",
          stationName: { $first: "$stationName" },
          brand:       { $first: "$brand" },
          avgRating:   { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalReviews:      agg?.totalReviews  || 0,
      averageRating:     agg ? parseFloat(agg.averageRating.toFixed(1)) : 0,
      mostReviewedBrand: brandAgg[0]?._id   || "—",
      topRatedStations:  topStations.map(s => ({
        stationId:   s._id,
        stationName: s.stationName,
        brand:       s.brand,
        avgRating:   parseFloat(s.avgRating.toFixed(1)),
        reviewCount: s.reviewCount,
      })),
    });
  } catch (err) { next(err); }
};

// ── POST /api/reviews ─────────────────────────────────────────────────────────
exports.createReview = async (req, res, next) => {
  try {
    const { stationId, stationName, brand, roadLabel, address, rating, title, reviewText, tags, guestName } = req.body;

    if (!stationId || !stationName) { res.status(400); throw new Error("stationId and stationName are required"); }
    if (!rating || rating < 1 || rating > 5) { res.status(400); throw new Error("rating must be between 1 and 5"); }
    if (!title?.trim())      { res.status(400); throw new Error("title is required"); }
    if (!reviewText?.trim()) { res.status(400); throw new Error("reviewText is required"); }

    // Require login or guestName
    if (!req.user && !guestName?.trim()) {
      res.status(401);
      throw new Error("Please log in or provide a name to submit a review");
    }

    const review = await StationReview.create({
      user:       req.user?._id || null,
      guestName:  req.user ? "" : (guestName?.trim() || ""),
      stationId, stationName,
      brand:      brand      || "",
      roadLabel:  roadLabel  || "",
      address:    address    || "",
      rating:     Number(rating),
      title:      title.trim(),
      reviewText: reviewText.trim(),
      tags:       Array.isArray(tags) ? tags : [],
      source:     "reviews-page",
    });

    const populated = await StationReview.findById(review._id).populate("user", "name").lean();
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

// ── POST /api/reviews/:reviewId/helpful ───────────────────────────────────────
exports.markHelpful = async (req, res, next) => {
  try {
    const review = await StationReview.findById(req.params.reviewId);
    if (!review) { res.status(404); throw new Error("Review not found"); }

    if (req.user) {
      const uid = req.user._id;
      const alreadyVoted = review.helpfulBy.some(id => id.equals(uid));
      if (alreadyVoted) {
        return res.json({ helpfulCount: review.helpfulCount, alreadyVoted: true });
      }
      review.helpfulBy.push(uid);
      review.helpfulCount += 1;
    } else {
      // Guest: just increment (no duplicate prevention for guests)
      review.helpfulCount += 1;
    }

    await review.save();
    res.json({ helpfulCount: review.helpfulCount, alreadyVoted: false });
  } catch (err) { next(err); }
};

// ── GET /api/reviews/station/:stationId ───────────────────────────────────────
exports.getByStation = async (req, res, next) => {
  try {
    const reviews = await StationReview.find({ stationId: req.params.stationId, isApproved: true })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .lean();
    res.json(reviews);
  } catch (err) { next(err); }
};

// ── GET /api/reviews/search-stations ─────────────────────────────────────────
// Returns distinct station names for the review form autocomplete
exports.searchStations = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const query = q ? { name: new RegExp(q, "i") } : {};
    const stations = await ServiceStation.find(query)
      .limit(10)
      .select("_id name operator motorway address")
      .lean();
    res.json(stations);
  } catch (err) { next(err); }
};
