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

      // Try the exact path first with index.html
      const exactPath = path.join(baseDir, domain, ...pathParts, "index.html");
      console.log("Checking exact path:", exactPath);

      try {
        await fs.access(exactPath);
        const stats = await fs.stat(exactPath);
        if (!stats.isDirectory()) {
          console.log(`Found file at exact path: ${exactPath}`);
          return exactPath;
        }
      } catch (error) {
        console.log(`File not found at exact path: ${exactPath}`);
      }

      // If exact path fails, try searching in domain directory
      const domainPath = path.join(baseDir, domain);
      console.log("Searching in domain directory:", domainPath);

      if (await fs.pathExists(domainPath)) {
        // Use recursive readdir to find all HTML files
        const files = await this.findAllFiles(domainPath);
        console.log("Found files in domain directory:", files);

        // First try to find a file that matches the last part of the URL
        for (const file of files) {
          if (file.includes(lastPart) && file.endsWith(".html")) {
            console.log(`Found matching file: ${file}`);
            return file;
          }
        }

        // If no matching file found, return the first HTML file
        const htmlFiles = files.filter((f) => f.endsWith(".html"));
        if (htmlFiles.length > 0) {
          console.log(`Using first HTML file found: ${htmlFiles[0]}`);
          return htmlFiles[0];
        }
      }

      // Only use base directory index.html as a last resort
      const baseIndexPath = path.join(baseDir, "index.html");
      if (await fs.pathExists(baseIndexPath)) {
        console.log(`Using base index.html as fallback: ${baseIndexPath}`);
        return baseIndexPath;
      }

      console.log("No suitable file found in any location");
      return null;
    } catch (error) {
      console.error("Error finding file:", error);
      return null;
    }
  }

  static async findAllFiles(dirPath) {
    const results = [];

    async function traverse(currentPath) {
      const files = await fs.readdir(currentPath);

      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          await traverse(fullPath);
        } else if (file.endsWith(".html")) {
          results.push(fullPath);
        }
      }
    }

    await traverse(dirPath);
    return results;
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
