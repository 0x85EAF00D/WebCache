const fs = require("fs-extra");
const path = require("path");

class UrlUtils {
  static parseDirectUrl(link) {
    if (!link) {
      throw new Error("Link is required");
    }

    const parts = link.split("/").filter(Boolean);
    return {
      url: link,
      domain: parts[0],
      filename: parts[parts.length - 1] || "index.html",
      relativePath: link,
    };
  }

  static parseWebpageUrl(url) {
    if (!url) {
      throw new Error("URL is required");
    }

    const parts = url.split("/").filter(Boolean);
    const filename = parts[parts.length - 1];
    const isPdf = filename && filename.toLowerCase().endsWith(".pdf");

    return {
      url: url,
      domain: parts[0],
      filename: filename || "index.html",
      relativePath: url,
      isPdf: isPdf,
    };
  }

  static async findMainFile(baseDir, originalUrl) {
    try {
      console.log("Finding main file for:", originalUrl);

      if (!originalUrl) {
        throw new Error("Original URL is undefined");
      }

      const parts = originalUrl.split("/").filter(Boolean);
      const domain = parts[0];
      const pathParts = parts.slice(1);
      const lastPart = pathParts[pathParts.length - 1] || "";
      const isPdf = lastPart.toLowerCase().endsWith(".pdf");

      // For PDF files, look for the exact file
      if (isPdf) {
        const pdfPath = path.join(baseDir, domain, ...pathParts);
        try {
          await fs.access(pdfPath);
          console.log(`Found PDF at: ${pdfPath}`);
          return pdfPath;
        } catch (error) {
          console.log(`PDF not found at: ${pdfPath}`);
        }
      }

      // Original HTML file checking logic
      const possiblePaths = [
        path.join(baseDir, domain, ...pathParts, "index.html"),
        path.join(baseDir, domain, "index.html"),
        path.join(baseDir, "index.html"),
      ];

      console.log("Checking possible paths:", possiblePaths);

      for (const targetPath of possiblePaths) {
        try {
          await fs.access(targetPath);
          console.log(`Found file at: ${targetPath}`);
          return targetPath;
        } catch (error) {
          console.log(`File not found at: ${targetPath}`);
        }
      }

      console.log("No suitable file found in any location");
      return null;
    } catch (error) {
      console.error("Error finding file:", error);
      return null;
    }
  }

  static async extractUrl(basePath, originalUrl) {
    try {
      console.log(
        "Extracting URL from:",
        basePath,
        "Original URL:",
        originalUrl
      );
      // Simply return the original URL if we find the file
      const file = await this.findMainFile(basePath, originalUrl);
      return file ? originalUrl : null;
    } catch (error) {
      console.error(`Error in extractUrl:`, error);
      return originalUrl;
    }
  }

  static removeAfterFirstSlash(url) {
    if (!url) return "";
    const parts = url.split("/").filter(Boolean);
    return parts[0] || "";
  }

  static extractAfterLastSlash(url) {
    if (typeof url !== "string") {
      throw new Error("Invalid URL: Expected string");
    }
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] || "index.html";
  }

  static removeAfterLastSlash(url) {
    if (typeof url !== "string") {
      console.error("Error: Invalid URL. Expected a string but got:", url);
      return null;
    }
    const parts = url.split("/").filter(Boolean);
    return parts.slice(0, -1).join("/") || parts[0];
  }
}

module.exports = UrlUtils;
