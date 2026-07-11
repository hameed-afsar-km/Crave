import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.firebaseio.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://firebasestorage.googleapis.com https://res.cloudinary.com *.googleapis.com *.gstatic.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://checkout.razorpay.com https://api.razorpay.com wss://*.firebaseio.com",
              "frame-src 'self' https://checkout.razorpay.com",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "report-uri /api/csp-violation",
              "report-to csp-endpoint",
            ].join('; '),
          },
          { key: 'Link', value: '<https://firebasestorage.googleapis.com>; rel=preconnect' },
          { key: 'Link', value: '<https://checkout.razorpay.com>; rel=preconnect' },
          { key: 'Link', value: '<https://images.unsplash.com>; rel=dns-prefetch' },
          {
            key: 'Report-To',
            value: JSON.stringify({
              group: 'csp-endpoint',
              max_age: 10886400,
              endpoints: [{ url: '/api/csp-violation' }],
            }),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
