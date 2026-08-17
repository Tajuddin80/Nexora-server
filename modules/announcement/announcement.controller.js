const {
  getAllAnnouncementsFromDB,
  createAnnouncementInDB,
  updateAnnouncementInDB,
  deleteAnnouncementFromDB,
} = require("./announcement.service");

const getAnnouncements = async (req, res) => {
  try {
    const data = await getAllAnnouncementsFromDB();
    res.send(data);
  } catch (err) {
    console.error("GET /announcements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const postAnnouncement = async (req, res) => {
  try {
    const result = await createAnnouncementInDB(req.body);
    res.send(result);
  } catch (err) {
    console.error("POST /announcements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const patchAnnouncement = async (req, res) => {
  try {
    await updateAnnouncementInDB(req.params.id, req.body);
    res.json({
      success: true,
      message: "Announcement updated successfully",
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error("PATCH /announcements/:id error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    await deleteAnnouncementFromDB(req.params.id);
    res.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error("DELETE /announcements/:id error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAnnouncements,
  postAnnouncement,
  patchAnnouncement,
  deleteAnnouncement,
};
