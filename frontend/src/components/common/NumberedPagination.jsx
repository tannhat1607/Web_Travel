import { ChevronLeft, ChevronRight } from "lucide-react";

export function NumberedPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="client-pagination" aria-label="Phân trang tour">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">
        <ChevronLeft size={17} />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
        <button
          type="button"
          key={pageNumber}
          className={pageNumber === page ? "active" : ""}
          onClick={() => onChange(pageNumber)}
          aria-current={pageNumber === page ? "page" : undefined}
          aria-label={`Trang ${pageNumber}`}
        >
          {pageNumber}
        </button>
      ))}
      <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau">
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}
