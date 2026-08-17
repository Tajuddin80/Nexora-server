const {
  createPaymentIntentService,
  recordRentPaymentInDB,
  getRentPaymentsForUserFromDB,
  patchRentPaymentStatusInDB,
} = require("./rentPayment.service");

const createPaymentIntent = async (req, res) => {
  try {
    const clientSecret = await createPaymentIntentService(req.body);
    res.send({ clientSecret });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("Payment Intent Error:", err);
    res.status(500).send({ message: "Failed to create payment intent" });
  }
};

const postRentPayment = async (req, res) => {
  try {
    await recordRentPaymentInDB(req.body);
    res.json({ success: true, message: "Payment recorded successfully" });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("POST /rent-payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getRentPaymentsForUser = async (req, res) => {
  try {
    const rents = await getRentPaymentsForUserFromDB(req.params.email, req.query.status);
    res.json(rents);
  } catch (err) {
    console.error("GET /rent-payments/:email error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const patchRentPayment = async (req, res) => {
  try {
    await patchRentPaymentStatusInDB(req.params.id, req.body.status, req.body.transactionId);
    res.json({
      success: true,
      message: "Rent marked as paid and user rentHistory updated",
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("PATCH /rent-payments/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createPaymentIntent,
  postRentPayment,
  getRentPaymentsForUser,
  patchRentPayment,
};
