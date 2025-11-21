const fs = require('fs');
const path = require('path');

const baseUrl = 'https://startupwing.com';
const pages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/about', priority: '0.8', changefreq: 'weekly' },
  { url: '/features', priority: '0.8', changefreq: 'weekly' },
  { url: '/services', priority: '0.8', changefreq: 'weekly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  { url: '/dashboard', priority: '0.9', changefreq: 'daily' }
];

const generateSitemap = () => {
  const today = new Date().toISOString().split('T')[0];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(
    path.join(__dirname, '../public/sitemap.xml'),
    sitemap
  );
  
  console.log('✅ Sitemap generated successfully!');
};

generateSitemap();