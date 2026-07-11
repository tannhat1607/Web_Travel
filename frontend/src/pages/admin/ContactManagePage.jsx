import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

export function ContactManagePage() {
  const [contacts, setContacts] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [message, setMessage] = useState("");

  function load() {
    adminApi.contacts().then((response) => setContacts(response.data)).catch(() => setContacts([]));
  }

  useEffect(() => load(), []);

  async function reply(id) {
    if (!replyText[id]?.trim()) {
      setMessage("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    await adminApi.replyContact(id, { reply: replyText[id] || "" });
    setReplyText((prev) => ({ ...prev, [id]: "" }));
    setMessage("Đã lưu phản hồi. Chế độ demo không gửi email ra ngoài.");
    load();
  }

  return (
    <div className="admin-page">
      <section className="admin-title">
        <span className="eyebrow">Liên hệ</span>
        <h1>Phản hồi khách hàng</h1>
      </section>
      {message && <div className="alert success">{message}</div>}
      <div className="contact-grid">
        {contacts.map((contact) => (
          <article className="admin-card" key={contact.id}>
            <h3>{contact.subject || "Liên hệ"}</h3>
            <small>{contact.full_name} - {contact.email}</small>
            <p>{contact.message}</p>
            {contact.reply && <div className="reply-box">{contact.reply}</div>}
            <textarea value={replyText[contact.id] || ""} onChange={(event) => setReplyText({ ...replyText, [contact.id]: event.target.value })} rows="3" placeholder="Nội dung phản hồi" />
            <button className="primary-button" onClick={() => reply(contact.id)}>Gửi phản hồi</button>
          </article>
        ))}
      </div>
    </div>
  );
}
