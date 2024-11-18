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
      const httrackResult = await HttrackService.downloadWebsite(link);
      if (!httrackResult.success) {
        return res.status(500).json({ message: httrackResult.error });
      }

      const url = await UrlUtils.extractUrl(
        path.join(process.cwd(), "WebsiteTempDatabase", "index.html")
      );
      return url
        ? await SaveController.handleWebpageUrl(url, link, res)
        : await SaveController.handleDirectFileUrl(link, res);
    } catch (error) {
      console.error(`Error in saveLink: ${error}`);
      return res.status(500).json({ message: error.message });
    }
  }

  static async handleDirectFileUrl(link, res) {
    try {
      const urlInfo = UrlUtils.parseDirectUrl(link);
      const paths = FileService.constructPaths(urlInfo);

      await Database.CheckIfDatabaseExists();
      await FileService.check4dupesNames(urlInfo.url, urlInfo.domain, paths);

      await FileService.moveFile(paths.tempPath, paths.destinationPath);
      await delay(2000);
      await FileService.cleanUpDatabase("../DownloadedHTML");

      const fullPath = path.resolve(paths.destinationPath);
      const title = UrlUtils.removeLastFourChars(urlInfo.filename);
      await Database.CheckIfDatabaseExists(urlInfo.url, title, fullPath);
      await Website.create(urlInfo.url, title, fullPath);
      return res.status(200).json({ message: `Link saved: ${link}` });
    } catch (error) {
      console.error("Error handling direct file URL:", error);
      throw error;
    }
  }

  static async handleWebpageUrl(url, link, res) {
    try {
      const urlInfo = UrlUtils.parseWebpageUrl(url);
      const paths = FileService.constructPaths(urlInfo);

      await Database.CheckIfDatabaseExists();
      await FileService.check4dupesNames(urlInfo.url, urlInfo.domain, paths);

      await FileService.moveFile(paths.sourcePath, paths.destinationPath);
      await delay(2000);
      await FileService.cleanUpDatabase("../DownloadedHTML");

      const fullPath = path.resolve(paths.destinationPath);
      const title = await FileService.readHtmlTitle(paths.destinationPath);
      await Website.create(url, title, fullPath);
      return res.status(200).json({ message: `Link saved: ${link}` });
    } catch (error) {
      console.error("Error handling webpage URL:", error);
      throw error;
    }
  }
}
module.exports = SaveController;
