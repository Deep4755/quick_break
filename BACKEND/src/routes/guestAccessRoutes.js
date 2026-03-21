const express = require("express");
const router  = express.Router();
const { getPageData, startSession, getSession, endSession } = require("../controllers/guestAccessController");

router.get("/page-data", getPageData);
router.get("/session",   getSession);
router.post("/start",    startSession);
router.post("/end",      endSession);

module.exports = router;
