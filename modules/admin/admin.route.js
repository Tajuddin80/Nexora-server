const express = require("express");
const router = express.Router();
const {
  getMembers,
  removeMember,
  getMemberDueMonths,
  getAdminStats,
  getMemberDashboard,
} = require("./admin.controller");
const { verifyAuth, verifyAdmin, verifyMember } = require("../../middleware/auth");

router.get("/members", verifyAuth, verifyAdmin, getMembers);
router.patch("/members/:email/remove", verifyAuth, verifyAdmin, removeMember);
router.get("/members/:email/due-months", verifyAuth, verifyAdmin, getMemberDueMonths);
router.get("/admin/stats", verifyAuth, verifyAdmin, getAdminStats);
router.get("/member/dashboard", verifyAuth, verifyMember, getMemberDashboard);

module.exports = router;
