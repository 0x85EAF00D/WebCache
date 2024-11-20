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

      // Normalize the path for cross-platform compatibility
      const normalizedPath = path.normalize(filename);

      // Check if file exists
      if (!fs.existsSync(normalizedPath)) {
        console.error(`File not found: ${normalizedPath}`);
        return null;
      }

      const content = fs.readFileSync(normalizedPath, "utf-8");

      // Try multiple patterns to find URLs
      const patterns = [
        // Meta refresh URL
        /<meta[^>]*?http-equiv=["']?refresh["']?[^>]*?content=["']?\d*;\s*url=(.*?)["']/i,
        // Meta redirect URL
        /<meta[^>]*?http-equiv=["']?refresh["']?[^>]*?content=["']?\d*;\s*URL=(.*?)["']/i,
        // Base href
        /<base[^>]*?href=["'](.*?)["']/i,
        // Regular link
        /<link[^>]*?href=["'](.*?)["']/i,
        // Anchor tag
        /<a[^>]*?href=["'](.*?)["']/i
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          const url = match[1].trim();
          // Basic URL validation
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
          }
        }
      }

      // If no URL found with patterns, try finding any URL in the content
      const urlPattern = /https?:\/\/[^\s"'<>)]+/i;
      const generalMatch = content.match(urlPattern);
      if (generalMatch) {
        return generalMatch[0];
      }

      console.warn(`No valid URL found in file: ${normalizedPath}`);
      return null;
    } catch (error) {
      console.error(`Error extracting URL from ${filename}:`, error);
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
