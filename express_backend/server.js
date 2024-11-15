const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process"); // Import child_process module
const fs = require("fs"); // "File System" used to search index.html for exact html file
const {
  insertWebsite,
  deleteWebsite,
  getWebsites,
  getFilePath,
} = require("../database/database.js"); // Import SQLite functions

const crypto = require("crypto"); // Import crypto for encryption and decryption

// Encryption and Decryption Key (ideally should be stored securely, e.g., in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-256-bit-secret"; // 32-byte key (256-bit)
const IV_LENGTH = 16; // AES block size (128-bit)

// Encrypt user data
function encryptUserData(data) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH); // Generate a random initialization vector
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      iv
    ); // Create a cipher instance
    let encryptedData = cipher.update(data, "utf8", "hex"); // Encrypt the data
    encryptedData += cipher.final("hex"); // Finalize the encryption
    return { iv: iv.toString("hex"), encryptedData }; // Return the IV and the encrypted data
  } catch (error) {
    console.error("Error encrypting data:", error.message);
    throw new Error("Encryption failed"); // Throw an error if something goes wrong
  }
}

// Decrypt user data
function decryptUserData(encryptedData, iv) {
  try {
    const ivBuffer = Buffer.from(iv, "hex"); // Convert the IV from hex to a Buffer
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      ivBuffer
    ); // Create a decipher instance
    let decryptedData = decipher.update(encryptedData, "hex", "utf8"); // Decrypt the data
    decryptedData += decipher.final("utf8"); // Finalize the decryption
    return decryptedData; // Return the decrypted data
  } catch (error) {
    console.error("Error decrypting data:", error.message);
    throw new Error("Decryption failed"); // Throw an error if something goes wrong
  }
}

function findFileInDirectory(directoryPath) {
  try {
    // Read the directory contents
    const files = fs.readdirSync(directoryPath);

    // Look for .html or .pdf files
    const htmlFile = files.find((file) => file.endsWith(".html"));
    const pdfFile = files.find((file) => file.endsWith(".pdf"));

    // Return the first matching file found, preferring HTML over PDF
    if (htmlFile) {
      return path.join(directoryPath, htmlFile);
    } else if (pdfFile) {
      return path.join(directoryPath, pdfFile);
    }

    return null;
  } catch (error) {
    console.error("Error reading directory:", error);
    return null;
  }
}

