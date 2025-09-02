const Farmer = require("../models/farmerModel");

exports.getFarmers = async (req, res) => {
  try {
    const result = await Farmer.getAll();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createFarmer = async (req, res) => {
  try {
    const result = await Farmer.create(req.body);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
