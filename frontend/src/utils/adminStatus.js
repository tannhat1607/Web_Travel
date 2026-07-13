export const ADMIN_STATUS_EVENT = "admin-action-status";

export function emitAdminStatus(detail) {
  window.dispatchEvent(new CustomEvent(ADMIN_STATUS_EVENT, { detail }));
}

function requestData(config) {
  if (!config?.data || typeof FormData !== "undefined" && config.data instanceof FormData) return {};
  if (typeof config.data === "object") return config.data;
  try {
    return JSON.parse(config.data);
  } catch {
    return {};
  }
}

export function adminActionMessages(config) {
  const method = String(config?.method || "get").toLowerCase();
  const url = String(config?.url || "");
  const data = requestData(config);

  if (method === "get") return null;
  if (url.includes("upload")) return ["Đang upload...", "Upload thành công.", "Upload thất bại."];
  if (url.includes("/reply")) return ["Đang lưu phản hồi...", "Lưu phản hồi thành công.", "Lưu phản hồi thất bại."];
  if (url.includes("refund")) return ["Đang xử lý hoàn tiền...", "Xử lý hoàn tiền thành công.", "Xử lý hoàn tiền thất bại."];
  if (url.includes("/content/admin/") && method === "patch" && "is_published" in data) {
    return data.is_published
      ? ["Đang đăng nội dung...", "Đăng nội dung thành công.", "Đăng nội dung thất bại."]
      : ["Đang ẩn nội dung...", "Ẩn nội dung thành công.", "Ẩn nội dung thất bại."];
  }
  if (method === "delete") return ["Đang xóa...", "Xóa thành công.", "Xóa thất bại."];
  if (method === "post") return ["Đang tạo dữ liệu...", "Tạo mới thành công.", "Tạo mới thất bại."];
  return ["Đang lưu thay đổi...", "Cập nhật thành công.", "Cập nhật thất bại."];
}
