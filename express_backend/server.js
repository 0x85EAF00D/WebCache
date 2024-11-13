const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process'); // Import child_process module
const fs = require('fs'); // "File System" used to search index.html for exact html file
const { insertWebsite, deleteWebsite, getWebsites } = require('../database/database.js'); // Import SQLite functions

const crypto = require('crypto'); // Import crypto for encryption and decryption

// Encryption and Decryption Key (ideally should be stored securely, e.g., in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-256-bit-secret';  // 32-byte key (256-bit)
const IV_LENGTH = 16;  // AES block size (128-bit)

// Encrypt user data
function encryptUserData(data) {
    try {
        const iv = crypto.randomBytes(IV_LENGTH); // Generate a random initialization vector
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv); // Create a cipher instance
        let encryptedData = cipher.update(data, 'utf8', 'hex'); // Encrypt the data
        encryptedData += cipher.final('hex'); // Finalize the encryption
        return { iv: iv.toString('hex'), encryptedData }; // Return the IV and the encrypted data
    } catch (error) {
        console.error('Error encrypting data:', error.message);
        throw new Error('Encryption failed'); // Throw an error if something goes wrong
    }
}

// Decrypt user data
function decryptUserData(encryptedData, iv) {
    try {
        const ivBuffer = Buffer.from(iv, 'hex'); // Convert the IV from hex to a Buffer
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), ivBuffer); // Create a decipher instance
        let decryptedData = decipher.update(encryptedData, 'hex', 'utf8'); // Decrypt the data
        decryptedData += decipher.final('utf8'); // Finalize the decryption
        return decryptedData; // Return the decrypted data
    } catch (error) {
        console.error('Error decrypting data:', error.message);
        throw new Error('Decryption failed'); // Throw an error if something goes wrong
    }
}


