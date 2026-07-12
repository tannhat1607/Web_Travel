import { Mail, Send } from "lucide-react";
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
        <div><span className="eyebrow">Liên hệ</span><h1>Phản hồi khách hàng</h1></div>
        <p>Quản lý câu hỏi tư vấn, ghi nhận phản hồi và trạng thái xử lý.</p>
      </section>
      {message && <div className="alert success">{message}</div>}

      <section className="admin-table-card contact-inbox">
        <div className="admin-list-toolbar">
          <div><span className="eyebrow">Inbox</span><h2>Yêu cầu liên hệ</h2></div>
          <span className="chart-total">{contacts.length} liên hệ</span>
        </div>
        <div className="contact-inbox-list">
          {contacts.map((contact) => (
            <article key={contact.id}>
              <span className="knowledge-file-icon"><Mail size={17} /></span>
              <div className="contact-inbox-body">
                <div>
                  <strong>{contact.subject || "Liên hệ"}</strong>
                  <small>{contact.full_name} · {contact.email}</small>
                </div>
                <p>{contact.message}</p>
                {contact.reply && <div className="reply-box">{contact.reply}</div>}
                <textarea value={replyText[contact.id] || ""} onChange={(event) => setReplyText({ ...replyText, [contact.id]: event.target.value })} rows="3" placeholder="Nội dung phản hồi" />
              </div>
              <button className="primary-button" onClick={() => reply(contact.id)}><Send size={15} />Lưu phản hồi</button>
            </article>
          ))}
          {!contacts.length && <p className="empty-report">Chưa có liên hệ.</p>}
        </div>
      </section>
    </div>
  );
}
