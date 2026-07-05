import { SearchX } from "lucide-react";

export function EmptyState({ title = "Không có dữ liệu", message = "Thử thay đổi bộ lọc hoặc quay lại sau." }) {
  return (
    <div className="empty-state">
      <SearchX size={34} />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
