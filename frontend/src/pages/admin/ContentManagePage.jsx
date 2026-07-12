import { Eye, FileText, ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { contentApi } from "../../api/contentApi";
import { Pagination } from "../../components/common/Pagination";

const contentTypes = [
  { value: "guide", label: "Cẩm nang" },
  { value: "destination", label: "Điểm đến" },
  { value: "page", label: "Trang nội dung" },
];

const emptyForm = {
  content_type: "guide",
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  image_url: "",
  is_published: true,
  sort_order: 0,
};

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export function ContentManagePage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [activeType, setActiveType] = useState("guide");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const pageSize = 8;

  const activeTypeLabel = useMemo(
    () => contentTypes.find((type) => type.value === activeType)?.label || "Nội dung",
    [activeType],
  );

  useEffect(() => {
    load();
  }, [activeType, page]);

  async function load({ type = activeType, pageNumber = page, query = search } = {}) {
    try {
      const response = await contentApi.admin({
        content_type: type,
        q: query || undefined,
        skip: (pageNumber - 1) * pageSize,
        limit: pageSize,
      });
      setItems(response.data);
    } catch (err) {
      setItems([]);
      setError(err.response?.data?.detail || "Không thể tải nội dung CMS.");
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateTitle(value) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: editingId || current.slug ? current.slug : slugify(value),
    }));
  }

  function resetForm(type = activeType) {
    setForm({ ...emptyForm, content_type: type });
    setEditingId(null);
    setMessage("");
    setError("");
  }

  function changeType(type) {
    setActiveType(type);
    setPage(1);
    resetForm(type);
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({ ...emptyForm, ...item });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    setError("");
    try {
      const response = await adminApi.uploadImage(data);
      update("image_url", response.data.image_url);
      setMessage("Đã upload ảnh. Bấm lưu để áp dụng cho nội dung.");
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể upload ảnh.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, slug: slugify(form.slug || form.title) };
      if (editingId) {
        await contentApi.update(editingId, payload);
        resetForm(payload.content_type);
        setMessage("Đã cập nhật nội dung.");
      } else {
        await contentApi.create(payload);
        resetForm(payload.content_type);
        setMessage("Đã thêm nội dung mới.");
      }
      setActiveType(payload.content_type);
      setPage(1);
      await load({ type: payload.content_type, pageNumber: 1, query: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể lưu nội dung.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!confirm(`Xóa "${item.title}"?`)) return;
    try {
      await contentApi.remove(item.id);
      setMessage("Đã xóa nội dung.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể xóa nội dung.");
    }
  }

  async function togglePublish(item) {
    try {
      await contentApi.update(item.id, { is_published: !item.is_published });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể cập nhật trạng thái.");
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    load({ pageNumber: 1, query: search });
  }

  return (
    <div className="admin-page cms-admin-page">
      <section className="admin-title">
        <div>
          <span className="eyebrow">CMS</span>
          <h1>Quản lý nội dung</h1>
        </div>
        <p>Quản lý cẩm nang, điểm đến và các trang nội dung hiển thị ngoài website.</p>
      </section>

      <div className="cms-tabs" role="tablist" aria-label="Loại nội dung">
        {contentTypes.map((type) => (
          <button className={activeType === type.value ? "active" : ""} type="button" key={type.value} onClick={() => changeType(type.value)}>
            {type.label}
          </button>
        ))}
      </div>

      <div className="two-column-admin cms-workspace">
        <section className="admin-card cms-editor">
          <div className="card-header-row">
            <div>
              <span className="eyebrow">{activeTypeLabel}</span>
              <h2>{editingId ? "Sửa nội dung" : "Thêm nội dung"}</h2>
            </div>
            {editingId && <button className="icon-button" type="button" onClick={() => resetForm()} title="Hủy sửa"><X size={16} /></button>}
          </div>

          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}

          <form className="compact-form" onSubmit={submit}>
            <label>Loại nội dung
              <select value={form.content_type} onChange={(event) => update("content_type", event.target.value)}>
                {contentTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label>Tiêu đề
              <input required value={form.title} onChange={(event) => updateTitle(event.target.value)} placeholder="VD: Kinh nghiệm đi Đà Nẵng 3 ngày" />
            </label>
            <label>Slug
              <input required value={form.slug} onChange={(event) => update("slug", slugify(event.target.value))} placeholder="kinh-nghiem-da-nang" />
            </label>
            <label>Mô tả ngắn
              <textarea rows="3" value={form.excerpt || ""} onChange={(event) => update("excerpt", event.target.value)} />
            </label>
            <label>Nội dung
              <textarea rows="8" value={form.content || ""} onChange={(event) => update("content", event.target.value)} />
            </label>
            <label>Ảnh đại diện URL
              <input value={form.image_url || ""} onChange={(event) => update("image_url", event.target.value)} placeholder="Dán URL hoặc upload từ máy" />
            </label>
            <label className="upload-drop compact-upload">
              <ImagePlus size={18} />{uploading ? "Đang upload..." : "Upload ảnh nội dung"}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploading} />
            </label>
            {form.image_url && <img className="cms-image-preview" src={form.image_url} alt={form.title || "Preview"} />}
            <div className="form-row">
              <label>Thứ tự
                <input type="number" value={form.sort_order} onChange={(event) => update("sort_order", Number(event.target.value))} />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={form.is_published} onChange={(event) => update("is_published", event.target.checked)} />
                Xuất bản
              </label>
            </div>
            <button className="primary-button wide" type="submit" disabled={saving || uploading}>
              <Plus size={17} />{saving ? "Đang lưu..." : editingId ? "Cập nhật nội dung" : "Thêm nội dung"}
            </button>
          </form>
        </section>

        <section className="admin-card cms-library">
          <div className="card-header-row">
            <div>
              <span className="eyebrow">{activeTypeLabel}</span>
              <h2>Kho nội dung</h2>
            </div>
            <span className="chart-total">{items.length} mục</span>
          </div>

          <form className="cms-search" onSubmit={submitSearch}>
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tiêu đề, slug, mô tả..." />
            <button type="submit">Tìm</button>
          </form>

          <div className="cms-list">
            {items.map((item) => (
              <article key={item.id}>
                <div className="cms-thumb">
                  {item.image_url ? <img src={item.image_url} alt={item.title} /> : <FileText size={20} />}
                </div>
                <div className="cms-item-body">
                  <small>{contentTypes.find((type) => type.value === item.content_type)?.label || item.content_type} · {item.is_published ? "đã xuất bản" : "bản nháp"}</small>
                  <strong>{item.title}</strong>
                  <p>{item.excerpt || item.content || "Chưa có mô tả."}</p>
                  <code>{item.slug}</code>
                </div>
                <div className="inline-actions">
                  <button className="icon-button" type="button" onClick={() => togglePublish(item)} title={item.is_published ? "Chuyển thành nháp" : "Xuất bản"}>
                    <Eye size={15} />
                  </button>
                  <button className="icon-button" type="button" onClick={() => edit(item)} title="Sửa">
                    <Pencil size={15} />
                  </button>
                  <button className="icon-button danger" type="button" onClick={() => remove(item)} title="Xóa">
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
            {!items.length && <div className="empty-report">Chưa có nội dung trong nhóm này.</div>}
          </div>

          <Pagination page={page} pageSize={pageSize} itemCount={items.length} onChange={setPage} />
        </section>
      </div>
    </div>
  );
}
