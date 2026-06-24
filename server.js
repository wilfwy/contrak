require('dotenv').config();

let app;
try {
  app = require('./app');
} catch (e) {
  console.error('FATAL: App initialization failed:', e);
  const express = require('express');
  app = express();
  app.get('*', (req, res) => {
    res.status(500).send(`<pre>Server initialization error:\n${e.message}\n\nStack:\n${e.stack}</pre>`);
  });
}

// Vercel serverless export
module.exports = app;

// Local development: listen on port
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  });
}
