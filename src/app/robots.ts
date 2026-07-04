import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://crave.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/menu',
          '/menu/*',
          '/cart',
          '/rewards',
          '/auth',
          '/report-bug',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/security/',
          '/checkout/',
          '/orders/',
          '/order/',
          '/profile/',
          '/cart/checkout',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
