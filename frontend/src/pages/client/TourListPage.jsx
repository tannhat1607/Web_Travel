import { RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tourApi } from "../../api/tourApi";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Loading } from "../../components/common/Loading.jsx";
import { NumberedPagination } from "../../components/common/NumberedPagination.jsx";
import { TourCard } from "../../components/tours/TourCard.jsx";
import { fallbackTours } from "../../data/fallbackTours";

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi-VN")
    .trim();
}

function filterFallbackTours(filters) {
  const destination = normalizeSearchText(filters.destination);
  return fallbackTours.filter((tour) => {
    const searchableDestination = normalizeSearchText(`${tour.destination} ${tour.title}`);
    const matchesDestination = !destination || searchableDestination.includes(destination);
    const matchesPrice = !filters.max_price || Number(tour.price) <= Number(filters.max_price);
    const matchesDuration = !filters.duration_days || Number(tour.duration_days) === Number(filters.duration_days);
    return matchesDestination && matchesPrice && matchesDuration;
  });
}

export function TourListPage() {
  const pageSize = 9;
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    destination: searchParams.get("destination") || "",
    max_price: searchParams.get("max_price") || "",
    duration_days: searchParams.get("duration_days") || "",
  });
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get("page")) || 1));

  const params = useMemo(() => {
    return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      tourApi.list({ ...params, limit: 100 }).then((response) => {
        if (!cancelled) setTours(response.data);
      }).catch(() => {
        if (!cancelled) setTours(filterFallbackTours(params));
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [params]);

  const totalPages = Math.max(1, Math.ceil(tours.length / pageSize));
  const visibleTours = tours.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setSearchParams({ ...params, ...(page > 1 ? { page: String(page) } : {}) }, { replace: true });
  }, [page, params, setSearchParams]);

  function updateFilter(field, value) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function resetFilters() {
    setPage(1);
    setFilters({ destination: "", max_price: "", duration_days: "" });
  }

  function changePage(nextPage) {
    setPage(nextPage);
    document.querySelector(".tour-search-filters")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="page">
      <section className="page-title">
        <span className="eyebrow">Danh sách tour</span>
        <h1>Tìm hành trình phù hợp</h1>
      </section>
      <div className="filter-bar tour-search-filters">
        <label><Search size={17} />Điểm đến<input value={filters.destination} onChange={(event) => updateFilter("destination", event.target.value)} placeholder="Đà Nẵng" /></label>
        <label>Giá tối đa<input type="number" value={filters.max_price} onChange={(event) => updateFilter("max_price", event.target.value)} placeholder="3000000" /></label>
        <label>Số ngày<input type="number" value={filters.duration_days} onChange={(event) => updateFilter("duration_days", event.target.value)} placeholder="3" /></label>
        <button className="filter-reset-button" type="button" onClick={resetFilters} disabled={!Object.keys(params).length}>
          <RotateCcw size={17} />Xóa lọc
        </button>
      </div>
      {loading ? <Loading /> : tours.length ? (
        <>
          <div className="tour-results-summary">
            Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, tours.length)} trong {tours.length} tour
          </div>
          <div className="tour-grid">{visibleTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}</div>
          <NumberedPagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      ) : (
        <EmptyState
          title={filters.destination ? `Không tìm thấy tour cho “${filters.destination}”` : "Không tìm thấy tour"}
          message="Thử tên không dấu, tên tỉnh/thành khác hoặc xóa bớt bộ lọc."
        />
      )}
    </div>
  );
}
