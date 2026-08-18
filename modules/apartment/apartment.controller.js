const {
  getApartmentsFromDB,
  getApartmentByIdFromDB,
  createApartmentInDB,
  updateApartmentInDB,
} = require("./apartment.service");

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

const getSingleApartment = async (req, res) => {
  try {
    const apartment = await getApartmentByIdFromDB(req.params.id);
    if (!apartment) {
      return res.status(404).json({ success: false, message: "Apartment not found" });
    }
    res.json({ success: true, data: apartment });
  } catch (err) {
    console.error("GET /apartments/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch apartment details" });
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

const updateApartment = async (req, res) => {
  try {
    const apartment = await updateApartmentInDB(req.params.id, req.body);
    if (!apartment) {
      return res.status(404).json({ success: false, message: "Apartment not found" });
    }
    res.json({
      success: true,
      message: "Apartment updated successfully",
      data: apartment,
    });
  } catch (err) {
    console.error("PATCH /apartments/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to update apartment" });
  }
};

module.exports = {
  getApartments,
  getSingleApartment,
  createApartment,
  updateApartment,
};
