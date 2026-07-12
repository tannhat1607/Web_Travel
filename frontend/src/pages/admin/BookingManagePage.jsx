import { CheckCircle2, CircleDollarSign, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { Pagination } from "../../components/common/Pagination.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { formatCurrency } from "../../utils/format";

export function BookingManagePage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const visibleBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return bookings;
    return bookings.filter((booking) => `${booking.customer_name} ${booking.customer_phone} ${booking.customer_email} ${booking.tour_title}`.toLowerCase().includes(keyword));
  }, [bookings, search]);

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
    await runAction(() => adminApi.createPayment({ booking_id: booking.id, method: "cash", amount: booking.total_price }), "Đã tạo payment tiền mặt.");
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
        <div><span className="eyebrow">Booking</span><h1>Quản lý đơn đặt tour</h1></div>
        <p>Theo dõi booking, thanh toán, hoàn tiền và trạng thái xử lý.</p>
      </section>
      {message && <div className="alert success">{message}</div>}

      <section className="admin-table-card">
        <div className="admin-list-toolbar">
          <div className="admin-table-filters">
            <label>Trạng thái:
              <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
                <option value="">Tất cả</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="tour-table-search">
              <Search size={15} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm khách hàng, số điện thoại, tour..." />
            </label>
          </div>
          <Pagination page={page} pageSize={pageSize} itemCount={bookings.length} onChange={setPage} />
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table admin-booking-table">
            <thead><tr><th>Khách hàng</th><th>Tour</th><th>Số người</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={booking.id}>
                  <td><strong>{booking.customer_name}</strong><small>{booking.customer_phone}</small></td>
                  <td>{booking.tour_title || `Tour #${booking.tour_id}`}</td>
                  <td>{booking.adult_count + booking.child_count}</td>
                  <td className="money-cell">
                    {formatCurrency(booking.total_price)}
                    {Number(booking.loyalty_discount || 0) > 0 && (
                      <small className="muted-cell">Hạng {booking.loyalty_tier_label}: -{formatCurrency(booking.loyalty_discount)}</small>
                    )}
                  </td>
                  <td><StatusBadge status={booking.payment?.status || "unpaid"} /></td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td>
                    <div className="table-actions action-wrap">
                      {booking.status === "pending" && <button className="ghost-button" onClick={() => runAction(() => adminApi.confirmBooking(booking.id), "Đã xác nhận booking.")}><CheckCircle2 size={15} />Xác nhận</button>}
                      {["pending", "confirmed"].includes(booking.status) && !booking.payment && <button className="ghost-button" onClick={() => createCashPayment(booking)}><CircleDollarSign size={15} />Tạo payment</button>}
                      {booking.payment && ["unpaid", "failed"].includes(booking.payment.status) && <button className="ghost-button" onClick={() => paymentAction(booking, "paid")}>Đã thanh toán</button>}
                      {booking.payment?.status === "unpaid" && <button className="ghost-button" onClick={() => paymentAction(booking, "failed")}>Thất bại</button>}
                      {booking.payment?.status === "paid" && !booking.refund_requested && <button className="ghost-button" onClick={() => paymentAction(booking, "refunded")}>Hoàn tiền</button>}
                      {booking.refund_requested && (
                        <span className="refund-inline">
                          <strong>Yêu cầu hoàn tiền</strong>
                          <button className="primary-button" type="button" onClick={() => paymentAction(booking, "refunded")}>Duyệt</button>
                          <button className="ghost-button" type="button" onClick={() => rejectRefund(booking)}>Từ chối</button>
                        </span>
                      )}
                      {["pending", "confirmed"].includes(booking.status) && booking.payment?.status !== "paid" && <button className="ghost-button" onClick={() => runAction(() => adminApi.cancelBooking(booking.id), "Đã hủy booking.")}><XCircle size={15} />Hủy</button>}
                      {booking.status === "confirmed" && <button className="ghost-button" onClick={() => runAction(() => adminApi.completeBooking(booking.id), "Đã hoàn thành booking.")}>Hoàn thành</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visibleBookings.length && <p className="empty-report">Không có booking phù hợp.</p>}
        <div className="admin-table-footer"><span>Hiển thị {visibleBookings.length} trong {bookings.length} booking</span></div>
      </section>
    </div>
  );
}
