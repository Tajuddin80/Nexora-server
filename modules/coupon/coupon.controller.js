const {
  validateCouponInDB,
  getAllCouponsFromDB,
  addCouponToDB,
  updateCouponInDB,
  deleteCouponFromDB,
} = require("./coupon.service");

const validateCoupon = async (req, res) => {
  try {
    const result = await validateCouponInDB(req.body.code);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ valid: false, message: err.message });
    }
    console.error("POST /coupons/validate error:", err);
    res.status(500).json({ valid: false, message: "Server error" });
  }
};

const getCoupons = async (req, res) => {
  try {
    const coupons = await getAllCouponsFromDB();
    res.send(coupons);
  } catch (err) {
    console.error("GET /coupons error:", err);
    res.status(500).send({ message: "Server error" });
  }
};

const createCoupon = async (req, res) => {
  try {
    await addCouponToDB(req.body);
    res.json({ success: true, message: "Coupon added successfully" });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("POST /coupons error:", err);
    res.status(500).send({ message: "Server error" });
  }
};

const updateCoupon = async (req, res) => {
  try {
    await updateCouponInDB(req.params.id, req.body);
    res.json({ success: true, message: "Coupon updated successfully" });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("PUT /coupons/:id error:", err);
    res.status(500).send({ message: "Server error" });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await deleteCouponFromDB(req.params.id);
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("DELETE /coupons/:id error:", err);
    res.status(500).send({ message: "Server error" });
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
