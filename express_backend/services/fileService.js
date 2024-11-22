const fs = require("fs-extra");
const path = require("path");
const UrlUtils = require("../utils/urlUtils");

class FileService {
  static constructPaths(urlInfo) {
    const basePath = process.cwd();
    const tempDatabasePath = path.join(basePath, "WebsiteTempDatabase");
    const downloadedPath = path.join(basePath, "DownloadedHTML"); // might want to change this to databse folder
    // Create paths using path.join to ensure cross-platform compatibility
    const paths = {
      downloadedPathOUT: path.join(basePath, "DownloadedHTML"),
      // Temp path where HTTrack initially downloads
      tempPath: path.join(tempDatabasePath, urlInfo.domain),

      // Source path for webpage downloads - will be found by recursive search
      sourcePath: path.join(tempDatabasePath, urlInfo.domain),

      // Final destination path
      destinationPath: path.join(
        downloadedPath,
        urlInfo.domain,
        urlInfo.filename || "index.html"
      ),
    };

    return paths;
  }

  static async findHtmlOrPdfFile(directoryPath) {
    try {
      const files = await fs.readdir(directoryPath);

      for (const file of files) {
        const fullPath = path.join(directoryPath, file);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          // Recursively search subdirectories
          const foundFile = await this.findHtmlOrPdfFile(fullPath);
          if (foundFile) return foundFile;
        } else if (
          file.toLowerCase().endsWith(".html") ||
          file.toLowerCase().endsWith(".pdf")
        ) {
          // Found an HTML or PDF file
          return fullPath;
        }
      }

      return null;
    } catch (error) {
      console.error("Error searching for HTML/PDF file:", error);
      return null;
    }
  }

  static async moveFile(sourcePath, destinationPath) {
    try {
      sourcePath = path.normalize(sourcePath);
      const isPdf = sourcePath.toLowerCase().endsWith(".pdf");

      // If sourcePath is a directory and not a PDF, search for HTML/PDF file
      const stats = await fs.stat(sourcePath);
      if (stats.isDirectory() && !isPdf) {
        const foundFile = await this.findHtmlOrPdfFile(sourcePath);
        if (!foundFile) {
          throw new Error(
            `No HTML or PDF file found in directory: ${sourcePath}`
          );
        }
        sourcePath = foundFile;
      }

      // Ensure target directory exists
      await this.ensureDirectoryExists(path.dirname(destinationPath));

      // Check if source exists
      if (!(await fs.pathExists(sourcePath))) {
        throw new Error(`Source path does not exist: ${sourcePath}`);
      }

      // If destination already exists, remove it first
      if (await fs.pathExists(destinationPath)) {
        await fs.remove(destinationPath);
      }

      // Copy files
      await fs.copy(sourcePath, destinationPath, {
        overwrite: true,
        errorOnExist: false,
        recursive: true,
      });

      // After successful copy, try to remove the source
      try {
        await fs.remove(sourcePath);
      } catch (removeError) {
        console.warn(
          `Warning: Could not remove source directory after copy: ${removeError.message}`
        );
      }
    } catch (error) {
      console.error("Error moving file:", error);
      throw new Error(`Failed to move file: ${error.message}`);
    }
  }

  static async cleanUpDatabase(excludeFolder) {
    // This method removes all files and folders from the temp database except for a specified folder
    try {
        // Construct the full path to the temporary database directory
        // process.cwd() gets the current working directory of the Node.js process
        // Using path.join ensures cross-platform compatibility (Windows/Mac/Linux)
        const databasePath = path.join(process.cwd(), "WebsiteTempDatabase");

        // Check if the database directory exists before trying to clean it
        // fs.pathExists is from fs-extra and returns a Promise<boolean>
        if (!(await fs.pathExists(databasePath))) {
            // If the directory doesn't exist, there's nothing to clean up
            return;
        }

        // Read the contents of the database directory
        // This returns an array of file/folder names in the directory
        const files = await fs.readdir(databasePath);

        // Use Promise.all to handle multiple file deletions concurrently
        // This is more efficient than deleting files sequentially
        await Promise.all(
            files.map(async (file) => {
                // Only process files/folders that aren't the excluded folder
                if (file !== excludeFolder) {
                    // Construct the full path to the file/folder to be removed
                    const filePath = path.join(databasePath, file);
                    
                    try {
                        // fs.remove (from fs-extra) recursively removes files and directories
                        // It's like rm -rf in Unix or del /s in Windows
                        await fs.remove(filePath);
                    } catch (error) {
                        // If deletion fails for any reason, log a warning but continue
                        // This ensures one failed deletion doesn't stop the entire cleanup
                        console.warn(
                            `Warning: Could not remove ${filePath}: ${error.message}`
                        );
                    }
                }
            })
        );
    } catch (error) {
        // If any error occurs in the main try block (e.g., directory access issues)
        // Log it and rethrow to let the caller handle it
        console.error("Error cleaning up database:", error);
        throw error;
    }
}

  static async ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    await fs.ensureDir(dir);
  }

  static async getFileInfo(filePath) {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return { exists: false, path: null };
      }

      const stats = await fs.stat(filePath);
      const actualPath = stats.isDirectory()
        ? await FileService.findFileInDirectory(filePath)
        : filePath;

      return {
        exists: !!actualPath,
        path: actualPath,
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      return { exists: false, path: null };
    }
  }

  static async readHtmlTitle(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      return titleMatch ? titleMatch[1] : path.basename(filePath, ".html");
    } catch (error) {
      console.error("Error reading HTML title:", error);
      return path.basename(filePath, ".html");
    }
  }

  static async findFileInDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      const htmlFile = files.find((file) => file.endsWith(".html"));
      return htmlFile ? path.join(dirPath, htmlFile) : null;
    } catch (error) {
      console.error("Error finding file in directory:", error);
      return null;
    }
  }
}
module.exports = FileService;
