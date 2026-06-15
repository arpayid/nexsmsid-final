export type PortalKind = "admin" | "teacher" | "student" | "guardian" | "unassigned";

export const ADMIN_ROLE_KEYWORDS = [
  "super-admin",
  "admin-sekolah",
  "staff-tu",
  "bendahara",
  "panitia-ppdb",
  "admin-bkk",
  "kepala-sekolah",
  "waka-kurikulum",
  "waka-kesiswaan",
  "pembimbing-pkl",
];

export function resolvePortalForUser(user: { roles: string[] } | null | undefined): PortalKind {
  if (!user || !user.roles?.length) return "unassigned";
  const roles = user.roles;
  if (roles.some((r) => ADMIN_ROLE_KEYWORDS.includes(r))) return "admin";
  if (roles.includes("guru") || roles.includes("wali-kelas")) return "teacher";
  if (roles.includes("siswa")) return "student";
  if (roles.includes("orang-tua-wali")) return "guardian";
  return "unassigned";
}

export function portalHomePath(portal: PortalKind): string {
  switch (portal) {
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    case "guardian":
      return "/guardian";
    case "unassigned":
      return "/account/unassigned";
    case "admin":
    default:
      return "/admin";
  }
}

export function defaultLandingPath(user: { roles: string[] } | null | undefined): string {
  return portalHomePath(resolvePortalForUser(user));
}
