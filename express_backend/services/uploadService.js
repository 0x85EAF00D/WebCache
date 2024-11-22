// services/uploadService.js
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

class UploadService {
  static initializeUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadPath = path.join(
          process.cwd(),
          "database/Websites",
          "uploads"
        );
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
      },
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = [".html", ".htm", ".pdf"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(
          new Error("Invalid file type. Only HTML and PDF files are allowed.")
        );
      }
    };

    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    });
  }
}

module.exports = UploadService;
