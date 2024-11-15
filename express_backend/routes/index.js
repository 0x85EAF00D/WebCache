// routes/index.js
const express = require("express");
const router = express.Router();
const SaveController = require("../controllers/saveController");
const LoadController = require("../controllers/loadController");

router.get("/api/saved-page", LoadController.getSavedPage);
router.get("/api/get-links", LoadController.getLinks);
router.post("/api/save-link", SaveController.saveLink);

module.exports = router;
