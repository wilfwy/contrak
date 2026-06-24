const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const contractRoutes = require('./routes/contract.routes');
const billingRoutes = require('./routes/billing.routes');
const ebookRoutes = require('./routes/ebook.routes');
const productsRoutes = require('./routes/products.routes');
const ordersRoutes = require('./routes/orders.routes');
const exportsRoutes = require('./routes/exports.routes');
const pagesRoutes = require('./routes/pages.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const couponsRoutes = require('./routes/coupons.routes');
const mediaRoutes = require('./routes/media.routes');
const academyRoutes = require('./routes/academy.routes');
const cartRoutes = require('./routes/cart.routes');
const aiRoutes = require('./routes/ai.routes');
const publicRoutes = require('./routes/public.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const seoController = require('./controllers/seo.controller');
const blogRoutes = require('./routes/blog.routes');
const { getProductBySlug } = require('./services/firebase.service');

const app = express();


// Middlewares
app.use(cors());

// Stripe webhook needs raw body BEFORE express.json() parses it
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

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

app.get('/sitemap.xml', seoController.sitemapXml);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/blog', blogRoutes);


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

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

app.get('/pages', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pages.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.get('/media', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'media.html'));
});

app.get('/orders-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'orders-admin.html'));
});

app.get('/thank-you', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'thank-you.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'cart.html'));
});

app.get('/p/:slug', async (req, res, next) => {
  try {
    const product = await getProductBySlug(req.params.slug);
    if (product && product.landingPageSlug) {
      return res.redirect('/l/' + product.landingPageSlug);
    }
  } catch (e) {}
  res.sendFile(path.join(__dirname, 'views', 'product-page.html'));
});

app.get('/l/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'page-public.html'));
});

app.get('/blog-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog-admin.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog.html'));
});

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'article.html'));
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
