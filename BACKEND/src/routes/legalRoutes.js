const express = require("express");
const router  = express.Router();
const { getDocument } = require("../controllers/legalController");

router.get("/:slug", getDocument);

module.exports = router;
