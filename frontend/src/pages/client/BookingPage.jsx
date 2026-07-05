import { TicketPercent } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookingApi } from "../../api/bookingApi";
import { promotionApi } from "../../api/promotionApi";
import { tourApi } from "../../api/tourApi";
import { PromotionShowcase } from "../../components/promotions/PromotionShowcase.jsx";
import { fallbackTours } from "../../data/fallbackTours";
import { formatCurrency } from "../../utils/format";

export function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [quote, setQuote] = useState(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    adult_count: 1,
    child_count: 0,
    note: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    tourApi.detail(id).then((response) => setTour(response.data)).catch(() => {
      setTour(fallbackTours.find((item) => String(item.id) === String(id)) || fallbackTours[0]);
    });
    promotionApi.list({ tour_id: Number(id), limit: 6 }).then((response) => setPromotions(response.data)).catch(() => setPromotions([]));
  }, [id]);

  useEffect(() => {
    if (!tour) return;
    loadQuote(appliedCode);
  }, [tour, form.adult_count, form.child_count, appliedCode]);

  const unitPrice = tour ? Number(tour.effective_price || tour.price) : 0;
  const hasPromotion = tour?.active_promotion && unitPrice < Number(tour.price);
  const fallbackTotal = unitPrice * Number(form.adult_count || 0) + unitPrice * Number(form.child_count || 0) * 0.7;
  const total = quote ? Number(quote.total) : fallbackTotal;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadQuote(code) {
    setError("");
    try {
      const response = await bookingApi.quote({
        tour_id: Number(id),
        adult_count: Number(form.adult_count || 0),
        child_count: Number(form.child_count || 0),
        promotion_code: code || null,
      });
      setQuote(response.data);
      if (code) setMessage(`Đã áp dụng mã ${response.data.promotion_code}.`);
    } catch (err) {
      setQuote(null);
      if (code) {
        setAppliedCode("");
        setMessage("");
        setError(err.response?.data?.detail || "Mã giảm giá không hợp lệ.");
      }
    }
  }

  function applyCode(event) {
    event.preventDefault();
    const code = promotionCode.trim().toUpperCase();
    if (!code) {
      setAppliedCode("");
      setMessage("");
      return;
    }
    setAppliedCode(code);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await bookingApi.create({
        ...form,
        tour_id: Number(id),
        adult_count: Number(form.adult_count),
        child_count: Number(form.child_count),
        promotion_code: appliedCode || null,
      });
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

      <PromotionShowcase promotions={promotions} compact onCodeSelect={(code) => {
        setPromotionCode(code);
        setAppliedCode(code);
      }} />

      <div className="booking-layout">
        <form className="form-panel" onSubmit={submit}>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
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
          {hasPromotion && <div><span>{tour.active_promotion.title}</span><strong><del>{formatCurrency(tour.price)}</del></strong></div>}
          <div><span>Giá người lớn</span><strong>{formatCurrency(unitPrice)}</strong></div>
          <form className="coupon-apply" onSubmit={applyCode}>
            <label>
              <TicketPercent size={17} />
              <input value={promotionCode} onChange={(event) => setPromotionCode(event.target.value.toUpperCase())} placeholder="Nhập mã giảm giá" />
            </label>
            <button type="submit">Áp dụng</button>
          </form>
          {quote?.auto_discount > 0 && <div><span>Giảm tự động</span><strong>-{formatCurrency(quote.auto_discount)}</strong></div>}
          {quote?.code_discount > 0 && <div><span>Giảm bằng mã {quote.promotion_code}</span><strong>-{formatCurrency(quote.code_discount)}</strong></div>}
          <div><span>Tổng tiền</span><strong>{formatCurrency(total)}</strong></div>
        </aside>
      </div>
    </div>
  );
}
