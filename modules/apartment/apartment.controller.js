const { getApartmentsFromDB, createApartmentInDB } = require("./apartment.service");

const getApartments = async (req, res) => {
  try {
    const result = await getApartmentsFromDB(req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("GET /apartments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createApartment = async (req, res) => {
  try {
    const apartment = await createApartmentInDB(req.body, req.decoded?.email);
    res.status(201).json({
      success: true,
      message: "Apartment created successfully",
      data: apartment,
    });
  } catch (err) {
    console.error("POST /apartments error:", err);
    res.status(500).json({ success: false, message: "Failed to create apartment" });
  }
};

module.exports = {
  getApartments,
  createApartment,
};
