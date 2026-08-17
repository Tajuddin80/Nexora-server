const { z } = require("zod");

// Zod Validation Schemas
const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["user", "member", "admin"]).optional(),
  last_log_in: z.string().optional(),
  created_at: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const createApartmentSchema = z.object({
  apartmentNo: z.string().min(1, "Apartment number is required"),
  floorNo: z.number().optional(),
  blockName: z.string().optional(),
  rent: z.number().positive("Rent must be positive"),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  video: z.string().optional(),
  details: z.string().optional(),
  available: z.boolean().optional(),
});

const agreementSchema = z.object({
  userName: z.string().optional(),
  userEmail: z.string().email("Invalid user email"),
  floorNo: z.number().optional(),
  blockName: z.string().optional(),
  apartmentNo: z.string({ required_error: "Apartment number is required" }),
  apartmentId: z.string().optional(),
  rent: z.number({ required_error: "Rent amount is required" }).positive("Rent must be positive"),
  availability: z.boolean().optional(),
});

const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  discount: z.number().min(0).max(100, "Discount must be between 0 and 100"),
  description: z.string().min(1, "Description is required"),
  expiryDate: z.string().or(z.date()),
  available: z.boolean().optional(),
});

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

const rentPaymentSchema = z.object({
  userEmail: z.string().email("Invalid user email"),
  apartmentId: z.string().min(1, "Apartment ID is required"),
  month: z.string().min(1, "Month is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
  couponCode: z.string().nullable().optional(),
});

const paymentIntentSchema = z.object({
  userEmail: z.string().email("Invalid user email"),
  apartmentNo: z.string().min(1, "Apartment number is required"),
  fullName: z.string().optional(),
  couponCode: z.string().optional(),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: "Validation Error",
      errors: result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = {
  userSchema,
  loginSchema,
  createApartmentSchema,
  agreementSchema,
  couponSchema,
  announcementSchema,
  rentPaymentSchema,
  paymentIntentSchema,
  validate,
};
