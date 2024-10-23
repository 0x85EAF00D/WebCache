const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process'); // Import child_process module

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

  // Respond with a success message
  res.status(200).json({ message: 'Link saved successfully!' });
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
