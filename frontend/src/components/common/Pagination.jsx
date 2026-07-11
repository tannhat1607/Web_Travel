export function Pagination({ page, pageSize = 10, itemCount, onChange }) {
  return <nav className="pagination" aria-label="Phân trang"><button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>← Trước</button><span>Trang {page}</span><button type="button" disabled={itemCount < pageSize} onClick={() => onChange(page + 1)}>Sau →</button></nav>;
}
