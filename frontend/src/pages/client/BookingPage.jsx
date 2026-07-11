import { CheckCircle2, House, ReceiptText, TicketPercent, XCircle } from "lucide-react";
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
    payment_method: "momo",
    departure_id: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    tourApi.detail(id).then((response) => setTour(response.data)).catch(() => {
      setTour(fallbackTours.find((item) => String(item.id) === String(id)) || fallbackTours[0]);
    });
    promotionApi.list({ tour_id: Number(id), limit: 6 }).then((response) => setPromotions(response.data)).catch(() => setPromotions([]));
  }, [id]);

  useEffect(() => {
    if (!tour) return;
    loadQuote(appliedCode);
  }, [tour, form.adult_count, form.child_count, form.departure_id, appliedCode]);

  const unitPrice = tour ? Number(tour.effective_price || tour.price) : 0;
  const hasPromotion = tour?.active_promotion && unitPrice < Number(tour.price);
  const fallbackTotal = unitPrice * Number(form.adult_count || 0) + unitPrice * Number(form.child_count || 0) * 0.7;
  const total = quote ? Number(quote.total) : fallbackTotal;
  const adultSubtotal = unitPrice * Number(form.adult_count || 0);
  const childUnitPrice = unitPrice * 0.7;
  const childSubtotal = childUnitPrice * Number(form.child_count || 0);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadQuote(code) {
    setError("");
    try {
      const response = await bookingApi.quote({
        tour_id: Number(id),
        departure_id: form.departure_id ? Number(form.departure_id) : null,
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
    setSubmitting(true);
    let booking = transaction?.booking || null;
    try {
      if (!booking) {
        const response = await bookingApi.create({
          ...form,
          tour_id: Number(id),
          departure_id: form.departure_id ? Number(form.departure_id) : null,
          adult_count: Number(form.adult_count),
          child_count: Number(form.child_count),
          promotion_code: appliedCode || null,
          payment_method: undefined,
        });
        booking = response.data;
      }
      const payment = await bookingApi.simulatePayment(booking.id, { method: form.payment_method, succeed: true });
      setTransaction({ status: "paid", booking, payment: payment.data });
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const detail = err.response?.data?.detail || "Không thể xử lý giao dịch.";
      setTransaction({ status: "failed", booking, error: detail });
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  function continueToInvoice(event) {
    event.preventDefault();
    setError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="page">
      <section className="page-title">
        <span className="eyebrow">Đặt tour</span>
        <h1>{tour?.title || "Tour"}</h1>
      </section>

      <div className="booking-steps" aria-label="Tiến trình đặt tour">
        <span className={step === 1 ? "active" : "done"}><i>1</i><strong>Thông tin đặt tour</strong></span>
        <span className={step === 2 ? "active" : step > 2 ? "done" : ""}><i>2</i><strong>Hóa đơn & thanh toán</strong></span>
        <span className={step === 3 ? "active" : ""}><i>3</i><strong>Trạng thái giao dịch</strong></span>
      </div>

      {step === 1 ? (
        <div className="booking-layout booking-info-step">
        <form className="form-panel" onSubmit={continueToInvoice}>
          <div className="booking-panel-heading"><span>Bước 1</span><h2>Thông tin người đặt</h2><p>Nhập thông tin liên hệ và số lượng hành khách.</p></div>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
          <label>Họ tên<input value={form.customer_name} onChange={(event) => update("customer_name", event.target.value)} required /></label>
          <label>Email<input type="email" value={form.customer_email} onChange={(event) => update("customer_email", event.target.value)} required /></label>
          <label>Số điện thoại<input value={form.customer_phone} onChange={(event) => update("customer_phone", event.target.value)} required /></label>
          <label>Ngày khởi hành
            <select value={form.departure_id} onChange={(event) => update("departure_id", event.target.value)} required={Boolean(tour?.departures?.length)}>
              <option value="">{tour?.departures?.length ? "Chọn ngày khởi hành" : "Liên hệ để xác nhận lịch"}</option>
              {(tour?.departures || []).filter((item) => item.is_active && item.available_slots > 0).map((item) => <option value={item.id} key={item.id}>{new Date(item.departure_at).toLocaleString("vi-VN")} · còn {item.available_slots} chỗ</option>)}
            </select>
          </label>
          <div className="form-row">
            <label>Người lớn<input type="number" min="1" value={form.adult_count} onChange={(event) => update("adult_count", event.target.value)} /></label>
            <label>Trẻ em<input type="number" min="0" value={form.child_count} onChange={(event) => update("child_count", event.target.value)} /></label>
          </div>
          <label>Ghi chú<textarea value={form.note} onChange={(event) => update("note", event.target.value)} rows="4" /></label>
          <button className="primary-button wide" type="submit">Tiếp tục xem hóa đơn</button>
        </form>

        <aside className="summary-panel booking-tour-preview">
          {tour?.image_url && <img src={tour.image_url} alt={tour.title} />}
          <span className="eyebrow">Tour đã chọn</span>
          <h2>{tour?.title}</h2>
          <p>{tour?.destination} · {tour?.duration_days} ngày {tour?.duration_nights ? `${tour.duration_nights} đêm` : ""}</p>
          <div><span>Giá từ</span><strong>{formatCurrency(unitPrice)}</strong></div>
        </aside>
      </div>
      ) : step === 2 ? (
      <div className="booking-payment-step">
        <main className="booking-invoice">
          <div className="invoice-header">
            <div><span className="eyebrow">Hóa đơn tạm tính</span><h2>{tour?.title}</h2><p>{tour?.destination}</p></div>
            <span>TRAVELORA · DEMO</span>
          </div>

          <div className="invoice-customer">
            <div><small>Người đặt</small><strong>{form.customer_name}</strong><span>{form.customer_email}</span><span>{form.customer_phone}</span></div>
            <div><small>Hành trình</small><strong>{tour?.duration_days} ngày {tour?.duration_nights || 0} đêm</strong><span>{form.departure_id ? new Date(tour?.departures?.find((item) => String(item.id) === String(form.departure_id))?.departure_at).toLocaleString("vi-VN") : "Lịch linh hoạt"}</span><span>{Number(form.adult_count) + Number(form.child_count)} hành khách</span></div>
          </div>

          <div className="invoice-lines">
            <div className="invoice-line heading"><span>Hạng mục</span><span>Đơn giá</span><span>SL</span><strong>Thành tiền</strong></div>
            <div className="invoice-line"><span>Người lớn</span><span>{formatCurrency(unitPrice)}</span><span>{form.adult_count}</span><strong>{formatCurrency(adultSubtotal)}</strong></div>
            {Number(form.child_count) > 0 && <div className="invoice-line"><span>Trẻ em (70%)</span><span>{formatCurrency(childUnitPrice)}</span><span>{form.child_count}</span><strong>{formatCurrency(childSubtotal)}</strong></div>}
          </div>

          <form className="coupon-apply" onSubmit={applyCode}>
            <label>
              <TicketPercent size={17} />
              <input value={promotionCode} onChange={(event) => setPromotionCode(event.target.value.toUpperCase())} placeholder="Nhập mã giảm giá" />
            </label>
            <button type="submit">Áp dụng</button>
          </form>

          <div className="invoice-totals">
            <div><span>Tạm tính</span><strong>{formatCurrency(adultSubtotal + childSubtotal)}</strong></div>
            {quote?.auto_discount > 0 && <div className="discount"><span>Ưu đãi tự động</span><strong>-{formatCurrency(quote.auto_discount)}</strong></div>}
            {quote?.code_discount > 0 && <div className="discount"><span>Mã {quote.promotion_code}</span><strong>-{formatCurrency(quote.code_discount)}</strong></div>}
            <div className="grand-total"><span>Tổng thanh toán</span><strong>{formatCurrency(total)}</strong></div>
          </div>
          {form.note && <div className="invoice-note"><small>Ghi chú</small><p>{form.note}</p></div>}
        </main>

        <aside className="payment-panel">
          <span className="eyebrow">Phương thức thanh toán</span>
          <h2>Chọn cách thanh toán</h2>
          <div className="payment-methods">
            {[{ value:"momo", label:"Ví MoMo giả lập", detail:"Xác nhận ngay" }, { value:"bank_transfer", label:"Chuyển khoản giả lập", detail:"Xác nhận ngay" }, { value:"paypal", label:"PayPal giả lập", detail:"Xác nhận ngay" }, { value:"cash", label:"Tiền mặt tại quầy", detail:"Ghi nhận demo" }].map((method) => (
              <label className={form.payment_method === method.value ? "active" : ""} key={method.value}>
                <input type="radio" name="payment_method" value={method.value} checked={form.payment_method === method.value} onChange={(event) => update("payment_method", event.target.value)} />
                <span><strong>{method.label}</strong><small>{method.detail}</small></span>
              </label>
            ))}
          </div>
          <div className="demo-payment-notice">Môi trường demo — không trừ tiền thật.</div>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={submit}>
            <button className="primary-button wide" type="submit" disabled={submitting}>{submitting ? "Đang xử lý..." : `Thanh toán ${formatCurrency(total)}`}</button>
          </form>
          <button className="ghost-button wide" type="button" onClick={() => setStep(1)}>← Quay lại chỉnh thông tin</button>
        </aside>
      </div>
      ) : (
        <section className={`transaction-result ${transaction?.status === "paid" ? "success" : "failed"}`}>
          <div className="transaction-status-icon">
            {transaction?.status === "paid" ? <CheckCircle2 size={44} /> : <XCircle size={44} />}
          </div>
          <span className="eyebrow">Kết quả giao dịch</span>
          <h2>{transaction?.status === "paid" ? "Thanh toán thành công" : "Giao dịch chưa hoàn tất"}</h2>
          <p>{transaction?.status === "paid" ? "Booking của bạn đã được xác nhận trong môi trường demo." : transaction?.error}</p>

          <div className="transaction-receipt">
            <div><span>Mã booking</span><strong>{transaction?.booking?.id ? `#${transaction.booking.id}` : "Chưa tạo"}</strong></div>
            <div><span>Mã giao dịch</span><strong>{transaction?.payment?.transaction_code || "—"}</strong></div>
            <div><span>Phương thức</span><strong>{({ momo:"MoMo giả lập", bank_transfer:"Chuyển khoản giả lập", paypal:"PayPal giả lập", cash:"Tiền mặt tại quầy" })[form.payment_method]}</strong></div>
            <div><span>Tổng thanh toán</span><strong>{formatCurrency(total)}</strong></div>
            <div><span>Trạng thái</span><strong>{transaction?.status === "paid" ? "Đã thanh toán" : "Thất bại"}</strong></div>
          </div>

          <div className="transaction-actions">
            {transaction?.status === "paid" ? (
              <button className="primary-button" type="button" onClick={() => navigate("/my-bookings")}><ReceiptText size={17} />Xem booking của tôi</button>
            ) : (
              <button className="primary-button" type="button" onClick={() => setStep(2)}>Thử thanh toán lại</button>
            )}
            <button className="ghost-button" type="button" onClick={() => navigate("/")}><House size={17} />Về trang chủ</button>
          </div>
          <small>Đây là giao dịch mô phỏng, không có khoản tiền thật được khấu trừ.</small>
        </section>
      )}

      {step === 2 && <PromotionShowcase promotions={promotions} compact onCodeSelect={(code) => { setPromotionCode(code); setAppliedCode(code); }} />}
    </div>
  );
}
