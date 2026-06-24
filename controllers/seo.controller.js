const { listProductsByOwner, getProductById, getProductBySlug } = require('../services/firebase.service');

async function sitemapXml(req, res) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const { getDb } = require('../services/firebase.service');

    const urls = [];

    // Static pages
    const staticPages = ['/', '/pricing', '/login', '/register', '/blog'];
    staticPages.forEach(page => {
      urls.push({ loc: frontendUrl + page, changefreq: 'weekly', priority: page === '/' ? '1.0' : '0.8' });
    });

    // Published products
    const productsSnap = await getDb().collection('products').where('status', '==', 'published').get();
    productsSnap.forEach(doc => {
      const p = doc.data();
      urls.push({ loc: `${frontendUrl}/p/${p.slug || doc.id}`, changefreq: 'monthly', priority: '0.7' });
    });

    // Published pages
    const pagesSnap = await getDb().collection('pages').where('status', '==', 'published').get();
    pagesSnap.forEach(doc => {
      const p = doc.data();
      urls.push({ loc: `${frontendUrl}/l/${p.slug || doc.id}`, changefreq: 'monthly', priority: '0.6' });
    });

    // Published articles
    const articlesSnap = await getDb().collection('articles').where('status', '==', 'published').get();
    articlesSnap.forEach(doc => {
      const a = doc.data();
      urls.push({ loc: `${frontendUrl}/blog/${a.slug || doc.id}`, changefreq: 'monthly', priority: '0.6' });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
}

module.exports = { sitemapXml };
