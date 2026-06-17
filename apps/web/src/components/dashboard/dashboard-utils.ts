export const CHART_COLORS = ["#14997a", "#0ea5e9", "#10b981", "#f97316", "#ef4444", "#14b8a6", "#64748b"];

export const CHART_TOOLTIP_STYLE = {
  border: "1px solid hsl(214 20% 90%)",
  borderRadius: 16,
  boxShadow: "0 16px 45px rgba(15, 23, 42, 0.08)",
};

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { currency: "IDR", maximumFractionDigits: 0, style: "currency" }).format(value ?? 0);
}

export function percentChange(previous: number, current: number): number | null {
  if (previous <= 0 && current <= 0) return null;
  if (previous <= 0) return 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
