const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmerController");

router.get("/", farmerController.getFarmers);
router.post("/", farmerController.createFarmer);

module.exports = router;
