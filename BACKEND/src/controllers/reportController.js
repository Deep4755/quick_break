const Report = require("../models/Report");
const ServiceStation = require("../models/ServiceStation");

// Helper: recalculate avgCleanliness from last 20 reports
const calculateAvgCleanliness = (reports) => {
  if (!reports.length) return 0;
  const sum = reports.reduce((acc, r) => acc + (r.cleanlinessRating || 0), 0);
  return Number((sum / reports.length).toFixed(1));
};

/**
 * POST /api/reports
 * Body: { stationId, cleanlinessRating, busyLevel, parkingStatus, evStatus, comment }
 * req.user is attached by protect middleware
 */
exports.createReport = async (req, res, next) => {
  try {
    const {
      stationId,
      cleanlinessRating,
      busyLevel,
      parkingStatus,
      evStatus,
      comment,
    } = req.body;

    // --- Validation ---
    if (!stationId) {
      res.status(400);
      throw new Error("stationId is required");
    }
    if (!cleanlinessRating || cleanlinessRating < 1 || cleanlinessRating > 5) {
      res.status(400);
      throw new Error("cleanlinessRating is required (1–5)");
    }
    if (!parkingStatus) {
      res.status(400);
      throw new Error("parkingStatus is required");
    }

    // --- Check station exists ---
    const station = await ServiceStation.findById(stationId);
    if (!station) {
      res.status(404);
      throw new Error("Service station not found for this stationId");
    }

    // --- Create report (attach userId if logged in) ---
    const report = await Report.create({
      stationId,
      userId: req.user?._id || null,
      cleanlinessRating: Number(cleanlinessRating),
      busyLevel: busyLevel || "Medium",
      parkingStatus,
      evStatus: evStatus || "NoEV",
      comment: comment || "",
    });

    // --- Update station aggregates ---
    const latestReports = await Report.find({ stationId })
      .sort({ createdAt: -1 })
      .limit(20);

    station.avgCleanliness = calculateAvgCleanliness(latestReports);
    station.lastStatus = {
      parkingStatus: parkingStatus ?? null,
      evStatus: evStatus ?? null,
      updatedAt: new Date(),
    };
    await station.save();

    console.log(`[createReport] Report saved for station: ${station.name} by user: ${req.user?._id || "anonymous"}`);

    res.status(201).json({
      message: "Report submitted successfully",
      report,
      stationUpdated: {
        stationId: station._id,
        avgCleanliness: station.avgCleanliness,
        lastStatus: station.lastStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/station/:stationId
 */
exports.getReportsByStation = async (req, res, next) => {
  try {
    const { stationId } = req.params;

    const station = await ServiceStation.findById(stationId);
    if (!station) {
      res.status(404);
      throw new Error("Service station not found");
    }

    const reports = await Report.find({ stationId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ stationId, count: reports.length, reports });
  } catch (err) {
    next(err);
  }
};
