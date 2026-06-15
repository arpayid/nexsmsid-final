import { Badge, type BadgeProps } from "./badge";

export type StatusBadgeVariant = NonNullable<BadgeProps["variant"]>;

export type StatusBadgeMap = Record<string, { label?: string; variant?: StatusBadgeVariant }>;

const successWords = ["ACTIVE", "APPROVED", "ACCEPTED", "COMPLETED", "PAID", "PUBLISHED", "VERIFIED", "WORKING", "READ"];
const warningWords = ["CANCELLED", "CLOSED", "FAILED", "OVERDUE", "REJECTED", "RESIGNED", "SUSPENDED", "UNEMPLOYED", "DELETED"];
const infoWords = ["ONGOING", "PROCESSING", "ISSUED", "PARTIAL", "REVIEW", "SUBMITTED", "INTERVIEW", "UNREAD"];

export type StatusBadgeProps = {
  className?: string;
  map?: StatusBadgeMap;
  value: unknown;
};

export function StatusBadge({ className, map, value }: StatusBadgeProps) {
  const key = String(value ?? "-");
  const normalized = key.toUpperCase();
  const configured = map?.[key] ?? map?.[normalized];
  const label = configured?.label ?? labelize(key);
  const variant = configured?.variant ?? inferVariant(normalized);

  return (
    <Badge className={className} variant={variant}>
      {label}
    </Badge>
  );
}

export function inferStatusVariant(value: string): StatusBadgeVariant {
  return inferVariant(value.toUpperCase());
}

function inferVariant(value: string): StatusBadgeVariant {
  if (successWords.some((word) => value.includes(word))) return "success";
  if (warningWords.some((word) => value.includes(word))) return "warning";
  if (infoWords.some((word) => value.includes(word))) return "info";
  return "outline";
}

function labelize(value: string) {
  if (!value || value === "-") return "-";
  return value.replace(/_/g, " ");
}
