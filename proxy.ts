import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  contentSecurityPolicy: {
    directives: {
      "script-src": ["https://*.paypal.com", "https://*.paypalobjects.com"],
      "style-src": ["https://*.paypal.com"],
      "connect-src": ["blob:", "https://*.paypal.com"],
      "frame-src": ["https://*.paypal.com"],
      "img-src": ["data:", "blob:", "https:", "https://*.paypalobjects.com"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'none'"],
    },
  },
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
