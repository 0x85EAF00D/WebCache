const fs = require("fs");
const path = require("path");

class UrlUtils {
  static parseDirectUrl(link) {
    if (!link) {
      throw new Error("Link is required");
    }

    const urlWithoutProtocol = UrlUtils.removeFirstEightChars(link);
    return {
      url: urlWithoutProtocol,
      domain: UrlUtils.removeAfterFirstSlash(urlWithoutProtocol),
      filename: UrlUtils.extractAfterLastSlash(urlWithoutProtocol),
      relativePath: urlWithoutProtocol,
    };
  }

  static parseWebpageUrl(url) {
    if (!url) {
      throw new Error("URL is required");
    }

    return {
      url,
      domain: UrlUtils.removeAfterFirstSlash(url),
      filename: UrlUtils.extractAfterLastSlash(url),
      relativePath: url,
    };
  }

  static extractUrl(filename) {
    try {
      if (!filename) {
        throw new Error("Filename is required");
      }

      const content = fs.readFileSync(filename, "utf-8");
      const match = content.match(/URL=([^\s">]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Error reading file:", error.message);
      return null;
    }
  }

  static removeAfterFirstSlash(url) {
    if (!url) return "";
    const slashIndex = url.indexOf("/");
    return slashIndex !== -1 ? url.substring(0, slashIndex) : url;
  }

  static extractAfterLastSlash(url) {
    if (typeof url !== "string") {
      throw new Error("Invalid URL: Expected string");
    }
    const parts = url.split("/");
    return parts[parts.length - 1] || "";
  }

  static removeAfterLastSlash(url) {
    if (typeof url !== 'string') {
        console.error("Error: Invalid URL. Expected a string but got:", url);
        return null; // or an appropriate default value
    }
    const lastSlashIndex = url.lastIndexOf('/');
    return lastSlashIndex !== -1 ? url.substring(0, lastSlashIndex) : url;
}
  static removeFirstEightChars(str) {
    return str && str.length > 8 ? str.substring(8) : str;
  }

  static removeLastFourChars(str) {
    return str && str.length > 4 ? str.substring(0, str.length - 4) : str;
  }
}

module.exports = UrlUtils;
