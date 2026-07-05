export function Loading({ label = "Đang tải dữ liệu..." }) {
  return (
    <div className="loading">
      <span />
      {label}
    </div>
  );
}
