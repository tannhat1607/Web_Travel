import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { Pagination } from "../../components/common/Pagination.jsx";

export function ReviewManagePage() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("");
  const [page,setPage]=useState(1); const pageSize=10;

  function load() {
    adminApi.reviews({...(filter ? { is_visible: filter === "visible" } : {}),skip:(page-1)*pageSize,limit:pageSize}).then((response) => setReviews(response.data)).catch(() => setReviews([]));
  }

  useEffect(() => load(), [filter,page]);

  async function toggle(review) {
    await adminApi.updateReview(review.id, { is_visible: !review.is_visible });
    load();
  }

  async function remove(id) {
    if (!window.confirm("Xóa review này?")) return;
    await adminApi.deleteReview(id);
    load();
  }

  return (
    <div className="admin-page">
      <section className="admin-title">
        <span className="eyebrow">Reviews</span>
        <h1>Quản lý đánh giá</h1>
      </section>
      <div className="toolbar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">Tất cả</option>
          <option value="visible">Đang hiển thị</option>
          <option value="hidden">Đã ẩn</option>
        </select>
      </div>
      <Pagination page={page} pageSize={pageSize} itemCount={reviews.length} onChange={setPage}/>
      <div className="table-card">
        <table>
          <thead><tr><th>Tour</th><th>User</th><th>Sao</th><th>Nội dung</th><th>Hiển thị</th><th></th></tr></thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>#{review.tour_id}</td>
                <td>#{review.user_id}</td>
                <td>{review.rating}/5</td>
                <td>{review.comment || "-"}</td>
                <td>{review.is_visible ? "Có" : "Không"}</td>
                <td>
                  <div className="inline-actions">
                    <button className="ghost-button" onClick={() => toggle(review)}>
                      {review.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}
                      {review.is_visible ? "Ẩn" : "Hiện"}
                    </button>
                    <button className="icon-button danger" onClick={() => remove(review.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
