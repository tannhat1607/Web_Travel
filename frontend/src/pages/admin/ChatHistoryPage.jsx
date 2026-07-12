import { Bot, MessagesSquare, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { Pagination } from "../../components/common/Pagination.jsx";

export function ChatHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function loadSessions() {
    adminApi.chatSessions({ skip: (page - 1) * pageSize, limit: pageSize }).then((response) => setSessions(response.data)).catch(() => setSessions([]));
  }

  useEffect(() => loadSessions(), [page]);

  async function openSession(session) {
    setActiveSession(session);
    const response = await adminApi.chatMessages(session.session_id);
    setMessages(response.data);
  }

  function getSessionUserLabel(session) {
    if (session.user_name) return session.user_name;
    if (session.user_email) return session.user_email;
    return "Khách chưa đăng nhập";
  }

  const visibleSessions = sessions.filter((session) => {
    const keyword = search.toLowerCase();
    return `${session.session_id} ${session.user_id || ""} ${session.user_name || ""} ${session.user_email || ""}`.toLowerCase().includes(keyword);
  });

  return (
    <div className="admin-page chat-admin-page">
      <section className="admin-title">
        <div><span className="eyebrow">Chat history</span><h1>Lịch sử hội thoại</h1></div>
        <p>Xem lại phiên chat, người dùng đã đăng nhập và ngữ cảnh RAG đã dùng để trả lời khách hàng.</p>
      </section>

      <div className="two-column-admin chat-history-layout">
        <section className="admin-table-card chat-session-panel">
          <div className="admin-list-toolbar">
            <div><span className="eyebrow">Sessions</span><h2>Phiên chat</h2></div>
            <MessagesSquare size={19} />
          </div>
          <div className="chat-session-tools">
            <label className="tour-table-search">
              <Search size={15} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm session, tên hoặc email user..." />
            </label>
            <Pagination page={page} pageSize={pageSize} itemCount={sessions.length} onChange={setPage} />
          </div>
          <div className="chat-session-list">
            {visibleSessions.map((session) => (
              <button className={activeSession?.id === session.id ? "active" : ""} type="button" key={session.id} onClick={() => openSession(session)}>
                <strong>{getSessionUserLabel(session)}</strong>
                <span>{session.user_email || `Session: ${session.session_id}`}</span>
                {session.user_id ? <small>User #{session.user_id} · {new Date(session.created_at).toLocaleString("vi-VN")}</small> : <small>{new Date(session.created_at).toLocaleString("vi-VN")}</small>}
              </button>
            ))}
            {!visibleSessions.length && <p className="empty-report">Không có session phù hợp.</p>}
          </div>
        </section>

        <section className="admin-table-card chat-log-panel">
          <div className="admin-list-toolbar">
            <div>
              <span className="eyebrow">Conversation</span>
              <h2>{activeSession ? getSessionUserLabel(activeSession) : "Chọn một session"}</h2>
            </div>
          </div>
          <div className="admin-chat-log">
            {messages.map((message) => (
              <article key={message.id}>
                <div className="chat-log-role"><UserRound size={15} /><strong>{activeSession ? getSessionUserLabel(activeSession) : "User"}</strong></div>
                <p>{message.user_message}</p>
                <div className="chat-log-role bot"><Bot size={15} /><strong>Assistant</strong></div>
                <p>{message.bot_response}</p>
                {message.retrieved_context && <small>{message.retrieved_context}</small>}
              </article>
            ))}
            {!messages.length && <p className="empty-report">Chưa chọn phiên chat hoặc phiên này chưa có tin nhắn.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
