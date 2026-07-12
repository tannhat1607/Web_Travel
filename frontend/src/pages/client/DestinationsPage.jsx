import { ArrowRight, MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { contentApi } from "../../api/contentApi";
import { tourApi } from "../../api/tourApi";
import { fallbackTours } from "../../data/fallbackTours";

export function DestinationsPage() {
  const [tours, setTours] = useState(fallbackTours);
  const [cmsDestinations, setCmsDestinations] = useState([]);

  useEffect(() => {
    tourApi.list({ limit: 100 }).then((response) => {
      if (response.data.length) setTours(response.data);
    }).catch(() => {});
    contentApi.list({ content_type: "destination", limit: 50 }).then((response) => {
      setCmsDestinations(response.data);
    }).catch(() => {});
  }, []);

  const destinations = useMemo(() => {
    if (cmsDestinations.length) {
      return cmsDestinations.map((item) => ({
        name: item.title,
        count: null,
        minPrice: null,
        image: item.image_url,
        description: item.excerpt || item.content,
        slug: item.slug,
      }));
    }

    const map = new Map();
    tours.forEach((tour) => {
      const name = tour.destination || "Việt Nam";
      const current = map.get(name) || {
        name,
        count: 0,
        minPrice: Number(tour.price || 0),
        image: tour.images?.[0]?.image_url || tour.image_url,
        description: tour.short_description || tour.description,
      };
      current.count += 1;
      current.minPrice = Math.min(current.minPrice, Number(tour.price || current.minPrice));
      if (!current.image) current.image = tour.images?.[0]?.image_url || tour.image_url;
      map.set(name, current);
    });
    return Array.from(map.values());
  }, [cmsDestinations, tours]);

  return (
    <div className="page content-page">
      <section className="page-title">
        <span className="eyebrow"><MapPinned size={16} />Điểm đến</span>
        <h1>Chọn nơi bạn muốn bắt đầu hành trình</h1>
      </section>

      <div className="destination-grid">
        {destinations.map((destination) => (
          <Link
            className="destination-card"
            key={destination.slug || destination.name}
            to={`/tours?destination=${encodeURIComponent(destination.name)}`}
          >
            <img src={destination.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"} alt={destination.name} />
            <div>
              <span>{destination.count === null ? "Khám phá" : `${destination.count} tour`}</span>
              <h2>{destination.name}</h2>
              <p>{destination.description || "Các lịch trình nổi bật đang được cập nhật."}</p>
              <strong>Xem tour <ArrowRight size={17} /></strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
