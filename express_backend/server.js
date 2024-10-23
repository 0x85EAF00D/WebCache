const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

app.use(express.static(path.join(__dirname, '')))

// gets other routes (React router)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'index.html'));
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
});
