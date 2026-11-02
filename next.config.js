/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking by disallowing framing
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent browsers from MIME-sniffing the response
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer information sent in HTTP requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict unnecessary browser feature capabilities
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
