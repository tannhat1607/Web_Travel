import { CheckCircle2, CircleDollarSign, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { formatCurrency } from "../../utils/format";
import { Pagination } from "../../components/common/Pagination.jsx";

export function BookingManagePage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function load() {
    adminApi.bookings({ ...(filter ? { status_filter: filter } : {}), skip: (page - 1) * pageSize, limit: pageSize }).then((response) => setBookings(response.data)).catch(() => setBookings([]));
  }

  useEffect(() => load(), [filter, page]);

  async function runAction(action, successMessage) {
    setMessage("");
    await action();
    setMessage(successMessage);
    load();
  }

  async function createCashPayment(booking) {
    await runAction(
      () => adminApi.createPayment({ booking_id: booking.id, method: "cash", amount: booking.total_price }),
      "Đã tạo payment tiền mặt."
    );
  }

  async function paymentAction(booking, action) {
    if (!booking.payment) return;
    const actions = {
      paid: () => adminApi.markPaymentPaid(booking.payment.id),
      failed: () => adminApi.markPaymentFailed(booking.payment.id),
      refunded: () => adminApi.refundPayment(booking.payment.id),
    };
    await runAction(actions[action], action === "paid" ? "Đã xác nhận thanh toán." : action === "failed" ? "Đã đánh dấu giao dịch thất bại." : "Đã hoàn tiền giả lập.");
  }

  async function rejectRefund(booking) {
    const note = window.prompt("Lý do từ chối hoàn tiền:", "Không đủ điều kiện hoàn tiền");
    if (!note) return;
    await runAction(() => adminApi.rejectRefund(booking.id, note), "Đã từ chối yêu cầu hoàn tiền.");
  }

  return (
    <div className="admin-page">
      <section className="admin-title">
        <span className="eyebrow">Booking</span>
        <h1>Quản lý đơn đặt tour</h1>
      </section>
      {message && <div className="alert success">{message}</div>}
      <div className="toolbar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <Pagination page={page} pageSize={pageSize} itemCount={bookings.length} onChange={setPage} />
      <div className="table-card">
        <table>
          <thead><tr><th>Khách hàng</th><th>Tour</th><th>Số người</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.customer_name}<small>{booking.customer_phone}</small></td>
                <td>{booking.tour_title || `Tour #${booking.tour_id}`}</td>
                <td>{booking.adult_count + booking.child_count}</td>
                <td>{formatCurrency(booking.total_price)}</td>
                <td><StatusBadge status={booking.payment?.status || "unpaid"} /></td>
                <td><StatusBadge status={booking.status} /></td>
                <td>
                  <div className="inline-actions">
                    {booking.status === "pending" && (
                      <button className="ghost-button" onClick={() => runAction(() => adminApi.confirmBooking(booking.id), "Đã xác nhận booking.")}>
                        <CheckCircle2 size={15} />Xác nhận
                      </button>
                    )}
                    {["pending", "confirmed"].includes(booking.status) && (
                      !booking.payment && <button className="ghost-button" onClick={() => createCashPayment(booking)}>
                        <CircleDollarSign size={15} />Tạo payment
                      </button>
                    )}
                    {booking.payment && ["unpaid", "failed"].includes(booking.payment.status) && <button className="ghost-button" onClick={() => paymentAction(booking, "paid")}>Đã thanh toán</button>}
                    {booking.payment?.status === "unpaid" && <button className="ghost-button" onClick={() => paymentAction(booking, "failed")}>Thất bại</button>}
                    {booking.payment?.status === "paid" && !booking.refund_requested && <button className="ghost-button" onClick={() => paymentAction(booking, "refunded")}>Hoàn tiền trực tiếp</button>}
                    {booking.refund_requested && (
                      <div className="admin-refund-request">
                        <strong>Yêu cầu hoàn tiền</strong>
                        <p>{booking.refund_reason}</p>
                        <button className="primary-button" type="button" onClick={() => paymentAction(booking, "refunded")}>Duyệt hoàn tiền</button>
                        <button className="ghost-button" type="button" onClick={() => rejectRefund(booking)}>Từ chối</button>
                      </div>
                    )}
                    {["pending", "confirmed"].includes(booking.status) && booking.payment?.status !== "paid" && (
                      <button className="ghost-button" onClick={() => runAction(() => adminApi.cancelBooking(booking.id), "Đã hủy booking.")}>
                        <XCircle size={15} />Hủy
                      </button>
                    )}
                    {booking.status === "confirmed" && (
                      <button className="ghost-button" onClick={() => runAction(() => adminApi.completeBooking(booking.id), "Đã hoàn thành booking.")}>
                        Hoàn thành
                      </button>
                    )}
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
