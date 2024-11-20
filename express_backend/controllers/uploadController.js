// controllers/uploadController.js
const Website = require("../models/Website");
const path = require("path");

class UploadController {
  static async uploadFiles(req, res) {
    try {
      const uploadedFiles = req.files;
      const results = [];

      for (const file of uploadedFiles) {
        const fileUrl = `local/uploads/${file.filename}`;
        const ext = path.extname(file.originalname).toLowerCase();
        const title = path.basename(file.originalname, ext);

        const website = await Website.create(fileUrl, title, file.path);

        results.push({
          originalName: file.originalname,
          savedPath: file.path,
          title: title,
          type: ext === ".pdf" ? "PDF" : "HTML",
        });
      }

      res.status(200).json({
        message: "Files uploaded successfully",
        results: results,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        error: "File upload failed",
        details: error.message,
      });
    }
  }
}

module.exports = UploadController;
