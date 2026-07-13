import { CalendarDays, MapPin, Send, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { reviewApi } from "../../api/reviewApi";
import { tourApi } from "../../api/tourApi";
import { Loading } from "../../components/common/Loading.jsx";
import { fallbackTours } from "../../data/fallbackTours";
import { getToken } from "../../store/authStore";
import { formatCurrency } from "../../utils/format";

export function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    tourApi.detail(id).then((response) => setTour(response.data)).catch(() => {
      setTour(fallbackTours.find((item) => String(item.id) === String(id)) || fallbackTours[0]);
    });
    reviewApi.byTour(id).then((response) => setReviews(response.data)).catch(() => setReviews([]));
    if (getToken()) {
      reviewApi.eligibility(id).then((response) => setEligibility(response.data)).catch(() => setEligibility(null));
    } else {
      setEligibility(null);
    }
  }, [id]);

  async function submitReview(event) {
    event.preventDefault();
    setReviewMessage("");
    setReviewError("");
    try {
      await reviewApi.create({
        tour_id: Number(id),
        booking_id: eligibility?.booking_id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment || null,
      });
      setReviewMessage("Đã gửi đánh giá.");
      setReviewForm({ rating: 5, comment: "" });
      setEligibility((current) => current ? { ...current, can_review: false, reason: "Bạn đã đánh giá booking này." } : current);
      reviewApi.byTour(id).then((response) => setReviews(response.data)).catch(() => {});
    } catch (err) {
      setReviewError(err.response?.data?.detail || "Không thể gửi đánh giá.");
    }
  }

  if (!tour) return <Loading />;

  const gallery = tour.images?.length ? tour.images : [{ image_url: tour.image_url || fallbackTours[0].image_url, alt_text: tour.title }];
  const [coverImage, ...supportImages] = gallery;
  const displayPrice = tour.effective_price || tour.price;
  const hasPromotion = tour.active_promotion && Number(displayPrice) < Number(tour.price);
  const upcomingDepartures = (tour.departures || [])
    .filter((departure) => departure.is_active && new Date(departure.departure_at).getTime() > Date.now())
    .sort((first, second) => new Date(first.departure_at) - new Date(second.departure_at));

  return (
    <div className="page">
      <section className="detail-hero">
        <div className="detail-gallery">
          <img className="detail-cover" src={coverImage.image_url} alt={coverImage.alt_text || tour.title} />
          {supportImages.length > 0 && (
            <div className="detail-thumbs">
              {supportImages.slice(0, 3).map((image) => (
                <img key={image.id || image.image_url} src={image.image_url} alt={image.alt_text || tour.title} />
              ))}
            </div>
          )}
        </div>
        <div>
          <span className="eyebrow"><MapPin size={16} />{tour.destination}</span>
          <h1>{tour.title}</h1>
          <p>{tour.description || tour.short_description}</p>
          <div className="detail-meta">
            <span><CalendarDays size={18} />{tour.duration_days} ngày {tour.duration_nights ? `${tour.duration_nights} đêm` : ""}</span>
            <span><Users size={18} />{tour.available_slots} chỗ còn</span>
            <strong>{formatCurrency(displayPrice)}</strong>
          </div>
          {hasPromotion && (
            <div className="promotion-callout">
              <strong>{tour.active_promotion.title}</strong>
              <span>Gia goc: <del>{formatCurrency(tour.price)}</del></span>
              {tour.active_promotion.terms && <p>{tour.active_promotion.terms}</p>}
            </div>
          )}
          <Link className="primary-button wide" to={`/tours/${tour.id}/book`}>Đặt tour</Link>
        </div>
      </section>

      <section className="public-departures" aria-labelledby="departure-heading">
        <div className="public-departures-heading">
          <div>
            <span className="eyebrow"><CalendarDays size={16} />Lịch khởi hành</span>
            <h2 id="departure-heading">Các chuyến sắp tới</h2>
          </div>
          <p>{upcomingDepartures.length ? "Chọn chuyến phù hợp và kiểm tra số chỗ còn lại trước khi đặt." : "Hiện chưa có lịch khởi hành mới. Vui lòng liên hệ để được tư vấn."}</p>
        </div>
        {upcomingDepartures.length > 0 && (
          <div className="public-departure-list">
            {upcomingDepartures.map((departure) => (
              <article key={departure.id}>
                <CalendarDays size={20} />
                <div>
                  <strong>{new Date(departure.departure_at).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</strong>
                  <span>{new Date(departure.departure_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <span className={departure.available_slots > 0 ? "departure-available" : "departure-sold-out"}>
                  {departure.available_slots > 0 ? `Còn ${departure.available_slots}/${departure.capacity} chỗ` : "Hết chỗ"}
                </span>
                {departure.available_slots > 0 && <Link to={`/tours/${tour.id}/book?departure=${departure.id}`}>Chọn chuyến</Link>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="detail-sections" aria-label="Thông tin chi tiết tour">
        <article>
          <h2>Lịch trình</h2>
          <p>{tour.schedule || "Lịch trình đang được cập nhật."}</p>
        </article>
        <article>
          <h2>Ẩm thực</h2>
          <p>{tour.food || "Thông tin ẩm thực đang được cập nhật."}</p>
        </article>
        <article>
          <h2>Phù hợp cho</h2>
          <p>{tour.suitable_for || "Nhiều nhóm khách."}</p>
        </article>
        <article>
          <h2>Điểm nổi bật</h2>
          <p>{tour.highlights || "Các điểm nổi bật đang được cập nhật."}</p>
        </article>
      </section>

      <section className="reviews">
        <div className="card-header-row">
          <div>
            <span className="eyebrow">Trải nghiệm khách hàng</span>
            <h2>Đánh giá</h2>
          </div>
        </div>

        {getToken() ? (
          eligibility?.can_review ? (
            <form className="review-form" onSubmit={submitReview}>
              {reviewMessage && <div className="alert success">{reviewMessage}</div>}
              {reviewError && <div className="alert error">{reviewError}</div>}
              <label>
                Chấm sao
                <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
              </label>
              <label>
                Nhận xét
                <textarea rows={4} value={reviewForm.comment} onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} placeholder="Chia sẻ trải nghiệm sau chuyến đi" />
              </label>
              <button className="primary-button" type="submit"><Send size={17} />Gửi đánh giá</button>
            </form>
          ) : (
            <div className="review-note">{eligibility?.reason || "Bạn cần hoàn thành tour trước khi đánh giá."}</div>
          )
        ) : (
          <div className="review-note">Đăng nhập và hoàn thành booking để đánh giá tour này.</div>
        )}

        {reviews.length ? reviews.map((review) => (
          <div className="review-item" key={review.id}>
            <span><Star size={16} />{review.rating}/5</span>
            <p>{review.comment}</p>
          </div>
        )) : <p className="muted">Chưa có đánh giá cho tour này.</p>}
      </section>
    </div>
  );
}
