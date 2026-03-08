const Report = require("../models/Report");
const ServiceStation = require("../models/ServiceStation");

/**
 * Helper: calculate average cleanliness from last N reports
 */
const calculateAvgCleanliness = (reports) => {
  if (!reports.length) return 0;
  const sum = reports.reduce((acc, r) => acc + (r.cleanlinessRating || 0), 0);
  return Number((sum / reports.length).toFixed(1)); // 1 decimal
};

/**
 * POST /api/reports
 * Create a report and update station aggregates (avgCleanliness + lastStatus)
 * Body:
 * {
 *   stationId,
 *   cleanlinessRating,
 *   busyLevel,
 *   parkingStatus,
 *   evStatus,
 *   comment
 * }
 */
exports.createReport = async (req, res, next) => {
  try {
    const { stationId, cleanlinessRating, busyLevel, parkingStatus, evStatus, comment } = req.body;

    // 1) Basic validation
    if (!stationId) {
      res.status(400);
      throw new Error("stationId is required");
    }
    if (!cleanlinessRating) {
      res.status(400);
      throw new Error("cleanlinessRating is required (1-5)");
    }
    if (!parkingStatus) {
      res.status(400);
      throw new Error("parkingStatus is required");
    }

    // 2) Check station exists (relation check)
    const station = await ServiceStation.findById(stationId);
    if (!station) {
      res.status(404);
      throw new Error("Service station not found for this stationId");
    }

    // 3) Create report
    const report = await Report.create({
      stationId,
      cleanlinessRating,
      busyLevel,
      parkingStatus,
      evStatus,
      comment,
    });

    // 4) Update station aggregates (simple demo logic)
    // Fetch last 20 reports for this station
    const latestReports = await Report.find({ stationId })
      .sort({ createdAt: -1 })
      .limit(20);

    const avgCleanliness = calculateAvgCleanliness(latestReports);

    // Update station with latest status + avg
    station.avgCleanliness = avgCleanliness;
    station.lastStatus = {
      parkingStatus: parkingStatus ?? null,
      evStatus: evStatus ?? null,
      updatedAt: new Date(),
    };

    await station.save();

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
 * Get reports for a station
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
