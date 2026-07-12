import { ImagePlus, Link as LinkIcon, Pencil, Plus, Search, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { formatCurrency } from "../../utils/format";

const initialForm = {
  title: "",
  slug: "",
  destination: "",
  departure_location: "",
  duration_days: 1,
  duration_nights: 0,
  price: 0,
  max_people: 20,
  available_slots: 20,
  image_url: "",
  short_description: "",
  description: "",
  schedule: "",
  food: "",
  suitable_for: "",
  highlights: "",
  is_active: true,
};

const initialItinerary = {
  day_number: 1,
  title: "",
  description: "",
  meals: "",
  accommodation: "",
};

export function TourManagePage({ mode = "manage" }) {
  const [tours, setTours] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [itineraryForm, setItineraryForm] = useState(initialItinerary);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [departureForm, setDepartureForm] = useState({ departure_at: "", capacity: 20, available_slots: 20, is_active: true });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tourStatusFilter, setTourStatusFilter] = useState("");
  const [tourSearch, setTourSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedTour = useMemo(() => tours.find((tour) => tour.id === editingId), [tours, editingId]);
  const filteredTours = useMemo(() => {
    const keyword = tourSearch.trim().toLowerCase();
    return tours.filter((tour) => {
      const isAvailable = Number(tour.available_slots || 0) > 0 && tour.is_active;
      const matchesStatus = !tourStatusFilter || (tourStatusFilter === "available" ? isAvailable : !isAvailable);
      const matchesSearch = !keyword || `${tour.title} ${tour.destination} ${tour.departure_location}`.toLowerCase().includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [tours, tourStatusFilter, tourSearch]);
  const selectedPreviewUrls = useMemo(() => selectedImageFiles.map((file) => ({
    name: file.name,
    url: URL.createObjectURL(file),
  })), [selectedImageFiles]);
  const coverPreview = selectedPreviewUrls[0]?.url || form.image_url || selectedTour?.image_url || "";

  useEffect(() => {
    return () => {
      selectedPreviewUrls.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedPreviewUrls]);

  useEffect(() => loadTours(), []);

  useEffect(() => {
    if (mode === "create") {
      if (editingId) resetForm(false);
      return;
    }
    const tourId = Number(searchParams.get("tourId") || 0);
    if (!tourId || !tours.length) {
      if (!tourId) resetForm(false);
      return;
    }
    const tour = tours.find((item) => item.id === tourId);
    if (tour && tour.id !== editingId) edit(tour, false);
  }, [searchParams, tours, mode]);

  function loadTours() {
    adminApi.tours().then((response) => {
      setTours(response.data);
      window.dispatchEvent(new Event("admin-tours-change"));
    }).catch(() => setTours([]));
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateItinerary(field, value) {
    setItineraryForm((prev) => ({ ...prev, [field]: value }));
  }

  function edit(tour, syncUrl = true) {
    setEditingId(tour.id);
    setForm({ ...initialForm, ...tour, image_url: tour.image_url || "" });
    setItineraryForm(initialItinerary);
    setEditingItineraryId(null);
    setSelectedImageFiles([]);
    setMessage("");
    setError("");
    if (syncUrl) setSearchParams({ tourId: String(tour.id) });
  }

  function resetForm(syncUrl = true) {
    setEditingId(null);
    setForm(initialForm);
    setItineraryForm(initialItinerary);
    setEditingItineraryId(null);
    setSelectedImageFiles([]);
    setMessage("");
    setError("");
    if (syncUrl) setSearchParams({});
  }

  function handleImageFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setSelectedImageFiles((current) => [...current, ...files]);
    setMessage(`Đã chọn ${files.length} ảnh. Khi lưu tour, ảnh sẽ được upload lên Supabase.`);
  }

  function removeSelectedImage(index) {
    setSelectedImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  function clearSelectedImages() {
    setSelectedImageFiles([]);
  }

  async function uploadFileToSupabase(file) {
    const formData = new FormData();
    formData.append("file", file);
    const upload = await adminApi.uploadImage(formData);
    return upload.data;
  }

  async function uploadSelectedImages() {
    const uploadedImages = [];
    for (const file of selectedImageFiles) {
      const upload = await uploadFileToSupabase(file);
      uploadedImages.push({ ...upload, original_filename: file.name });
    }
    return uploadedImages;
  }

  function buildTourPayload(imageUrl = form.image_url) {
    return {
      ...form,
      price: Number(form.price),
      duration_days: Number(form.duration_days),
      duration_nights: Number(form.duration_nights),
      max_people: Number(form.max_people),
      available_slots: Number(form.available_slots),
      image_url: imageUrl || null,
      departure_location: form.departure_location || null,
    };
  }

  async function attachTourImage(tourId, imageUrl, altText, sortOrder, isCover = false) {
    await adminApi.createTourImage(tourId, {
      image_url: imageUrl,
      alt_text: altText || form.title || "Tour image",
      sort_order: sortOrder,
      is_cover: isCover,
    });
  }

  async function attachUploadedImages(tourId, uploadedImages, existingCount = 0) {
    for (let index = 0; index < uploadedImages.length; index += 1) {
      const image = uploadedImages[index];
      await attachTourImage(
        tourId,
        image.image_url,
        image.original_filename,
        existingCount + index + 1,
        existingCount === 0 && index === 0,
      );
    }
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setUploading(selectedImageFiles.length > 0);

    try {
      const uploadedImages = selectedImageFiles.length ? await uploadSelectedImages() : [];
      const coverUrl = uploadedImages[0]?.image_url || form.image_url || "";

      if (editingId) {
        await adminApi.updateTour(editingId, buildTourPayload(coverUrl));
        if (uploadedImages.length) {
          await attachUploadedImages(editingId, uploadedImages, selectedTour?.images?.length || 0);
        }
        setMessage(uploadedImages.length ? `Đã cập nhật tour và upload ${uploadedImages.length} ảnh.` : "Đã cập nhật tour.");
      } else {
        const response = await adminApi.createTour(buildTourPayload(coverUrl));
        setEditingId(response.data.id);
        setSearchParams({ tourId: String(response.data.id) });
        if (uploadedImages.length) {
          await attachUploadedImages(response.data.id, uploadedImages, 0);
        } else if (coverUrl) {
          await attachTourImage(response.data.id, coverUrl, form.title || "Tour cover", 1, true);
        }
        setMessage(uploadedImages.length ? `Đã tạo tour và upload ${uploadedImages.length} ảnh.` : "Đã tạo tour.");
        navigate(`/admin/tours?tourId=${response.data.id}`, { replace: true });
      }

      if (coverUrl) update("image_url", coverUrl);
      setSelectedImageFiles([]);
      loadTours();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể lưu tour.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Xóa tour này?")) return;
    await adminApi.deleteTour(id);
    if (editingId === id) resetForm();
    loadTours();
  }

  async function uploadImagesToExistingTour(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || !editingId) return;

    setUploading(true);
    setError("");
    try {
      const uploadedImages = [];
      for (const file of files) {
        const upload = await uploadFileToSupabase(file);
        uploadedImages.push({ ...upload, original_filename: file.name });
      }
      await attachUploadedImages(editingId, uploadedImages, selectedTour?.images?.length || 0);
      if (!selectedTour?.images?.length && uploadedImages[0]) {
        update("image_url", uploadedImages[0].image_url);
      }
      setMessage(`Đã upload ${uploadedImages.length} ảnh tour lên Supabase.`);
      loadTours();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể upload ảnh.");
    } finally {
      setUploading(false);
    }
  }

  async function addImageUrlToExistingTour() {
    if (!editingId || !form.image_url) return;
    setError("");
    try {
      await attachTourImage(editingId, form.image_url, form.title || "Tour cover", (selectedTour?.images?.length || 0) + 1, !selectedTour?.images?.length);
      setMessage("Đã thêm ảnh từ URL.");
      loadTours();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể thêm ảnh từ URL.");
    }
  }

  async function setCover(image) {
    await adminApi.updateTourImage(image.id, { is_cover: true });
    update("image_url", image.image_url);
    setMessage("Đã đặt ảnh cover.");
    loadTours();
  }

  async function deleteImage(id) {
    await adminApi.deleteTourImage(id);
    loadTours();
  }

  async function addItinerary(event) {
    event.preventDefault();
    if (!editingId) return;
    const payload = {
      ...itineraryForm,
      day_number: Number(itineraryForm.day_number),
      meals: itineraryForm.meals || null,
      accommodation: itineraryForm.accommodation || null,
    };
    if (editingItineraryId) await adminApi.updateTourItinerary(editingItineraryId, payload);
    else await adminApi.createTourItinerary(editingId, payload);
    setItineraryForm({ ...initialItinerary, day_number: Number(itineraryForm.day_number) + 1 });
    setEditingItineraryId(null);
    setMessage(editingItineraryId ? "Đã cập nhật lịch trình." : "Đã thêm lịch trình.");
    loadTours();
  }

  function editItinerary(item) {
    setEditingItineraryId(item.id);
    setItineraryForm({
      day_number: item.day_number,
      title: item.title || "",
      description: item.description || "",
      meals: item.meals || "",
      accommodation: item.accommodation || "",
    });
    document.getElementById("itinerary-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function deleteItinerary(id) {
    await adminApi.deleteTourItinerary(id);
    loadTours();
  }

  async function addDeparture(event) {
    event.preventDefault();
    await adminApi.createTourDeparture(editingId, { ...departureForm, departure_at: new Date(departureForm.departure_at).toISOString(), capacity: Number(departureForm.capacity), available_slots: Number(departureForm.available_slots) });
    setDepartureForm({ departure_at: "", capacity: 20, available_slots: 20, is_active: true });
    setMessage("Đã thêm lịch khởi hành."); loadTours();
  }

  async function deleteDeparture(id) {
    await adminApi.deleteTourDeparture(id); setMessage("Đã xóa lịch khởi hành."); loadTours();
  }

  if (mode === "manage" && !editingId) {
    return (
      <div className="admin-page tour-admin-layout">
        <section className="admin-title tour-workspace-title">
          <div><span className="eyebrow">Quản lý tour</span><h1>Chọn tour để chỉnh sửa</h1></div>
          <p>Chỉnh thông tin, thư viện ảnh và lịch trình của những tour đã có.</p>
        </section>
        <section className="admin-table-card tour-manager-table">
          <div className="admin-list-toolbar">
            <div className="admin-table-filters">
              <label>Hiển thị:
                <select value={tourStatusFilter} onChange={(event) => setTourStatusFilter(event.target.value)}>
                  <option value="">Tất cả trạng thái</option>
                  <option value="available">Còn chỗ</option>
                  <option value="sold-out">Hết chỗ</option>
                </select>
              </label>
              <label className="tour-table-search">
                <Search size={15} />
                <input value={tourSearch} onChange={(event) => setTourSearch(event.target.value)} placeholder="Tìm theo tên hoặc vị trí..." />
              </label>
            </div>
            <button className="primary-button" type="button" onClick={() => navigate("/admin/tours/new")}><Plus size={16} />Thêm tour mới</button>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên tour & vị trí</th>
                  <th>Thời gian</th>
                  <th>Giá tour</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTours.map((tour) => {
                  const isAvailable = Number(tour.available_slots || 0) > 0 && tour.is_active;
                  return (
                    <tr key={tour.id}>
                      <td>
                        <span className="tour-table-thumb">{tour.image_url ? <img src={tour.image_url} alt={tour.title} /> : <ImagePlus size={18} />}</span>
                      </td>
                      <td>
                        <button className="tour-table-title" type="button" onClick={() => setSearchParams({ tourId: String(tour.id) })}>
                          <strong>{tour.title}</strong>
                          <span>{tour.departure_location || "Việt Nam"} → {tour.destination}</span>
                        </button>
                      </td>
                      <td>{tour.duration_days} ngày {tour.duration_nights || 0} đêm</td>
                      <td className="money-cell">{formatCurrency(tour.price)}</td>
                      <td><span className={isAvailable ? "stock-pill available" : "stock-pill soldout"}>{isAvailable ? "Còn chỗ" : "Hết chỗ"}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="icon-button" type="button" onClick={() => setSearchParams({ tourId: String(tour.id) })} title="Sửa tour"><Pencil size={15} /></button>
                          <button className="icon-button danger" type="button" onClick={() => remove(tour.id)} title="Xóa tour"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredTours.length && <p className="empty-report">Chưa có tour phù hợp.</p>}
          <div className="admin-table-footer">
            <span>Hiển thị {filteredTours.length ? 1 : 0}-{filteredTours.length} trong {tours.length} tour</span>
          </div>
        </section>
        <div className="tour-manager-toolbar legacy-tour-manager-toolbar">
          <span>{tours.length} tour trong hệ thống</span>
          <button className="primary-button" type="button" onClick={() => navigate("/admin/tours/new")}><Plus size={16} />Thêm tour mới</button>
        </div>
        <section className="tour-manager-grid">
          {tours.map((tour) => (
            <button type="button" key={tour.id} onClick={() => setSearchParams({ tourId: String(tour.id) })}>
              <span className="tour-manager-thumb">{tour.image_url ? <img src={tour.image_url} alt={tour.title} /> : <ImagePlus size={24} />}</span>
              <span><strong>{tour.title}</strong><small>{tour.destination} · {tour.duration_days} ngày</small></span>
            </button>
          ))}
          {!tours.length && <p className="muted">Chưa có tour. Hãy tạo tour đầu tiên.</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page tour-admin-layout">
      <section className="admin-title tour-workspace-title">
        <div><span className="eyebrow">{mode === "create" ? "Thêm tour" : "Quản lý tour"}</span><h1>{mode === "create" ? "Tạo hành trình mới" : "Chỉnh sửa hành trình"}</h1></div>
        <p>{mode === "create" ? "Nhập thông tin cơ bản. Sau khi lưu, bạn sẽ được chuyển sang trang quản lý ảnh và lịch trình." : `Đang cập nhật: ${form.title}`}</p>
      </section>
      <nav className="tour-workspace-nav" aria-label="Các phần quản lý tour">
        <a href="#tour-information">Thông tin tour</a>
        <a href="#tour-media" className={!editingId ? "disabled" : ""} aria-disabled={!editingId}>Thư viện ảnh</a>
        <a href="#tour-itinerary" className={!editingId ? "disabled" : ""} aria-disabled={!editingId}>Lịch trình từng ngày</a>
        <a href="#tour-departures" className={!editingId ? "disabled" : ""} aria-disabled={!editingId}>Lịch khởi hành</a>
      </nav>
      <section className="admin-card tour-form-panel" id="tour-information">
        <div className="card-header-row">
          <h2>{editingId ? "Sửa tour" : "Thêm tour"}</h2>
          <div className="inline-actions">
            {editingId && <button className="ghost-button" type="button" onClick={() => navigate("/admin/tours/new")}>Thêm tour khác</button>}
            {editingId && <button className="icon-button danger" onClick={() => remove(editingId)}><Trash2 size={16} /></button>}
          </div>
        </div>
        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form className="compact-form" onSubmit={submit}>
          <div className="form-row">
            <label>Tên tour<input value={form.title} onChange={(event) => update("title", event.target.value)} required /></label>
            <label>Slug<input value={form.slug} onChange={(event) => update("slug", event.target.value)} required /></label>
          </div>
          <div className="form-row">
            <label>Điểm đến<input value={form.destination} onChange={(event) => update("destination", event.target.value)} required /></label>
            <label>Nơi khởi hành<input value={form.departure_location || ""} onChange={(event) => update("departure_location", event.target.value)} /></label>
          </div>
          <div className="form-row four">
            <label>Số ngày<input type="number" value={form.duration_days} onChange={(event) => update("duration_days", event.target.value)} /></label>
            <label>Số đêm<input type="number" value={form.duration_nights} onChange={(event) => update("duration_nights", event.target.value)} /></label>
            <label>Giá<input type="number" value={form.price} onChange={(event) => update("price", event.target.value)} /></label>
            <label>Chỗ còn<input type="number" value={form.available_slots} onChange={(event) => update("available_slots", event.target.value)} /></label>
          </div>

          <div className="tour-image-picker wide-picker">
            <div className="tour-image-preview">
              {coverPreview ? <img src={coverPreview} alt="Ảnh cover tour" /> : <ImagePlus size={30} />}
            </div>
            <div className="tour-image-controls">
              <label>Ảnh cover URL<input value={form.image_url || ""} onChange={(event) => update("image_url", event.target.value)} placeholder="Dán link ảnh hoặc upload từ máy" /></label>
              <div className="inline-actions">
                <label className="upload-drop compact-upload">
                  <UploadCloud size={17} />Chọn nhiều ảnh từ máy
                  <input type="file" accept="image/*" multiple onChange={handleImageFiles} disabled={uploading} />
                </label>
                {selectedImageFiles.length > 0 && (
                  <button className="ghost-button" type="button" onClick={clearSelectedImages}><X size={15} />Bỏ tất cả</button>
                )}
                {editingId && form.image_url && (
                  <button className="ghost-button" type="button" onClick={addImageUrlToExistingTour}><LinkIcon size={15} />Thêm URL</button>
                )}
              </div>
              <small>Ảnh chọn từ máy sẽ được upload lên Supabase khi bấm lưu tour. Ảnh đầu tiên sẽ làm cover.</small>
              {selectedPreviewUrls.length > 0 && (
                <div className="selected-image-strip">
                  {selectedPreviewUrls.map((preview, index) => (
                    <article key={`${preview.name}-${index}`}>
                      <img src={preview.url} alt={preview.name} />
                      <button type="button" onClick={() => removeSelectedImage(index)} aria-label="Bỏ ảnh"><X size={13} /></button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <label>Mô tả ngắn<textarea value={form.short_description || ""} onChange={(event) => update("short_description", event.target.value)} rows="2" /></label>
          <label>Mô tả chi tiết<textarea value={form.description || ""} onChange={(event) => update("description", event.target.value)} rows="3" /></label>
          <label>Lịch trình tổng quan<textarea value={form.schedule || ""} onChange={(event) => update("schedule", event.target.value)} rows="3" /></label>
          <div className="form-row">
            <label>Ẩm thực<textarea value={form.food || ""} onChange={(event) => update("food", event.target.value)} rows="2" /></label>
            <label>Điểm nổi bật<textarea value={form.highlights || ""} onChange={(event) => update("highlights", event.target.value)} rows="2" /></label>
          </div>
          <label>Phù hợp cho<input value={form.suitable_for || ""} onChange={(event) => update("suitable_for", event.target.value)} /></label>
          <button className="primary-button wide" type="submit" disabled={uploading}>
            <Plus size={17} />{uploading ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm tour"}
          </button>
        </form>

        {editingId && (
          <div className="nested-admin-block tour-workspace-section" id="tour-media">
            <h3>Ảnh tour đã lưu</h3>
            <label className="upload-drop">
              <ImagePlus size={18} />{uploading ? "Đang upload..." : "Upload thêm nhiều ảnh"}
              <input type="file" accept="image/*" multiple onChange={uploadImagesToExistingTour} disabled={uploading} />
            </label>
            <div className="media-grid">
              {(selectedTour?.images || []).map((image) => (
                <article key={image.id}>
                  <img src={image.image_url} alt={image.alt_text || "Tour"} />
                  <div>
                    <button className="ghost-button" type="button" onClick={() => setCover(image)}>{image.is_cover ? "Cover" : "Đặt cover"}</button>
                    <button className="icon-button danger" type="button" onClick={() => deleteImage(image.id)}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {editingId && (
          <div className="nested-admin-block tour-workspace-section" id="tour-itinerary">
            <h3>Lịch trình từng ngày</h3>
            <form className="compact-form" id="itinerary-editor" onSubmit={addItinerary}>
              <div className="form-row">
                <label>Ngày<input type="number" value={itineraryForm.day_number} onChange={(event) => updateItinerary("day_number", event.target.value)} /></label>
                <label>Tiêu đề<input value={itineraryForm.title} onChange={(event) => updateItinerary("title", event.target.value)} required /></label>
              </div>
              <label>Mô tả<textarea value={itineraryForm.description} onChange={(event) => updateItinerary("description", event.target.value)} rows="2" required /></label>
              <div className="form-row">
                <label>Bữa ăn<input value={itineraryForm.meals} onChange={(event) => updateItinerary("meals", event.target.value)} /></label>
                <label>Lưu trú<input value={itineraryForm.accommodation} onChange={(event) => updateItinerary("accommodation", event.target.value)} /></label>
              </div>
              <div className="inline-actions">
                <button className="ghost-button wide" type="submit">{editingItineraryId ? "Lưu lịch trình" : "Thêm lịch trình"}</button>
                {editingItineraryId && <button className="ghost-button" type="button" onClick={() => { setEditingItineraryId(null); setItineraryForm(initialItinerary); }}>Hủy sửa</button>}
              </div>
            </form>
            <div className="itinerary-list">
              {(selectedTour?.itineraries || []).map((item) => (
                <article key={item.id}>
                  <strong>Ngày {item.day_number}: {item.title}</strong>
                  <p>{item.description}</p>
                  <small>{[item.meals, item.accommodation].filter(Boolean).join(" - ")}</small>
                  <button className="icon-button" type="button" onClick={() => editItinerary(item)}><Pencil size={15} /></button>
                  <button className="icon-button danger" onClick={() => deleteItinerary(item.id)}><Trash2 size={15} /></button>
                </article>
              ))}
            </div>
          </div>
        )}
        {editingId && (
          <div className="nested-admin-block tour-workspace-section" id="tour-departures">
            <h3>Lịch khởi hành</h3>
            <form className="compact-form" onSubmit={addDeparture}>
              <div className="form-row four">
                <label>Ngày giờ<input type="datetime-local" value={departureForm.departure_at} onChange={(e) => setDepartureForm({ ...departureForm, departure_at: e.target.value })} required /></label>
                <label>Sức chứa<input type="number" min="1" value={departureForm.capacity} onChange={(e) => setDepartureForm({ ...departureForm, capacity: e.target.value, available_slots: e.target.value })} /></label>
                <label>Chỗ còn<input type="number" min="0" value={departureForm.available_slots} onChange={(e) => setDepartureForm({ ...departureForm, available_slots: e.target.value })} /></label>
                <button className="primary-button" type="submit">Thêm chuyến</button>
              </div>
            </form>
            <div className="itinerary-list">
              {(selectedTour?.departures || []).map((item) => <article key={item.id}><strong>{new Date(item.departure_at).toLocaleString("vi-VN")}</strong><p>Còn {item.available_slots}/{item.capacity} chỗ</p><button className="icon-button danger" type="button" onClick={() => deleteDeparture(item.id)}><Trash2 size={15} /></button></article>)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
