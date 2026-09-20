const {
  getMembersFromDB,
  removeMemberInDB,
  getMemberDueMonthsFromDB,
  getAdminStatsFromDB,
  getMemberDashboardFromDB,
} = require("./admin.service");

const getMembers = async (req, res) => {
  try {
    const members = await getMembersFromDB();
    res.json(members);
  } catch (err) {
    console.error("GET /members error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const removeMember = async (req, res) => {
  try {
    await removeMemberInDB(req.params.email);
    res.json({
      success: true,
      message: "Member removed and apartment freed",
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("PATCH /members/:email/remove error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getMemberDueMonths = async (req, res) => {
  try {
    const dueMonths = await getMemberDueMonthsFromDB(req.params.email);
    res.json(dueMonths);
  } catch (err) {
    console.error("GET /members/:email/due-months error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const stats = await getAdminStatsFromDB();
    res.json(stats);
  } catch (err) {
    console.error("GET /admin/stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getMemberDashboard = async (req, res) => {
  try {
    const email = req.query.email || req.user?.email;
    const dashboardData = await getMemberDashboardFromDB(email);
    res.json(dashboardData);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("GET /member/dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMembers,
  removeMember,
  getMemberDueMonths,
  getAdminStats,
  getMemberDashboard,
};
