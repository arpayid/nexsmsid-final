import process from "node:process";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

if (process.env.NODE_ENV === "production" && !process.env.API_INTERNAL_URL) {
  process.emitWarning("API_INTERNAL_URL is not set; falling back to http://localhost:4000", {
    type: "next.config",
  });
}

const nextConfig = {
  transpilePackages: ["@nexsmsid/api-client", "@nexsmsid/types", "@nexsmsid/ui"],
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiInternalUrl}/api/v1/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${apiInternalUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
