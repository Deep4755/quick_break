const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getPageData, createMessage } = require("../controllers/contactController");

router.get("/page-data",  getPageData);
router.post("/messages",  protect, createMessage); // protect allows anonymous (req.user = null)

module.exports = router;
