const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const Website = require("../models/Website");
const FileService = require("../services/fileService");
const UrlUtils = require("../utils/urlUtils");
const HttrackService = require("../services/httrackService");
const { delay } = require("../utils/timeUtils");

class SaveController {
  static async saveLink(req, res) {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ message: "Link is required" });
    }

    try {
      console.log("Starting download for link:", link);
      const httrackResult = await HttrackService.downloadWebsite(link);
      if (!httrackResult.success) {
        return res.status(500).json({ message: httrackResult.error });
      }

      const cleanUrl = link.replace(/^https?:\/\//, "");
      console.log("Cleaned URL:", cleanUrl);

      const url = await UrlUtils.extractUrl(
        path.join(process.cwd(), "WebsiteTempDatabase"),
        cleanUrl
      );

      if (!url) {
        console.error("Failed to extract URL from downloaded content");
        return res
          .status(500)
          .json({ message: "Failed to process downloaded content" });
      }

      try {
        const result = await SaveController.handleWebpageUrl(
          cleanUrl,
          link,
          res
        );
        return result;
      } catch (error) {
        console.error("Error handling webpage URL:", error);
        return res.status(500).json({ message: error.message });
      }
    } catch (error) {
      console.error(`Error in saveLink:`, error);
      return res.status(500).json({ message: error.message });
    }
  }

  static async handleWebpageUrl(url, originalLink, res) {
    try {
      const urlParts = url.split("/").filter(Boolean);
      const domain = urlParts[0];
      const pathParts = urlParts.slice(1);
      const lastPart = pathParts[pathParts.length - 1];
      const isPdf = lastPart?.toLowerCase().endsWith(".pdf");

      console.log("URL Parts:", urlParts);
      console.log("Domain:", domain);
      console.log("Path Parts:", pathParts);
      console.log("Is PDF:", isPdf);

      // Find the actual downloaded file
      const baseDir = path.join(process.cwd(), "WebsiteTempDatabase");
      const foundFile = await UrlUtils.findMainFile(baseDir, url);

      if (!foundFile) {
        throw new Error(`Could not find downloaded file for URL: ${url}`);
      }

      console.log("Found downloaded file:", foundFile);

      // Construct destination path based on the original URL structure
      const destinationFileName = isPdf ? lastPart : `${lastPart}.html`;
      const destinationPath = path.join(
        process.cwd(),
        "database/Websites",
        domain,
        ...pathParts.slice(0, -1),
        destinationFileName
      );

      console.log("Source path:", foundFile);
      console.log("Destination path:", destinationPath);

      // Verify source exists
      if (!(await fs.pathExists(foundFile))) {
        throw new Error(`Source file not found: ${foundFile}`);
      }

      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destinationPath));

      // Move the files
      await fs.copy(foundFile, destinationPath, { overwrite: true });
      await delay(2000);
      await FileService.cleanUpDatabase("../DownloadedHTML");

      const fullPath = path.resolve(destinationPath);

      // For PDFs, use filename without extension as title
      const title = isPdf
        ? path.basename(lastPart, ".pdf")
        : await FileService.readHtmlTitle(destinationPath);

      await Website.create(url, title, fullPath);
      return res.status(200).json({ message: `Link saved: ${originalLink}` });
    } catch (error) {
      console.error("Error handling webpage URL:", error);
      throw error;
    }
  }

}

module.exports = SaveController;
