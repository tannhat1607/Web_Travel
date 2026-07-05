import { useEffect, useState } from "react";
import { bookingApi } from "../../api/bookingApi";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { formatCurrency } from "../../utils/format";

export function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);

  function load() {
    bookingApi.mine().then((response) => setBookings(response.data)).catch(() => setBookings([]));
  }

  useEffect(() => load(), []);

  async function cancelBooking(id) {
    if (!window.confirm("Bạn chắc chắn muốn hủy booking này?")) return;
    await bookingApi.cancel(id);
    load();
  }

  return (
    <div className="page">
      <section className="page-title">
        <span className="eyebrow">Tài khoản</span>
        <h1>Booking của tôi</h1>
      </section>
      {bookings.length ? (
        <div className="table-card">
          <table>
            <thead><tr><th>Mã</th><th>Tour</th><th>Số người</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>#{booking.id}</td>
                  <td>{booking.tour_id}</td>
                  <td>{booking.adult_count + booking.child_count}</td>
                  <td>{formatCurrency(booking.total_price)}</td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td>
                    {["pending", "confirmed"].includes(booking.status) && (
                      <button className="ghost-button" onClick={() => cancelBooking(booking.id)}>Hủy</button>
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
