const Website = require("../models/Website");
const FileService = require("../services/fileService");
const path = require("path");
const fs = require("fs-extra");

class LoadController {
  static async getSavedPage(req, res) {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    try {
      const normalizedPath = path.normalize(filePath);
      const fileData = await FileService.getFileInfo(normalizedPath);

      if (!fileData.exists) {
        return res.status(404).json({ error: "File not found" });
      }

      const finalPath = fileData.path || normalizedPath;
      const isPdf = finalPath.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        // Handle PDF files
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
        // Stream the PDF file directly
        const stream = fs.createReadStream(finalPath);
        stream.pipe(res);
      } else {
        // Handle HTML files (existing logic)
        res.setHeader("Content-Type", "text/html");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "no-cache");

        try {
          // Read the file content
          const content = await fs.readFile(finalPath, "utf8");

          // Get the base directory for the website
          const baseDir = path.dirname(finalPath);

          // Fix relative paths in the HTML
          const modifiedContent = content.replace(
            /(src|href)=("|')(?!http|\/\/|data:)([^"']+)("|')/g,
            (match, attr, quote, value) => {
              const absolutePath = path.join(baseDir, value);
              return `${attr}=${quote}/api/saved-page?path=${encodeURIComponent(
                absolutePath
              )}${quote}`;
            }
          );

          return res.send(modifiedContent);
        } catch (readError) {
          console.error("Error reading file:", readError);
          // Fallback to sending file directly if read/modify fails
          return res.sendFile(path.resolve(finalPath));
        }
      }
    } catch (error) {
      console.error("Error serving file:", error);
      return res.status(500).json({
        error: "Error serving file",
        details: error.message,
        path: filePath,
      });
    }
  }

  static async getLinks(req, res) {
    try {
      const websites = await Website.getAll();
      const websitesWithPaths = await Promise.all(
        websites.map(LoadController.processWebsiteData)
      );
      res.json(websitesWithPaths);
    } catch (error) {
      console.error("Error fetching websites:", error);
      res.status(500).json({
        error: "Failed to fetch websites",
        details: error.message,
      });
    }
  }

  static async processWebsiteData(website) {
    const normalizedPath = path.normalize(website.file_path);
    const fileInfo = await FileService.getFileInfo(normalizedPath);

    return {
      web_url: website.web_url,
      title: website.title,
      file_path: fileInfo.path || normalizedPath,
      created: website.created,
      exists: fileInfo.exists,
    };
  }

  static setResponseHeaders(res, filePath) {
    const isHtml = filePath.endsWith(".html");
    res.setHeader("Content-Type", isHtml ? "text/html" : "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-cache");
  }
}

module.exports = LoadController;
