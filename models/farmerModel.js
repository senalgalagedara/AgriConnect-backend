const pool = require("../db");

const Farmer = {
  getAll: () => pool.query("SELECT * FROM farmer"),
  
  create: ({ farmer_username, fname, lname, faddress, femail, fpw, farmer_phone, farmer_nic }) => {
    return pool.query(
      `INSERT INTO farmer (farmer_username, fname, lname, faddress, femail, fpw, farmer_phone, farmer_nic)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [farmer_username, fname, lname, faddress, femail, fpw, farmer_phone, farmer_nic]
    );
  }
};

module.exports = Farmer;
