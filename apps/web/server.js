const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, '..', '..', 'dist', 'apps', 'web', 'browser');

// Serve static files from the Angular build output
app.use(express.static(DIST_DIR));

// Fallback all non-file requests to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
