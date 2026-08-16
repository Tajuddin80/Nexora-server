const {
  createAgreementInDB,
  getAgreementsByStatusFromDB,
  updateAgreementStatusInDB,
  getUserAgreementsFromDB,
} = require("./agreement.service");

const createAgreement = async (req, res) => {
  try {
    await createAgreementInDB(req.body);
    res.json({ success: true, message: "Agreement request submitted" });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("POST /agreements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAgreements = async (req, res) => {
  try {
    const agreements = await getAgreementsByStatusFromDB(req.query.status);
    res.json(agreements);
  } catch (err) {
    console.error("GET /agreements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateAgreement = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, userEmail } = req.body;
    const newStatus = await updateAgreementStatusInDB(id, action, userEmail);
    res.json({ success: true, message: `Agreement ${newStatus}` });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("PATCH /agreements/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserAgreements = async (req, res) => {
  try {
    const result = await getUserAgreementsFromDB(req.params.email, req.query.status);
    res.json(result);
  } catch (err) {
    console.error("GET /agreements/user/:email error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createAgreement,
  getAgreements,
  updateAgreement,
  getUserAgreements,
};
