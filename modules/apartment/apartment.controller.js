const { getApartmentsFromDB } = require("./apartment.service");

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

module.exports = {
  getApartments,
};
