const mongoose = require("mongoose");
const Coupon = require("../../models/Coupon");

const validateCouponInDB = async (code) => {
  if (!code) {
    throw { status: 400, message: "Coupon code required" };
  }

  const coupon = await Coupon.findOne({ code: code.trim() });
  if (!coupon) {
    throw { status: 404, message: "Coupon not found" };
  }

  if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
    throw { status: 400, message: "Coupon expired" };
  }

  return {
    valid: true,
    discountPercent: coupon.discount,
    description: coupon.description,
    expiryDate: coupon.expiryDate,
  };
};

const defaultLifetimeCoupons = [
  {
    code: "WELCOME2026",
    discount: 20,
    description: "Exclusive 20% discount on first month rent for new residents (Lifetime Limit).",
    expiryDate: new Date("2099-12-31"),
    available: true,
  },
  {
    code: "NEXORAPREMIUM",
    discount: 15,
    description: "Special 15% monthly rent concession on long-term 12-month leases (Lifetime Limit).",
    expiryDate: new Date("2099-12-31"),
    available: true,
  },
  {
    code: "LIFETIME10",
    discount: 10,
    description: "Permanent 10% instant discount voucher valid across all apartment categories (Lifetime Limit).",
    expiryDate: new Date("2099-12-31"),
    available: true,
  },
];

const getAllCouponsFromDB = async () => {
  let coupons = await Coupon.find();

  // Ensure default lifetime coupons exist in DB
  for (const c of defaultLifetimeCoupons) {
    const exists = coupons.some((item) => item.code === c.code);
    if (!exists) {
      await Coupon.create(c);
    }
  }

  return await Coupon.find();
};

const addCouponToDB = async (couponData) => {
  const { code, discount, description, expiryDate, available } = couponData;

  const exists = await Coupon.findOne({ code });
  if (exists) {
    throw { status: 400, message: "Coupon code already exists" };
  }

  return await Coupon.create({
    code,
    discount,
    description,
    expiryDate: new Date(expiryDate),
    available: typeof available === "boolean" ? available : true,
    createdAt: new Date(),
  });
};

const updateCouponInDB = async (couponId, couponData) => {
  const { code, discount, description, expiryDate, available } = couponData;

  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw { status: 400, message: "Invalid coupon ID" };
  }

  const exists = await Coupon.findOne({
    code,
    _id: { $ne: couponId },
  });
  if (exists) {
    throw { status: 400, message: "Coupon code already exists" };
  }

  const updated = await Coupon.findByIdAndUpdate(
    couponId,
    {
      $set: {
        code,
        discount,
        description,
        expiryDate: new Date(expiryDate),
        available: typeof available === "boolean" ? available : true,
        updatedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!updated) {
    throw { status: 404, message: "Coupon not found" };
  }

  return updated;
};

const deleteCouponFromDB = async (couponId) => {
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw { status: 400, message: "Invalid coupon ID" };
  }

  const deleted = await Coupon.findByIdAndDelete(couponId);
  if (!deleted) {
    throw { status: 404, message: "Coupon not found" };
  }

  return deleted;
};

module.exports = {
  validateCouponInDB,
  getAllCouponsFromDB,
  addCouponToDB,
  updateCouponInDB,
  deleteCouponFromDB,
};
