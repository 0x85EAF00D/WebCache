const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const Website = require("../models/Website");
const FileService = require("../services/fileService");
const UrlUtils = require("../utils/urlUtils");
const HttrackService = require("../services/httrackService");
const Database = require("../../database/database");
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

      // Clean the URL by removing protocol completely
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
      const isPdf = pathParts[pathParts.length - 1]
        ?.toLowerCase()
        .endsWith(".pdf");

      console.log("URL Parts:", urlParts);
      console.log("Domain:", domain);
      console.log("Path Parts:", pathParts);
      console.log("Is PDF:", isPdf);

      // Construct source path
      const sourcePath = path.join(
        process.cwd(),
        "WebsiteTempDatabase",
        domain,
        ...pathParts
      );

      // Construct destination path - don't append index.html for PDFs
      const destinationPath = path.join(
        process.cwd(),
        "DownloadedHTML",
        domain,
        ...pathParts
      );

      console.log("Source path:", sourcePath);
      console.log("Destination path:", destinationPath);

      // Verify source exists
      const sourceExists = await fs.pathExists(sourcePath);
      if (!sourceExists) {
        throw new Error(`Source path not found: ${sourcePath}`);
      }

      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destinationPath));

      // Move the files
      await FileService.moveFile(sourcePath, destinationPath);
      await delay(2000);
      await FileService.cleanUpDatabase("../DownloadedHTML");

      const fullPath = path.resolve(destinationPath);

      // For PDFs, use filename without extension as title
      const title = isPdf
        ? path.basename(pathParts[pathParts.length - 1], ".pdf")
        : await FileService.readHtmlTitle(destinationPath);

      await Website.create(url, title, fullPath);
      return res.status(200).json({ message: `Link saved: ${originalLink}` });
    } catch (error) {
      console.error("Error handling webpage URL:", error);
      throw error;
    }
  }

  static async handleDirectFileUrl(link, res) {
    try {
      // Clean the URL by removing protocol
      const cleanUrl = link.replace(/^https?:\/\//, "");
      const urlInfo = UrlUtils.parseDirectUrl(cleanUrl);
      const paths = FileService.constructPaths(urlInfo);

      await Database.CheckIfDatabaseExists();
      await FileService.check4dupesNames(urlInfo.url, urlInfo.domain, paths);

      await FileService.moveFile(paths.tempPath, paths.destinationPath);
      await delay(2000);
      await FileService.cleanUpDatabase("../DownloadedHTML");

      const fullPath = path.resolve(paths.destinationPath);
      const title = path.basename(
        urlInfo.filename,
        path.extname(urlInfo.filename)
      );
      await Website.create(cleanUrl, title, fullPath);
      return res.status(200).json({ message: `Link saved: ${link}` });
    } catch (error) {
      console.error("Error handling direct file URL:", error);
      throw error;
    }
  }
}

module.exports = SaveController;
