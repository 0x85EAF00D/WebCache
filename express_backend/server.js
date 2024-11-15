// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process");
const routes = require("./routes");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));
app.use("/", routes);

// Serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start server and open browser
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  const platformCommands = {
    win32: "start http://localhost:3000",
    darwin: "open http://localhost:3000",
    linux: "xdg-open http://localhost:3000",
  };

  const command = platformCommands[process.platform];
  if (command) {
    exec(command, (err) => {
      if (err) console.error("Failed to open browser:", err);
    });
  }
});

/* //file layout, DO NOT DELETE
src/
  ├── controllers/
  │   ├── loadController.js
  │   └── saveController.js
  ├── services/
  │   ├── fileService.js
  │   ├── httrackService.js
  │   ├── databaseService.js
  │   └── encryptionService.js
  ├── utils/
  │   ├── urlUtils.js
  │   ├── timeUtils.js
  │   └── pathUtils.js
  ├── routes/
  │   └── index.js
  ├── models/
  │   └── website.js
  └── server.js
  */