function extractUrl(filename) {
  try {
    const content = fs.readFileSync(filename, "utf-8");
    const match = content.match(/URL=([^\s">]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error reading file:", error.message);
    return null; // Return null or handle it as per your requirements
  }
}

function removeAfterFirstSlash(url) {
  const slashIndex = url.indexOf("/");
  return slashIndex !== -1 ? url.substring(0, slashIndex) : url;
}

function extractAfterLastSlash(url) {
  if (typeof url !== "string") {
    console.error("Error: Invalid URL. Expected a string but got:", url);
    return null; // or an appropriate default value
  }
  return url.split("/").pop();
}

function removeAfterLastSlash(url) {
  if (typeof url !== "string") {
    console.error("Error: Invalid URL. Expected a string but got:", url);
    return null; // or an appropriate default value
  }
  const lastSlashIndex = url.lastIndexOf("/");
  return lastSlashIndex !== -1 ? url.substring(0, lastSlashIndex) : url;
}

// Modified moveFile function to handle platform differences
function moveFile(sourcePath, url, destinationPath) {
  // Guard clause for undefined parameters
  if (!sourcePath || !destinationPath) {
    throw new Error(
      `Invalid parameters: sourcePath=${sourcePath}, destinationPath=${destinationPath}`
    );
  }

  try {
    // Normalize paths for cross-platform compatibility
    sourcePath = path.normalize(sourcePath);
    destinationPath = path.normalize(destinationPath);

    console.log("Normalized source path:", sourcePath);
    console.log("Normalized destination path:", destinationPath);

    // Create all necessary directories in the source path
    const sourceDir = path.dirname(sourcePath);
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
      console.log(`Created source directory: ${sourceDir}`);
    }

    // Create all necessary directories in the destination path
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
      console.log(`Created destination directory: ${destinationDir}`);
    }

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source does not exist: ${sourcePath}`);
    }

    // Check if source is a directory
    const sourceStats = fs.statSync(sourcePath);
    const isDirectory = sourceStats.isDirectory();

    // If destination exists, try to remove it with retries
    if (fs.existsSync(destinationPath)) {
      console.log(
        `Attempting to remove existing destination: ${destinationPath}`
      );

      // Try multiple times with delay
      for (let i = 0; i < 3; i++) {
        try {
          if (isDirectory) {
            fs.rmSync(destinationPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(destinationPath);
          }
          console.log("Successfully removed existing destination");
          break;
        } catch (error) {
          if (i === 2) {
            // Last attempt
            throw new Error(
              `Failed to remove existing destination after 3 attempts: ${error.message}`
            );
          }
          // Wait for 1 second before next attempt
          console.log(`Retry ${i + 1}: Waiting before next attempt...`);
          require("child_process").execSync("timeout /t 1");
        }
      }
    }

    // Perform the move operation
    try {
      if (isDirectory) {
        // For directories, use recursive copy then delete
        fs.cpSync(sourcePath, destinationPath, { recursive: true });
        fs.rmSync(sourcePath, { recursive: true, force: true });
      } else {
        // For files, try rename first, fall back to copy+delete
        try {
          fs.renameSync(sourcePath, destinationPath);
        } catch (renameError) {
          if (renameError.code === "EXDEV" || renameError.code === "EPERM") {
            fs.copyFileSync(sourcePath, destinationPath);
            fs.unlinkSync(sourcePath);
          } else {
            throw renameError;
          }
        }
      }

      console.log(
        `Successfully moved ${
          isDirectory ? "directory" : "file"
        } to ${destinationPath}`
      );
      return true;
    } catch (moveError) {
      throw new Error(
        `Failed to move ${isDirectory ? "directory" : "file"}: ${
          moveError.message
        }`
      );
    }
  } catch (err) {
    console.error("Error in moveFile:", err);
    console.error("Error details:", {
      error: err.message,
      code: err.code,
      sourcePath,
      destinationPath,
      sourceExists: fs.existsSync(sourcePath),
      destDirExists: fs.existsSync(path.dirname(destinationPath)),
    });
    throw err;
  }
}

// Deletes everything but the desired HTML doc
function cleanUpDatabase(excludeFolder) {
  const databasePath = path.join(__dirname, "WebsiteTempDatabase");

  // If directory DNE, output message
  fs.readdir(databasePath, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      return;
    }

    // Iterates through and deletes all the not excluded folders
    files.forEach((file) => {
      const filePath = path.join(databasePath, file);
      if (file !== excludeFolder) {
        fs.rm(filePath, { recursive: true, force: true }, (err) => {
          if (err) {
            console.error(`Error deleting ${filePath}: ${err}`);
          } else {
            console.log(`${filePath} deleted successfully`);
          }
        });
      }
    });
  });
}

function readHtmlTitle(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const titleMatch = data.match(/<title[^>]*>([^<]*)<\/title>/i);
    return titleMatch && titleMatch[1].trim()
      ? titleMatch[1].trim()
      : "No Title";
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    return "No Title";
  }
}

function removeFirstEightChars(str) {
  return str.substring(8);
}
function removeLastFourChars(str) {
  return str.substring(0, str.length - 4);
}

function isFileInDirectory(directory, fileName) {
  const files = fs.readdirSync(directory);
  return files.includes(fileName);
}

function delay(ms) {
  // used like: await delay(2000); // waits for 2 seconds
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the 'build' folder
app.use(express.static(path.join(__dirname, "build")));

// API Routes should come BEFORE the catch-all route
//this is the load page endpoint
app.get("/api/saved-page", (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    console.log("No file path provided");
    return res.status(400).json({ error: "File path is required" });
  }

  // Normalize the file path for the operating system
  const normalizedPath = path.normalize(filePath);
  console.log("Checking path:", normalizedPath);

  try {
    // Check if the path is a directory
    const stats = fs.statSync(normalizedPath);

    let actualFilePath;
    if (stats.isDirectory()) {
      console.log("Path is a directory, searching for files...");
      actualFilePath = findFileInDirectory(normalizedPath);
      if (!actualFilePath) {
        return res
          .status(404)
          .json({ error: "No HTML or PDF file found in directory" });
      }
    } else {
      actualFilePath = normalizedPath;
    }

    console.log("Attempting to serve file from:", actualFilePath);

    // Read the file content
    const content = fs.readFileSync(actualFilePath, "utf8");

    // Set appropriate headers based on file type
    const isHtml = actualFilePath.endsWith(".html");
    res.setHeader("Content-Type", isHtml ? "text/html" : "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-cache");

    return res.send(content);
  } catch (error) {
    console.error("Error serving file:", error);
    return res.status(500).json({
      error: "Error serving file",
      details: error.message,
      path: normalizedPath,
    });
  }
});

// Update the get-links endpoint to include file detection
app.get("/api/get-links", async (req, res) => {
  console.log("Load page endpoint was hit.");

  try {
    const websites = await getWebsites();
    console.log("Raw websites data:", websites);

    // Transform the data to include actual file paths
    const websitesWithPaths = websites.map((website) => {
      const normalizedPath = path.normalize(website.file_path);
      let actualFilePath = null;

      try {
        const stats = fs.statSync(normalizedPath);
        if (stats.isDirectory()) {
          actualFilePath = findFileInDirectory(normalizedPath);
        } else {
          actualFilePath = normalizedPath;
        }
      } catch (error) {
        console.warn(`Error checking path ${normalizedPath}:`, error);
      }

      return {
        web_url: website.web_url,
        title: website.title,
        file_path: actualFilePath || normalizedPath,
        created: website.created,
        exists: !!actualFilePath,
      };
    });

    console.log("Sending to frontend:", websitesWithPaths);
    res.json(websitesWithPaths);
  } catch (error) {
    console.error("Error fetching websites:", error);
    res.status(500).json({
      error: "Failed to fetch websites",
      details: error.message,
    });
  }
});

// The new saved-page endpoint
app.get("/api/saved-page/:domain/:file", (req, res) => {
  const { domain, file } = req.params;

  // Start from server.js location and navigate up then to correct folders
  const filePath = path.join(
    __dirname,
    "..",
    "database",
    "Websites",
    domain,
    file
  );

  console.log("Attempting to serve file from:", filePath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    return res.status(404).send("File not found");
  }

  // Send the file with appropriate headers
  res.sendFile(filePath, {
    headers: {
      "Content-Type": "text/html",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

// Serve the index.html for all routes (for React Router or other SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Example POST endpoint
app.post("/api/save-link", async (req, res) => {
  const { link } = req.body;
  if (!link) {
    return res.status(400).json({ message: "Link is required" });
  }

  console.log(`Link received: ${link}`);

  //httrack $(link) -r0 -O /OutputLocation
  // httrack is a url html file downloader
  // -r2 means recusive depth of 0 or just the current page plus one link away for the most infomation on the current page
  // -%eN0 means to set the external links depth to 0
  // -O is the output directory
  console.log(
    `Running Command: "httrack ${link} -r1 -O WebsiteTempDatabase -%eN0 -q"`
  );
  const command = `httrack ${link} -r1  -O WebsiteTempDatabase -%eN0 -q`;
  exec(command, async (err, stdout, stderr) => {
    if (err) {
      console.error("Error executing command:", err);
      return res.status(500).json({ message: "Failed to execute command" });
    }
    console.log(`Command output:`);
    console.log(`${stdout}`);

    // way to move the wanted html file
    const url = extractUrl("WebsiteTempDatabase/index.html");

    if (url == null) {
      try {
        const Nohttps = removeFirstEightChars(link);
        console.log(`Processing direct file URL: ${Nohttps}`);

        const DownloadedHTMLfile = extractAfterLastSlash(Nohttps);
        const WEBsite = removeAfterFirstSlash(Nohttps);

        // Construct paths using path.join for cross-platform compatibility
        const tempPath = path.join(
          process.cwd(),
          "WebsiteTempDatabase",
          Nohttps
        );
        const destinationFilePath = path.join(
          process.cwd(),
          "..",
          "database",
          "Websites",
          WEBsite,
          DownloadedHTMLfile
        );

        console.log(`Source path: ${tempPath}`);
        console.log(`Destination path: ${destinationFilePath}`);

        // Move the file with only required parameters
        moveFile(tempPath, null, destinationFilePath);

        await delay(2000);
        cleanUpDatabase("DownloadedHTML");
        await delay(2000);

        const fullPath = path.resolve(destinationFilePath);
        const title = removeLastFourChars(DownloadedHTMLfile);

        await insertWebsite(Nohttps, title, fullPath);
        return res.status(200).json({ message: `Link saved: ${link}` });
      } catch (error) {
        console.error(`Error processing file operations from: ${link}`, error);
        return res.status(500).json({
          message: `An error occurred during file processing: ${error.message}`,
        });
      }
    } else {
      const DownloadedHTMLfile = extractAfterLastSlash(url);
      console.log(`HTML Wanted File: ${DownloadedHTMLfile}`);
      console.log(`Extracted URL: ${url}`);
      const WEBsite = removeAfterFirstSlash(url);
      console.log(`Extracted domain: ${WEBsite}`);

      // check that helps the backend stop from failing after error input
      if (url == null) {
        return res.status(200).json({ message: "Link failed" }); // Link extraction failed
      } else {
        // code block detects for existing file names in storage directories
        const destinationFilePath = path.join(
          "../database",
          "Websites",
          WEBsite,
          DownloadedHTMLfile
        ); // Destination path for the database

        try {
          moveFile(
            path.join("WebsiteTempDatabase", url),
            url,
            destinationFilePath
          ); // Move the wanted file
          await delay(2000);
          cleanUpDatabase("DownloadedHTML"); // Clean up everything except DownloadedHTML folder
          await delay(2000);
          // Add file data to database
          const fullPath = path.resolve(destinationFilePath);
          console.log(`Fullpath: ${fullPath}`);
          let title = readHtmlTitle(destinationFilePath);
          console.log(`Page Title: ${title}`); // Read the HTML title
          insertWebsite(url, title, fullPath);
        } catch (error) {
          console.error(
            `Error processing file operations from: ${link}`,
            error.message
          );
          return res.status(500).json({
            message: `An error occurred during file processing from: ${link}`,
          }); // Error response
        }
      }
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  // Automatically open localhost:3000 in the default browser
  const platform = process.platform;
  let command;

  if (platform === "win32") {
    command = "start http://localhost:3000";
  } else if (platform === "darwin") {
    command = "open http://localhost:3000";
  } else if (platform === "linux") {
    command = "xdg-open http://localhost:3000";
  }

  exec(command, (err) => {
    if (err) {
      console.error("Failed to open browser:", err);
    }
  });
});
