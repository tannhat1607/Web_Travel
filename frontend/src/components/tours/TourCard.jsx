import { CalendarDays, MapPin, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/format";

export function TourCard({ tour }) {
  return (
    <article className="tour-card">
      <Link to={`/tours/${tour.id}`} className="tour-image-link">
        <img src={tour.image_url || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80"} alt={tour.title} />
        <span className="rating-chip"><Star size={15} fill="currentColor" />4.9</span>
      </Link>
      <div className="tour-card-body">
        <div className="tour-card-meta">
          <span><MapPin size={15} />{tour.destination}</span>
          <span><CalendarDays size={15} />{tour.duration_days} ngày</span>
        </div>
        <h3><Link to={`/tours/${tour.id}`}>{tour.title}</Link></h3>
        <p>{tour.short_description || tour.description || "Thông tin tour đang được cập nhật."}</p>
        <div className="tour-card-footer">
          <div><span className="price-label">Giá từ</span><strong>{formatCurrency(tour.price)}</strong></div>
          <span><Users size={15} />{tour.available_slots} chỗ</span>
        </div>
      </div>
    </article>
  );
}
