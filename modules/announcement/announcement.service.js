const mongoose = require("mongoose");
const Announcement = require("../../models/Announcement");

const getAllAnnouncementsFromDB = async () => {
  return await Announcement.find().sort({ createdAt: -1 });
};

const createAnnouncementInDB = async (announcementData) => {
  return await Announcement.create(announcementData);
};

const updateAnnouncementInDB = async (id, updateData) => {
  const { title, description } = updateData;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid announcement ID" };
  }

  const updated = await Announcement.findByIdAndUpdate(
    id,
    {
      $set: {
        title,
        description,
        updatedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!updated) {
    throw { status: 404, message: "Announcement not found or unchanged" };
  }

  return updated;
};

const deleteAnnouncementFromDB = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid announcement ID" };
  }

  const deleted = await Announcement.findByIdAndDelete(id);
  if (!deleted) {
    throw { status: 404, message: "Announcement not found" };
  }

  return deleted;
};

module.exports = {
  getAllAnnouncementsFromDB,
  createAnnouncementInDB,
  updateAnnouncementInDB,
  deleteAnnouncementFromDB,
};
