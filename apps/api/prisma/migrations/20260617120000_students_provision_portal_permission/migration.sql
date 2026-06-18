-- Add students.provision-portal permission for PPDB/student portal provisioning.
INSERT INTO "permissions" ("id", "key", "name", "group", "description", "created_at", "updated_at")
VALUES (
  'clstudentsprovisionportal01',
  'students.provision-portal',
  'students.provision-portal',
  'students',
  'Permission students.provision-portal',
  NOW(),
  NOW()
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r.id, p.id, NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."key" = 'students.provision-portal'
  AND r."slug" IN ('super-admin', 'admin-sekolah', 'waka-kesiswaan', 'panitia-ppdb')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
