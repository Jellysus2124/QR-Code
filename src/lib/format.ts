export function formatVietnamTime(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}
