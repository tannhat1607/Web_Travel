import { BadgePercent, Copy, ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { formatCurrency } from "../../utils/format";

const initialForm = {
  title: "",
  code: "",
  description: "",
  banner_image_url: "",
  discount_type: "percent",
  discount_value: 10,
  start_at: "",
  end_at: "",
  is_active: true,
  auto_apply: true,
  usage_limit: "",
  terms: "",
  tour_ids: [],
};

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value) {
  return value ? new Date(value).toISOString() : null;
}

function formatDiscount(promotion) {
  if (promotion.discount_type === "percent") return `${Number(promotion.discount_value)}%`;
  return formatCurrency(promotion.discount_value);
}

export function PromotionManagePage() {
  const [promotions, setPromotions] = useState([]);
  const [tours, setTours] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => { load(); }, []);

  function load() {
    adminApi.promotions().then((response) => setPromotions(response.data)).catch(() => setPromotions([]));
    adminApi.tours().then((response) => setTours(response.data)).catch(() => setTours([]));
  }

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "auto_apply" && value) next.code = "";
      if (field === "code" && value) next.auto_apply = false;
      return next;
    });
  }

  function toggleTour(tourId) {
    setForm((current) => {
      const selected = new Set(current.tour_ids);
      selected.has(tourId) ? selected.delete(tourId) : selected.add(tourId);
      return { ...current, tour_ids: Array.from(selected) };
    });
  }

  function edit(promotion) {
    setEditingId(promotion.id);
    setForm({
      title: promotion.title || "",
      code: promotion.code || "",
      description: promotion.description || "",
      banner_image_url: promotion.banner_image_url || "",
      discount_type: promotion.discount_type || "percent",
      discount_value: Number(promotion.discount_value || 0),
      start_at: toDateTimeLocal(promotion.start_at),
      end_at: toDateTimeLocal(promotion.end_at),
      is_active: Boolean(promotion.is_active),
      auto_apply: Boolean(promotion.auto_apply),
      usage_limit: promotion.usage_limit || "",
      terms: promotion.terms || "",
      tour_ids: promotion.tour_ids || [],
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
    setError("");
  }

  function buildPayload() {
    return {
      title: form.title,
      code: form.auto_apply ? null : form.code.trim().toUpperCase(),
      description: form.description || null,
      banner_image_url: form.banner_image_url || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      start_at: fromDateTimeLocal(form.start_at),
      end_at: fromDateTimeLocal(form.end_at),
      is_active: form.is_active,
      auto_apply: form.auto_apply,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      terms: form.terms || null,
      tour_ids: form.tour_ids,
    };
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingId) {
        await adminApi.updatePromotion(editingId, buildPayload());
        setMessage("Đã cập nhật khuyến mãi và đồng bộ RAG.");
      } else {
        await adminApi.createPromotion(buildPayload());
        setMessage("Đã tạo khuyến mãi và đồng bộ RAG.");
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể lưu khuyến mãi.");
    }
  }

  async function remove(id) {
    if (!window.confirm("Xóa khuyến mãi này?")) return;
    await adminApi.deletePromotion(id);
    setMessage("Đã xóa khuyến mãi và đồng bộ RAG.");
    if (editingId === id) resetForm();
    load();
  }

  function copyCode(code) {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setMessage(`Đã copy mã ${code}.`);
  }

  async function uploadBanner(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await adminApi.uploadImage(data);
      update("banner_image_url", response.data.image_url);
      setMessage("Đã upload ảnh banner. Bấm lưu để áp dụng cho khuyến mãi.");
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể upload ảnh banner.");
    } finally {
      setUploadingBanner(false);
      event.target.value = "";
    }
  }

  return (
    <div className="admin-page promotion-admin-page">
      <section className="admin-title">
        <div><span className="eyebrow">Khuyến mãi</span><h1>Quản lý khuyến mãi</h1></div>
        <p>Tạo mã giảm giá, banner và chương trình tự áp dụng theo tour.</p>
      </section>

      <div className="two-column-admin promotion-workspace">
        <section className="admin-card promotion-editor">
          <div className="card-header-row">
            <div><span className="eyebrow">Cấu hình</span><h2>{editingId ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}</h2></div>
            {editingId && <button className="ghost-button" type="button" onClick={resetForm}><X size={16} />Hủy</button>}
          </div>
          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}
          <form className="compact-form" onSubmit={submit}>
            <label>Tên khuyến mãi<input value={form.title} onChange={(event) => update("title", event.target.value)} required /></label>
            <div className="promotion-mode">
              <button className={form.auto_apply ? "active" : ""} type="button" onClick={() => update("auto_apply", true)}>Tự động giảm trên tour</button>
              <button className={!form.auto_apply ? "active" : ""} type="button" onClick={() => update("auto_apply", false)}>Cần nhập mã</button>
            </div>
            {!form.auto_apply && <label>Mã giảm giá<input value={form.code} onChange={(event) => update("code", event.target.value.toUpperCase())} placeholder="VD: HANOI10" required /></label>}
            <label>Mô tả<textarea rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} /></label>
            <div className="promotion-banner-field">
              <span>Ảnh banner khuyến mãi</span>
              {form.banner_image_url && <div className="promotion-banner-preview"><img src={form.banner_image_url} alt="Banner khuyến mãi" /><button type="button" onClick={() => update("banner_image_url", "")} aria-label="Xóa ảnh banner"><X size={16} /></button></div>}
              <label className="upload-drop compact-upload">
                <ImagePlus size={18} />{uploadingBanner ? "Đang upload..." : form.banner_image_url ? "Thay ảnh banner" : "Upload ảnh banner"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadBanner} disabled={uploadingBanner} />
              </label>
              <small>Nên dùng ảnh ngang tỉ lệ 16:5, định dạng JPG, PNG hoặc WEBP.</small>
            </div>
            <div className="form-row">
              <label>Loại giảm<select value={form.discount_type} onChange={(event) => update("discount_type", event.target.value)}><option value="percent">Theo phần trăm</option><option value="fixed_amount">Theo số tiền</option></select></label>
              <label>Giá trị<input type="number" min="1" value={form.discount_value} onChange={(event) => update("discount_value", event.target.value)} required /></label>
            </div>
            <div className="form-row">
              <label>Bắt đầu<input type="datetime-local" value={form.start_at} onChange={(event) => update("start_at", event.target.value)} /></label>
              <label>Kết thúc<input type="datetime-local" value={form.end_at} onChange={(event) => update("end_at", event.target.value)} /></label>
            </div>
            <div className="form-row">
              <label>Giới hạn lượt dùng<input type="number" min="1" value={form.usage_limit} onChange={(event) => update("usage_limit", event.target.value)} /></label>
              <label className="checkbox-row"><input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} />Đang bật</label>
            </div>
            <label>Điều kiện<textarea rows={3} value={form.terms} onChange={(event) => update("terms", event.target.value)} /></label>
            <div className="tour-checklist">
              {tours.map((tour) => (
                <label key={tour.id}>
                  <input type="checkbox" checked={form.tour_ids.includes(tour.id)} onChange={() => toggleTour(tour.id)} />
                  <span>{tour.title}</span>
                  <small>{tour.destination}</small>
                </label>
              ))}
            </div>
            <button className="primary-button" type="submit">{editingId ? <Save size={17} /> : <Plus size={17} />}{editingId ? "Lưu thay đổi" : "Tạo khuyến mãi"}</button>
          </form>
        </section>

        <section className="admin-table-card promotion-library">
          <div className="admin-list-toolbar">
            <div><span className="eyebrow">Danh sách</span><h2>Khuyến mãi</h2></div>
            <span className="chart-total">{promotions.length} chương trình</span>
          </div>
          <div className="promotion-list compact-promotion-list">
            {promotions.map((promotion) => (
              <article key={promotion.id}>
                <div className="promotion-main">
                  <BadgePercent size={18} />
                  <div>
                    <strong>{promotion.title}</strong>
                    <small>{formatDiscount(promotion)} · {promotion.tour_ids?.length || 0} tour · {promotion.auto_apply ? "Tự động" : `Mã ${promotion.code}`} · Đã dùng {promotion.used_count || 0}</small>
                    {promotion.terms && <p>{promotion.terms}</p>}
                  </div>
                </div>
                <div className="inline-actions">
                  {promotion.code && <button className="ghost-button" type="button" onClick={() => copyCode(promotion.code)}><Copy size={15} />Copy</button>}
                  <button className="ghost-button" type="button" onClick={() => edit(promotion)}><Pencil size={15} />Sửa</button>
                  <button className="ghost-button danger" type="button" onClick={() => remove(promotion.id)}><Trash2 size={15} />Xóa</button>
                </div>
              </article>
            ))}
            {!promotions.length && <p className="empty-report">Chưa có khuyến mãi.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
