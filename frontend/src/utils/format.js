export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(Number(value)).replace(/\s+/g, " ");
}

export function statusLabel(status) {
  const labels = {
    pending: "Đang chờ",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
    completed: "Hoàn thành",
    unpaid: "Chưa thanh toán",
    paid: "Đã thanh toán",
    failed: "Thất bại",
    refunded: "Hoàn tiền",
  };
  return labels[status] || status;
}
