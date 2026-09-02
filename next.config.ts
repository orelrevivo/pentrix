import type { NextConfig } from "next";

const clerkSrc = "https://clerk.pentrix.site https://*.clerk.accounts.dev https://img.clerk.com https://clerk-telemetry.com https://*.clerk-telemetry.com https://*.protect.clerk.com";
const paypalSrc = "https://*.paypal.com https://*.paypalobjects.com";
const stripeSrc = "https://*.js.stripe.com https://js.stripe.com https://hooks.stripe.com https://api.stripe.com";

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval' ${clerkSrc} ${stripeSrc} ${paypalSrc} https://maps.googleapis.com`,
  `style-src 'self' 'unsafe-inline' ${paypalSrc}`,
  `img-src 'self' data: blob: https: ${clerkSrc}`,
  `font-src 'self' https://fonts.gstatic.com`,
  `connect-src 'self' ${clerkSrc} ${stripeSrc} ${paypalSrc} https://maps.googleapis.com blob:`,
  `frame-src 'self' https://challenges.cloudflare.com ${stripeSrc} ${paypalSrc} https://*.protect.clerk.com`,
  `worker-src 'self' blob:`,
  `form-action 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://www.paypal.com\")" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      ],
    }];
  },
};

export default nextConfig;
