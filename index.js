const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/log');

// Express Setup
const app = express();
const port = process.env.PORT || 8080;

// Serve index.html
app.get('/', (req, res) => {
  const indexFile = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.send('<h1>🌐 Dashboard Online - No index.html Found</h1>');
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send('❌ 404: Page not found');
});

// Start Web Server
app.listen(port, () => {
  logger(`🌐 Web server started on port ${port}`, "[ Web ]");
});

// Start Bot by requiring rudra.js directly
require('./rudra');
