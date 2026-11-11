export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export const CONDITION_LABEL: Record<string, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak ringan",
  rusak_berat: "Rusak berat",
};

export function isOverdue(due: string, status: string) {
  return status === "approved" && new Date(due) < new Date(new Date().toDateString());
}