function extractUrl(filename) {
    try {
        const content = fs.readFileSync(filename, 'utf-8');
        const match = content.match(/URL=([^\s">]+)/);
        return match ? match[1] : null;
    } catch (error) {
        console.error("Error reading file:", error.message);
        return null; // Return null or handle it as per your requirements
    }
}

function removeAfterFirstSlash(url) {
    const slashIndex = url.indexOf('/');
    return slashIndex !== -1 ? url.substring(0, slashIndex) : url;
}

function extractAfterLastSlash(url) {
    if (typeof url !== 'string') {
        console.error("Error: Invalid URL. Expected a string but got:", url);
        return null; // or an appropriate default value
    }
    return url.split('/').pop();
}

function moveFile(sourcePath, url, destinationPath) {
    // Ensure the destination directory exists
    const destinationDir = path.dirname(destinationPath); // Get the directory from the destination path
    if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Move the file
    fs.rename(sourcePath, destinationPath, (err) => {
        if (err) {
            console.error(`Error moving file: ${err}`);
        } else {
            console.log(`File moved successfully to ${destinationPath}`);
        }
    });
}

// Deletes everything but the desired HTML doc
function cleanUpDatabase(excludeFolder) {
  const databasePath = path.join(__dirname, 'WebsiteTempDatabase');
  
  // If directory DNE, output message
  fs.readdir(databasePath, (err, files) => {
      if (err) {
          console.error(`Error reading directory: ${err}`);
          return;
      }
      
      // Iterates through and deletes all the not excluded folders
      files.forEach(file => {
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
        const data = fs.readFileSync(filePath, 'utf-8');
        const titleMatch = data.match(/<title[^>]*>([^<]*)<\/title>/i);
        return titleMatch && titleMatch[1].trim() ? titleMatch[1].trim() : 'No Title';
    } catch (error) {
        console.error(`Error reading file: ${error}`);
        return 'No Title';
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
    return new Promise(resolve => setTimeout(resolve, ms));
}









const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the 'build' folder
app.use(express.static(path.join(__dirname, 'build')));



// API Routes should come BEFORE the catch-all route
//this is the load page endpoint
app.get('/api/get-links', async (req, res) => {
    console.log('Load page endpoint was hit.');

    try {
        const websites = await getWebsites();
        console.log('Fetched websites:', websites); // Debug log

        // Check if websites is undefined or null
        if (!websites) {
            console.log('No websites found in database');
            return res.send(`
                <div class="websites-container">
                    <div class="no-websites">No websites found</div>
                </div>
            `);
        }

        // Convert the data to HTML format
        const html = `
            <div class="websites-container">
                ${Array.isArray(websites) ? websites.map(website => `
                    <div class="website-item">
                        <a class="website-link" href="${website?.link || '#'}">${website?.link || 'No Link'}</a>
                        <div class="website-title">${website?.title || 'No Title'}</div>
                        <div class="website-date">${website?.savedAt ? new Date(website.savedAt).toLocaleDateString() : 'No Date'}</div>
                    </div>
                `).join('') : '<div class="error">Invalid data format</div>'}
            </div>
        `;
        res.send(html);
    } catch (error) {
        console.error('Error fetching websites:', error);
        res.status(500).send('<div class="error">Failed to fetch websites</div>');
    }
});






// Serve the index.html for all routes (for React Router or other SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



// Example POST endpoint
app.post('/api/save-link', async (req, res) => {
  const { link } = req.body;
  if (!link) {
    return res.status(400).json({ message: 'Link is required' });
  }

  console.log(`Link received: ${link}`);

    //httrack $(link) -r0 -O /OutputLocation
    // httrack is a url html file downloader
    // -r2 means recusive depth of 0 or just the current page plus one link away for the most infomation on the current page
    // -%eN0 means to set the external links depth to 0
    // -O is the output directory
    console.log(`Running Command: "httrack ${link} -r1 -O WebsiteTempDatabase -%eN0"`);
    const command = `httrack ${link} -r1  -O WebsiteTempDatabase -%eN0`;
  exec(command, async (err, stdout, stderr) => {
    if (err) {
      console.error('Error executing command:', err);
      return res.status(500).json({ message: 'Failed to execute command' });
    }
    console.log(`Command output:`);
    console.log(`${stdout}`);
      
      // way to move the wanted html file
      const url = extractUrl('WebsiteTempDatabase/index.html');

      if(url == null)
      { // try moving //file.type websites ex: apple.com/Iphone.PDF
        try {
        const Nohttps = removeFirstEightChars(link);
        console.log(`**$$@@Not Supported URL@@@$$**: ${Nohttps}`);

        const DownloadedHTMLfile = extractAfterLastSlash(Nohttps);
        console.log(`@@$$@@ Wanted File: ${DownloadedHTMLfile}`);
        const WEBsite = removeAfterFirstSlash(Nohttps);
        console.log(`@@$$@@ From Website: ${WEBsite}`);
        const destinationFilePath = path.join('../database', 'Websites', WEBsite, DownloadedHTMLfile); // Destination path for the database

        moveFile(path.join('WebsiteTempDatabase', Nohttps), Nohttps, destinationFilePath); // Move the wanted file
        await delay(2000);
        cleanUpDatabase('DownloadedHTML'); // Clean up everything except DownloadedHTML folder
        await delay(2000);     
        // Add file data to database
        const fullPath = path.resolve(destinationFilePath);
        console.log(`Fullpath: ${fullPath}`);
        const title = removeLastFourChars(DownloadedHTMLfile);
        console.log(`Page Title: ${title}`); // Read the title
        insertWebsite(Nohttps, title, fullPath);
        return res.status(200).json({ message: `Link saved: ${link}` }); // Success response
        
        } catch (error) {
            console.error(`Error processing file operations from: ${link}`, error.message);
            return res.status(500).json({ message: `An error occurred during file processing from: ${link}` }); // Error response
        }

      }
      else{
        const DownloadedHTMLfile = extractAfterLastSlash(url);
        console.log(`HTML Wanted File: ${DownloadedHTMLfile}`);
        console.log(`Extracted URL: ${url}`);
        const WEBsite = removeAfterFirstSlash(url);
        console.log(`Extracted domain: ${WEBsite}`); 

        // check that helps the backend stop from failing after error input
        if (url == null) {
            return res.status(200).json({ message: 'Link failed' }); // Link extraction failed
        } else {

            //const destinationFilePath = path.join(__dirname, 'WebsiteTempDatabase', 'DownloadedHTML', DownloadedHTMLfile); // Destination path for the file
            const destinationFilePath = path.join('../database', 'Websites', WEBsite, DownloadedHTMLfile); // Destination path for the database

            try {
                
                moveFile(path.join('WebsiteTempDatabase', url), url, destinationFilePath); // Move the wanted file
                await delay(2000);
                cleanUpDatabase('DownloadedHTML'); // Clean up everything except DownloadedHTML folder
                await delay(2000);
                // Add file data to database
                const fullPath = path.resolve(destinationFilePath);
                console.log(`Fullpath: ${fullPath}`);
                let title = readHtmlTitle(destinationFilePath);
                console.log(`Page Title: ${title}`); // Read the HTML title
                insertWebsite(url, title, fullPath);
                

                
                return res.status(200).json({ message: `Link saved: ${link}` }); // Success response
        
            } catch (error) {
                console.error(`Error processing file operations from: ${link}`, error.message);
                return res.status(500).json({ message: `An error occurred during file processing from: ${link}` }); // Error response
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

  if (platform === 'win32') {
    command = 'start http://localhost:3000';
  } else if (platform === 'darwin') {
    command = 'open http://localhost:3000';
  } else if (platform === 'linux') {
    command = 'xdg-open http://localhost:3000';
  }

  exec(command, (err) => {
    if (err) {
      console.error('Failed to open browser:', err);
    }
  });
});
