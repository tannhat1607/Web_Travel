import { useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { chatApi } from "../../api/chatApi";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([
    { role: "bot", text: "Mình là trợ lý du lịch. Bạn có thể hỏi về tour, lịch trình, giá hoặc món ăn." },
  ]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    setMessage("");
    setItems((prev) => [...prev, { role: "user", text }]);

    setLoading(true);
    try {
      const response = await chatApi.send({ message: text, session_id: sessionId });
      setSessionId(response.data.session_id);
      setItems((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.data.answer,
          sources: response.data.sources || [],
        },
      ]);
    } catch (error) {
      setItems((prev) => [...prev, { role: "bot", text: "Chatbot đang gặp lỗi kết nối. Vui lòng thử lại sau." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-widget">
      {open && (
        <section className="chat-panel">
          <header>
            <div className="chat-title">
              <span className="bot-avatar"><Bot size={18} /></span>
              <span><strong>VoyagePro Assistant</strong><small>AI Guide - Online</small></span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chatbot"><X size={18} /></button>
          </header>
          <div className="chat-messages">
            {items.map((item, index) => (
              <div className={`chat-bubble ${item.role}`} key={`${item.role}-${index}`}>
                <p>{item.text}</p>
                {item.sources?.length > 0 && <small>Nguồn: {item.sources.join(", ")}</small>}
              </div>
            ))}
            {loading && <div className="chat-bubble bot"><p>Đang tìm thông tin...</p></div>}
          </div>
          <form onSubmit={sendMessage} className="chat-input">
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Hỏi về tour..." />
            <button type="submit" aria-label="Gửi tin nhắn"><Send size={17} /></button>
          </form>
        </section>
      )}
      <button type="button" className="chat-toggle" onClick={() => setOpen((value) => !value)} aria-label="Mở chatbot">
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
