const express = require("express");
const router = express.Router();
const { postUser, loginUser, getUserRole } = require("./user.controller");
const { verifyAuth } = require("../../middleware/auth");
const { validate, userSchema, loginSchema } = require("../../validators/schemas");

router.post("/", validate(userSchema), postUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/:email/role", verifyAuth, getUserRole);

module.exports = router;
