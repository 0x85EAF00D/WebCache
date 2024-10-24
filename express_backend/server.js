const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process'); // Import child_process module
const fs = require('fs'); // "File System" used to search index.html for exact html file

function extractUrl(filename) {
    const content = fs.readFileSync(filename, 'utf-8');
    const match = content.match(/URL=([^\s">]+)/);
    return match ? match[1] : null;
}

function extractAfterLastSlash(url) {
    return url.split('/').pop();
}

function moveFile(sourcePath, destinationPath) {
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


const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the 'build' folder
app.use(express.static(path.join(__dirname, 'build')));

// Serve the index.html for all routes (for React Router or other SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Example POST endpoint
app.post('/api/save-link', (req, res) => {
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
    console.log(`Running Command: "httrack ${link} -r2 -O WebsiteTempDatabase -%eN0"`);
    const command = `httrack ${link} -r2  -O WebsiteTempDatabase -%eN0`;
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error executing command:', err);
      return res.status(500).json({ message: 'Failed to execute command' });
    }
    console.log(`Command output:`);
    console.log(`${stdout}`);
      
      // way to move the wanted html file
      const url = extractUrl('WebsiteTempDatabase/index.html');
      console.log(`Extracted URL: ${url}`);
      const DownloadedHTMLfile = extractAfterLastSlash(url);
            console.log('HTML Wanted File: ${DownloadedHTMLfile}');
      
      const destinationFilePath = path.join(__dirname, 'WebsiteTempDatabase', 'DownloadedHTML', DownloadedHTMLfile); // Destination file

     

      moveFile('WebsiteTempDatabase/' + url, destinationFilePath); // Move the wanted file

      cleanUpDatabase('DownloadedHTML'); // Clean up everything but the DownloadedHTML folder

      res.status(200).json({ message: 'Link saved, command executed, and cleanup completed!' }); // Success message

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
