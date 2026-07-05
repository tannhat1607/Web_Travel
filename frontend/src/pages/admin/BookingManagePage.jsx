import { CheckCircle2, CircleDollarSign, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { formatCurrency } from "../../utils/format";

export function BookingManagePage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    adminApi.bookings(filter ? { status_filter: filter } : {}).then((response) => setBookings(response.data)).catch(() => setBookings([]));
  }

  useEffect(() => load(), [filter]);

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
      <div className="table-card">
        <table>
          <thead><tr><th>Khách hàng</th><th>Tour</th><th>Số người</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.customer_name}<small>{booking.customer_phone}</small></td>
                <td>#{booking.tour_id}</td>
                <td>{booking.adult_count + booking.child_count}</td>
                <td>{formatCurrency(booking.total_price)}</td>
                <td><StatusBadge status={booking.status} /></td>
                <td>
                  <div className="inline-actions">
                    {booking.status === "pending" && (
                      <button className="ghost-button" onClick={() => runAction(() => adminApi.confirmBooking(booking.id), "Đã xác nhận booking.")}>
                        <CheckCircle2 size={15} />Xác nhận
                      </button>
                    )}
                    {["pending", "confirmed"].includes(booking.status) && (
                      <button className="ghost-button" onClick={() => createCashPayment(booking)}>
                        <CircleDollarSign size={15} />Tạo payment
                      </button>
                    )}
                    {["pending", "confirmed"].includes(booking.status) && (
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
