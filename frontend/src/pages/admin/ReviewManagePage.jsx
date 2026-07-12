import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { Pagination } from "../../components/common/Pagination.jsx";

export function ReviewManagePage() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function load() {
    adminApi.reviews({ ...(filter ? { is_visible: filter === "visible" } : {}), skip: (page - 1) * pageSize, limit: pageSize }).then((response) => setReviews(response.data)).catch(() => setReviews([]));
  }

  useEffect(() => load(), [filter, page]);

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
        <div><span className="eyebrow">Reviews</span><h1>Quản lý đánh giá</h1></div>
        <p>Kiểm duyệt nội dung đánh giá hiển thị trên trang chi tiết tour.</p>
      </section>

      <section className="admin-table-card">
        <div className="admin-list-toolbar">
          <label>Hiển thị:
            <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
              <option value="">Tất cả</option>
              <option value="visible">Đang hiển thị</option>
              <option value="hidden">Đã ẩn</option>
            </select>
          </label>
          <Pagination page={page} pageSize={pageSize} itemCount={reviews.length} onChange={setPage} />
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table">
            <thead><tr><th>Tour</th><th>User</th><th>Sao</th><th>Nội dung</th><th>Hiển thị</th><th>Thao tác</th></tr></thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>#{review.tour_id}</td>
                  <td>#{review.user_id}</td>
                  <td><span className="rating-cell"><Star size={14} />{review.rating}/5</span></td>
                  <td className="review-comment-cell">{review.comment || "—"}</td>
                  <td><span className={review.is_visible ? "stock-pill available" : "stock-pill soldout"}>{review.is_visible ? "Có" : "Không"}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="ghost-button" onClick={() => toggle(review)}>
                        {review.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}
                        {review.is_visible ? "Ẩn" : "Hiện"}
                      </button>
                      <button className="icon-button danger" onClick={() => remove(review.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!reviews.length && <p className="empty-report">Chưa có đánh giá.</p>}
        <div className="admin-table-footer"><span>Hiển thị {reviews.length} đánh giá</span></div>
      </section>
    </div>
  );
}
