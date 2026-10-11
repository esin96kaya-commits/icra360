import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

function loadRootEnv() {
  const envPath = resolve(__dirname, "../../.env");
  try {
    const text = readFileSync(envPath, "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }
      const eq = line.indexOf("=");
      if (eq < 1) {
        continue;
      }
      const key = line.slice(0, eq);
      const value = line.slice(eq + 1);
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Root .env is optional in CI.
  }
}

loadRootEnv();

const nextConfig: NextConfig = {
  transpilePackages: [
    "@icra360/db",
    "@icra360/auth",
    "@icra360/domain",
    "@icra360/contracts",
    "@icra360/crypto",
    "@icra360/audit",
  ],
  serverExternalPackages: ["@prisma/client", "argon2"],
  typedRoutes: false,
  allowedDevOrigins: ["127.0.0.1", "172.20.10.2"],
  devIndicators: false,
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias as Record<string, string[] | undefined>),
      ".js": [".ts", ".tsx", ".js"],
    };
    if (isServer) {
      const current = config.externals;
      const extra = ["argon2"];
      if (Array.isArray(current)) {
        config.externals = [...current, ...extra];
      } else if (current) {
        config.externals = [current, ...extra];
      } else {
        config.externals = extra;
      }
    }
    return config;
  },
};

export default nextConfig;
