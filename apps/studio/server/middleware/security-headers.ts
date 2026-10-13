const directives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
];

const csp = [...directives, "frame-ancestors 'self'"].join("; ");
const watchCsp = [...directives, "frame-ancestors 'self' http://127.0.0.1:* http://localhost:*"].join("; ");

export default defineEventHandler((event) => {
  if (process.env.NODE_ENV !== "production") return;
  setHeader(event, "Content-Security-Policy", event.path.split("?")[0] === "/view" ? watchCsp : csp);
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");
});
