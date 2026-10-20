/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // AVIF first, WebP fallback. The landing ships ~12MB of source PNG/JPG;
    // served through next/image these become a few hundred KB.
    formats: ['image/avif', 'image/webp'],
    // Widths actually used by the landing art direction, so the optimizer
    // never generates sizes nothing requests.
    deviceSizes: [640, 828, 1080, 1200, 1920, 2048],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
}
export default nextConfig
