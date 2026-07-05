import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookingApi } from "../../api/bookingApi";
import { tourApi } from "../../api/tourApi";
import { fallbackTours } from "../../data/fallbackTours";
import { formatCurrency } from "../../utils/format";

export function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    adult_count: 1,
    child_count: 0,
    note: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    tourApi.detail(id).then((response) => setTour(response.data)).catch(() => {
      setTour(fallbackTours.find((item) => String(item.id) === String(id)) || fallbackTours[0]);
    });
  }, [id]);

  const total = tour ? Number(tour.price) * Number(form.adult_count || 0) + Number(tour.price) * Number(form.child_count || 0) * 0.7 : 0;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await bookingApi.create({ ...form, tour_id: Number(id), adult_count: Number(form.adult_count), child_count: Number(form.child_count) });
      navigate("/my-bookings");
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể tạo booking.");
    }
  }

  return (
    <div className="page">
      <section className="page-title">
        <span className="eyebrow">Đặt tour</span>
        <h1>{tour?.title || "Tour"}</h1>
      </section>
      <div className="booking-layout">
        <form className="form-panel" onSubmit={submit}>
          {error && <div className="alert error">{error}</div>}
          <label>Họ tên<input value={form.customer_name} onChange={(event) => update("customer_name", event.target.value)} required /></label>
          <label>Email<input type="email" value={form.customer_email} onChange={(event) => update("customer_email", event.target.value)} required /></label>
          <label>Số điện thoại<input value={form.customer_phone} onChange={(event) => update("customer_phone", event.target.value)} required /></label>
          <div className="form-row">
            <label>Người lớn<input type="number" min="1" value={form.adult_count} onChange={(event) => update("adult_count", event.target.value)} /></label>
            <label>Trẻ em<input type="number" min="0" value={form.child_count} onChange={(event) => update("child_count", event.target.value)} /></label>
          </div>
          <label>Ghi chú<textarea value={form.note} onChange={(event) => update("note", event.target.value)} rows="4" /></label>
          <button className="primary-button wide" type="submit">Xác nhận đặt tour</button>
        </form>
        <aside className="summary-panel">
          <h2>Tóm tắt</h2>
          <p>{tour?.destination}</p>
          <div><span>Giá người lớn</span><strong>{formatCurrency(tour?.price)}</strong></div>
          <div><span>Tổng tiền</span><strong>{formatCurrency(total)}</strong></div>
        </aside>
      </div>
    </div>
  );
}
