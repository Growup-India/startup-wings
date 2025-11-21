import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = 'Startup Wing - Transform Your Idea into Reality',
  description = 'Launch your startup with confidence using guided validation, market research, and expert mentorship.',
  keywords = 'startup, entrepreneurship, business validation',
  canonical = '',
  ogImage = 'https://startupwing.com/og-image.jpg',
  ogType = 'website',
}) => {
  const siteUrl = 'https://startupwing.com';
  const fullUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
