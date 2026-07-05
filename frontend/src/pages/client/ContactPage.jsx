import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { contactApi } from "../../api/contactApi";

export function ContactPage() {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", subject: "", message: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      await contactApi.create({ ...form, phone: form.phone || null, subject: form.subject || null });
      setNotice("Đã gửi liên hệ. Admin sẽ phản hồi sau.");
      setForm({ full_name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể gửi liên hệ.");
    }
  }

  return (
    <div className="page contact-page">
      <section className="page-title">
        <span className="eyebrow">Liên hệ</span>
        <h1>Cần tư vấn tour? Gửi thông tin cho Travelora.</h1>
      </section>

      <div className="contact-layout">
        <aside className="contact-info-panel">
          <article><Mail size={22} /><div><strong>Email</strong><span>support@travelora.vn</span></div></article>
          <article><Phone size={22} /><div><strong>Hotline</strong><span>0900 000 000</span></div></article>
          <article><MapPin size={22} /><div><strong>Văn phòng</strong><span>Đà Nẵng, Việt Nam</span></div></article>
        </aside>

        <form className="form-panel contact-form" onSubmit={submit}>
          {notice && <div className="alert success">{notice}</div>}
          {error && <div className="alert error">{error}</div>}
          <div className="form-row">
            <label>Họ tên<input value={form.full_name} onChange={(event) => update("full_name", event.target.value)} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label>
          </div>
          <div className="form-row">
            <label>Số điện thoại<input value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
            <label>Chủ đề<input value={form.subject} onChange={(event) => update("subject", event.target.value)} /></label>
          </div>
          <label>Nội dung<textarea rows={6} value={form.message} onChange={(event) => update("message", event.target.value)} required /></label>
          <button className="primary-button wide" type="submit"><Send size={17} />Gửi liên hệ</button>
        </form>
      </div>
    </div>
  );
}
