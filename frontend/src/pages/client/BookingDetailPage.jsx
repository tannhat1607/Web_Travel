import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bookingApi } from "../../api/bookingApi";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { formatCurrency } from "../../utils/format";

export function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    bookingApi.detail(id).then((response) => setBooking(response.data));
  }, [id]);

  if (!booking) return <div className="page"><p>Đang tải booking...</p></div>;

  return (
    <div className="page booking-detail-page">
      <Link className="ghost-button" to="/my-bookings"><ArrowLeft size={16} />Booking của tôi</Link>
      <section className="page-title">
        <span className="eyebrow">Booking #{booking.id}</span>
        <h1>{booking.tour_title}</h1>
      </section>
      <div className="booking-detail-grid">
        <section className="admin-card">
          <h2>Thông tin chuyến đi</h2>
          <dl>
            <div>
              <dt>Khởi hành</dt>
              <dd>{booking.departure_at ? new Date(booking.departure_at).toLocaleString("vi-VN") : "Lịch linh hoạt"}</dd>
            </div>
            <div>
              <dt>Hành khách</dt>
              <dd>{booking.adult_count} người lớn · {booking.child_count} trẻ em</dd>
            </div>
            <div>
              <dt>Người đặt</dt>
              <dd>{booking.customer_name}<br />{booking.customer_email}<br />{booking.customer_phone}</dd>
            </div>
            <div>
              <dt>Ghi chú</dt>
              <dd>{booking.note || "Không có"}</dd>
            </div>
          </dl>
        </section>
        <aside className="summary-panel">
          <h2>Thanh toán</h2>
          <div><span>Booking</span><StatusBadge status={booking.status} /></div>
          <div><span>Giao dịch</span><StatusBadge status={booking.payment?.status || "unpaid"} /></div>
          <div><span>Phương thức</span><strong>{booking.payment?.method || "—"}</strong></div>
          {Number(booking.loyalty_discount || 0) > 0 && (
            <div>
              <span>Ưu đãi hạng {booking.loyalty_tier_label}</span>
              <strong>-{formatCurrency(booking.loyalty_discount)}</strong>
            </div>
          )}
          <div><span>Tổng tiền</span><strong>{formatCurrency(booking.total_price)}</strong></div>
          <div><span>Điểm nhận sau chuyến</span><strong>{Number(booking.points_earned || Math.floor(Number(booking.total_price || 0) / 1000)).toLocaleString("vi-VN")} điểm</strong></div>
        </aside>
      </div>
    </div>
  );
}
