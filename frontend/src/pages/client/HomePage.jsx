import { CalendarDays, MapPin, Search, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { promotionApi } from "../../api/promotionApi";
import { tourApi } from "../../api/tourApi";
import { PromotionShowcase } from "../../components/promotions/PromotionShowcase.jsx";
import { TourCard } from "../../components/tours/TourCard.jsx";
import { fallbackTours } from "../../data/fallbackTours";

const heroSlides = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1900&q=86",
  "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1900&q=86",
  "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1900&q=86",
];

export function HomePage() {
  const [tours, setTours] = useState(fallbackTours);
  const [promotions, setPromotions] = useState([]);
  const [destination, setDestination] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    tourApi.list({ limit: 6 }).then((response) => {
      if (response.data.length) setTours(response.data);
    }).catch(() => {});
    promotionApi.list({ limit: 6 }).then((response) => setPromotions(response.data)).catch(() => setPromotions([]));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  function search(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (maxPrice) params.set("max_price", maxPrice);
    if (durationDays) params.set("duration_days", durationDays);
    navigate(`/tours${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <>
      <section className="stitch-hero">
        <div className="hero-bg-slider" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <div
              className={index === activeSlide ? "hero-bg-slide active" : "hero-bg-slide"}
              key={slide}
              style={{ backgroundImage: `url("${slide}")` }}
            />
          ))}
        </div>
        <div className="hero-overlay" />
        <div className="hero-content page">
          {/* <span className="pill-badge"><Sparkles size={15} />Trợ lý du lịch thông minh</span> */}
          <h1>Khám phá hành trình mơ ước của bạn</h1>
          <p>Chọn tour, xem lịch trình và hỏi trợ lý AI bằng dữ liệu thật từ hệ thống.</p>
          <form className="stitch-search" onSubmit={search}>
            <label>
              <MapPin size={22} />
              <span>Điểm đến</span>
              <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Bạn muốn đi đâu?" />
            </label>
            <label>
              <WalletCards size={22} />
              <span>Ngân sách</span>
              <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
                <option value="">Linh hoạt</option>
                <option value="3000000">Dưới 3 triệu</option>
                <option value="5000000">Dưới 5 triệu</option>
                <option value="10000000">Dưới 10 triệu</option>
              </select>
            </label>
            <label>
              <CalendarDays size={22} />
              <span>Thời gian</span>
              <select value={durationDays} onChange={(event) => setDurationDays(event.target.value)}>
                <option value="">Mọi lịch trình</option>
                <option value="1">1 ngày</option>
                <option value="3">3 ngày 2 đêm</option>
                <option value="4">4 ngày</option>
              </select>
            </label>
            <button type="submit"><Search size={18} />Tìm kiếm</button>
          </form>
        </div>
      </section>

      <div className="page">
        <section className="feature-strip">
          <div><ShieldCheck size={22} /><strong>Theo dõi đơn dễ dàng</strong><span>Xem trạng thái đặt tour và hủy khi còn hợp lệ</span></div>
          <div><MapPin size={22} /><strong>Lọc theo nhu cầu</strong><span>Tìm theo điểm đến, ngân sách và thời lượng</span></div>
          <div><Sparkles size={22} /><strong>Hỏi trợ lý AI</strong><span>Nhận gợi ý dựa trên dữ liệu tour hiện có</span></div>
        </section>

        <PromotionShowcase promotions={promotions} />

        <section className="section-heading">
          <div>
            <span className="eyebrow">Tour nổi bật</span>
            <h2>Lịch trình đáng thử</h2>
          </div>
          <Link to="/tours" className="ghost-button">Xem tất cả</Link>
        </section>
        <div className="tour-grid">
          {tours.slice(0, 6).map((tour) => <TourCard key={tour.id} tour={tour} />)}
        </div>
      </div>
    </>
  );
}
