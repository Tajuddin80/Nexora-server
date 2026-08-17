const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "nexora",
  api_key: process.env.CLOUDINARY_API_KEY || "534143958426955",
  api_secret: process.env.CLOUDINARY_API_SECRET || "75zUaszWmVsflyDFvcbkPCFtsR4",
});

const uploadFileToCloudinary = (buffer, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "nexora_apartments",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const handleUploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    if (req.file.size > 1 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image file exceeds maximum limit of 1 MB",
      });
    }

    const result = await uploadFileToCloudinary(req.file.buffer, "image");
    res.json({
      success: true,
      message: "Image uploaded successfully",
      url: result.secure_url,
    });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ success: false, message: err.message || "Image upload failed" });
  }
};

const handleUploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file provided" });
    }

    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Video file exceeds maximum limit of 10 MB",
      });
    }

    const result = await uploadFileToCloudinary(req.file.buffer, "video");
    res.json({
      success: true,
      message: "Video uploaded successfully",
      url: result.secure_url,
    });
  } catch (err) {
    console.error("Video upload error:", err);
    res.status(500).json({ success: false, message: err.message || "Video upload failed" });
  }
};

module.exports = {
  handleUploadImage,
  handleUploadVideo,
};
