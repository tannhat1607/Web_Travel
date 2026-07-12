import { useEffect, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { chatApi } from "../../api/chatApi";

const STORAGE_KEY = "travelora_chat";
const WELCOME_MESSAGE = {
  role: "bot",
  text: "Mình là trợ lý du lịch. Bạn có thể hỏi về tour, lịch trình, giá hoặc điểm đến.",
};

function readStoredChat() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function ChatWidget() {
  const storedChat = readStoredChat();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(storedChat.sessionId || null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(
    Array.isArray(storedChat.items) && storedChat.items.length
      ? storedChat.items
      : [WELCOME_MESSAGE],
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sessionId, items: items.slice(-50) }),
      );
    } catch {
      // Chat remains usable when localStorage is disabled or full.
    }
  }, [sessionId, items]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    setMessage("");
    setItems((previous) => [...previous, { role: "user", text }]);

    setLoading(true);
    try {
      const response = await chatApi.send({ message: text, session_id: sessionId });
      setSessionId(response.data.session_id);
      setItems((previous) => [
        ...previous,
        {
          role: "bot",
          text: response.data.answer,
          sources: response.data.sources || [],
        },
      ]);
    } catch {
      setItems((previous) => [
        ...previous,
        { role: "bot", text: "Chatbot đang gặp lỗi kết nối. Vui lòng thử lại sau." },
      ]);
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
              <span><strong>Travelora Assistant</strong><small>Trợ lý AI · Trực tuyến</small></span>
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
