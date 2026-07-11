import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tourApi } from "../../api/tourApi";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Loading } from "../../components/common/Loading.jsx";
import { TourCard } from "../../components/tours/TourCard.jsx";
import { fallbackTours } from "../../data/fallbackTours";

export function TourListPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    destination: searchParams.get("destination") || "",
    max_price: searchParams.get("max_price") || "",
    duration_days: searchParams.get("duration_days") || "",
  });
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => {
    return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    tourApi.list(params).then((response) => {
      setTours(response.data);
    }).catch(() => setTours(fallbackTours)).finally(() => setLoading(false));
  }, [params]);

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="page">
      <section className="page-title">
        <span className="eyebrow">Danh sách tour</span>
        <h1>Tìm hành trình phù hợp</h1>
      </section>
      <div className="filter-bar">
        <label><Search size={17} />Điểm đến<input value={filters.destination} onChange={(event) => updateFilter("destination", event.target.value)} placeholder="Đà Nẵng" /></label>
        <label>Giá tối đa<input type="number" value={filters.max_price} onChange={(event) => updateFilter("max_price", event.target.value)} placeholder="3000000" /></label>
        <label>Số ngày<input type="number" value={filters.duration_days} onChange={(event) => updateFilter("duration_days", event.target.value)} placeholder="3" /></label>
      </div>
      {loading ? <Loading /> : tours.length ? (
        <div className="tour-grid">{tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}</div>
      ) : (
        <EmptyState title="Không tìm thấy tour" />
      )}
    </div>
  );
}
