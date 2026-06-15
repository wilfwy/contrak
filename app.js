const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const contractRoutes = require('./routes/contract.routes');
const billingRoutes = require('./routes/billing.routes');
const ebookRoutes = require('./routes/ebook.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir les fichiers statiques (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Vues HTML servies directement comme fichiers statiques

// Routes publiques - pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pricing.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/ebooks', ebookRoutes);

// Routes protégées
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/contracts/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contract-new.html'));
});

app.get('/ebooks', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'ebooks.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Server error'
  });
});

module.exports = app;
