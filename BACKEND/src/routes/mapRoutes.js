const express = require("express");
const router = express.Router();

const { directions, reverse, forward } = require("../controllers/mapController");

router.get("/directions", directions);
router.get("/reverse", reverse);
router.get("/forward", forward);

module.exports = router;
