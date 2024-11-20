const { exec } = require("child_process");
const path = require("path");
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
      console.log(`Starting download for link: ${link}`);
      
      const httrackResult = await HttrackService.downloadWebsite(link);
      if (!httrackResult.success) {
        console.error("HTTrack download failed:", httrackResult.error);
        return res.status(500).json({ message: httrackResult.error });
      }

      // Check if it's a direct file or webpage by examining the index.html
      const url = await UrlUtils.extractUrl(
        path.join(process.cwd(), "WebsiteTempDatabase", "index.html")
      );

      // Handle based on URL type
      if (url) {
        console.log("Handling as webpage URL:", url);
        return await SaveController.handleWebpageUrl(url, link, res);
      } else {
        console.log("Handling as direct file URL:", link);
        return await SaveController.handleDirectFileUrl(link, res);
      }
    } catch (error) {
      console.error(`Error in saveLink: ${error}`);
      return res.status(500).json({ 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async handleDirectFileUrl(link, res) {
    try {
      const urlInfo = UrlUtils.parseDirectUrl(link);
      let paths = FileService.constructPaths(urlInfo);
      
      // Ensure unique destination path
      paths = await FileService.ensureUniqueDestination(paths, urlInfo.url);

      // Initialize database if needed
      await Database.CheckIfDatabaseExists();

      console.log(`Moving file from ${paths.tempPath} to ${paths.destinationPath}`);
      await FileService.moveFile(paths.tempPath, paths.destinationPath);
      
      // Wait for file operations to complete
      await delay(2000);
      
      // Clean up temporary files
      await FileService.cleanUpDatabase("../DownloadedHTML");

      const fullPath = path.resolve(paths.destinationPath);
      const title = path.basename(paths.destinationPath, path.extname(paths.destinationPath));
      
      // Save to database
      const website = await Website.create(urlInfo.url, title, fullPath);
      console.log(`Successfully saved direct file: ${title}`);

      return res.status(200).json({ 
        message: `Link saved: ${link}`,
        website: website
      });
    } catch (error) {
      console.error("Error handling direct file URL:", error);
      throw new Error(`Failed to process direct file URL: ${error.message}`);
    }
  }

  static async handleWebpageUrl(url, link, res) {
    try {
      const urlInfo = UrlUtils.parseWebpageUrl(url);
      let paths = FileService.constructPaths(urlInfo);
      
      // Ensure unique destination path
      paths = await FileService.ensureUniqueDestination(paths, urlInfo.url);

      // Initialize database if needed
      await Database.CheckIfDatabaseExists();

      console.log(`Moving webpage from ${paths.sourcePath} to ${paths.destinationPath}`);
      await FileService.moveFile(paths.sourcePath, paths.destinationPath);
      
      // Wait for file operations to complete
      await delay(2000);
      
      // Clean up temporary files
      await FileService.cleanUpDatabase("../DownloadedHTML");

      const fullPath = path.resolve(paths.destinationPath);
      
      // Try to get title from HTML file, fallback to URL-based title
      let title;
      try {
        title = await FileService.readHtmlTitle(paths.destinationPath);
      } catch (error) {
        console.warn("Could not read HTML title, using fallback:", error);
        title = path.basename(paths.destinationPath, path.extname(paths.destinationPath));
      }

      // Save to database
      const website = await Website.create(url, title, fullPath);
      console.log(`Successfully saved webpage: ${title}`);

      return res.status(200).json({ 
        message: `Link saved: ${link}`,
        website: website
      });
    } catch (error) {
      console.error("Error handling webpage URL:", error);
      throw new Error(`Failed to process webpage URL: ${error.message}`);
    }
  }

  static validateLink(link) {
    if (!link) {
      throw new Error("Link is required");
    }

    try {
      new URL(link);
    } catch (error) {
      throw new Error("Invalid URL format");
    }

    return true;
  }

  static async cleanupOnError(paths) {
    try {
      if (paths.tempPath && await fs.pathExists(paths.tempPath)) {
        await fs.remove(paths.tempPath);
      }
      if (paths.destinationPath && await fs.pathExists(paths.destinationPath)) {
        await fs.remove(paths.destinationPath);
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}

module.exports = SaveController;