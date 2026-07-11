import { useEffect, useState } from "react";
import { bookingApi } from "../../api/bookingApi";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { formatCurrency } from "../../utils/format";
import { Link } from "react-router-dom";

export function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [refundBookingId, setRefundBookingId] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    bookingApi.mine().then((response) => setBookings(response.data)).catch(() => setBookings([]));
  }

  useEffect(() => load(), []);

  async function cancelBooking(id) {
    if (!window.confirm("Bạn chắc chắn muốn hủy booking này?")) return;
    await bookingApi.cancel(id);
    load();
  }

  async function payBooking(id, method = "momo") {
    await bookingApi.simulatePayment(id, { method, succeed: true });
    load();
  }

  async function requestRefund(booking) {
    setError("");
    if (refundReason.trim().length < 5) {
      setError("Vui lòng nhập lý do hoàn tiền ít nhất 5 ký tự.");
      return;
    }
    try {
      await bookingApi.requestRefund(booking.id, { reason: refundReason.trim() });
      setMessage("Đã gửi yêu cầu hoàn tiền. ADMIN sẽ xem xét và xử lý.");
      setRefundBookingId(null);
      setRefundReason("");
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể gửi yêu cầu hoàn tiền.");
    }
  }

  return (
    <div className="page">
      <section className="page-title">
        <span className="eyebrow">Tài khoản</span>
        <h1>Booking của tôi</h1>
      </section>
      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}
      {bookings.length ? (
        <div className="table-card">
          <table>
            <thead><tr><th>Mã</th><th>Tour</th><th>Số người</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>#{booking.id}</td>
                  <td>{booking.tour_title || `Tour #${booking.tour_id}`}</td>
                  <td>{booking.adult_count + booking.child_count}</td>
                  <td>{formatCurrency(booking.total_price)}</td>
                  <td><StatusBadge status={booking.payment?.status || "unpaid"} /></td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td>
                    <Link className="ghost-button" to={`/my-bookings/${booking.id}`}>Chi tiết</Link>
                    {!booking.payment?.status || ["unpaid", "failed"].includes(booking.payment.status) ? (
                      <button className="primary-button" onClick={() => payBooking(booking.id)}>Thanh toán giả lập</button>
                    ) : null}
                    {["pending", "confirmed"].includes(booking.status) && booking.payment?.status !== "paid" && (
                      <button className="ghost-button" onClick={() => cancelBooking(booking.id)}>Hủy</button>
                    )}
                    {booking.payment?.status === "paid" && !booking.refund_requested && booking.status !== "completed" && (
                      <button className="ghost-button" onClick={() => { setRefundBookingId(booking.id); setRefundReason(""); }}>Yêu cầu hoàn tiền</button>
                    )}
                    {booking.refund_requested && <span className="refund-pending-label">Đang chờ hoàn tiền</span>}
                    {refundBookingId === booking.id && (
                      <div className="refund-request-box">
                        <textarea rows="3" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Lý do yêu cầu hoàn tiền" />
                        <div className="inline-actions">
                          <button className="primary-button" type="button" onClick={() => requestRefund(booking)}>Gửi yêu cầu</button>
                          <button className="ghost-button" type="button" onClick={() => setRefundBookingId(null)}>Hủy</button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="Chưa có booking" message="Bạn chưa đặt tour nào." />}
    </div>
  );
}
