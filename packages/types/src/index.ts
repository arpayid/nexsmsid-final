export type AppEnvironment = "development" | "test" | "production";

export { ADMIN_ROLE_KEYWORDS, defaultLandingPath, portalHomePath, resolvePortalForUser, type PortalKind } from "./portal-routing.js";

export type HealthStatus = {
  service: string;
  status: "ok";
  timestamp: string;
  uptime?: number;
  database?: {
    provider: string;
    status: string;
  };
  redis?: {
    status: string;
    url: string;
  };
};
