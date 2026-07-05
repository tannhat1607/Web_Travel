import { MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

export function ChatHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  function loadSessions() {
    adminApi.chatSessions().then((response) => setSessions(response.data)).catch(() => setSessions([]));
  }

  useEffect(() => loadSessions(), []);

  async function openSession(session) {
    setActiveSession(session);
    const response = await adminApi.chatMessages(session.session_id);
    setMessages(response.data);
  }

  return (
    <div className="admin-page two-column-admin">
      <section className="admin-card">
        <div className="card-header-row">
          <h2>Chat sessions</h2>
          <MessagesSquare size={20} />
        </div>
        <div className="knowledge-list">
          {sessions.map((session) => (
            <article key={session.id}>
              <div>
                <button className="link-button" onClick={() => openSession(session)}>{session.session_id}</button>
                <small>User: {session.user_id || "anonymous"}</small>
                <small>{new Date(session.created_at).toLocaleString()}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-card">
        <h2>{activeSession ? "Lịch sử trò chuyện" : "Chọn một session"}</h2>
        <div className="admin-chat-log">
          {messages.map((message) => (
            <article key={message.id}>
              <strong>User</strong>
              <p>{message.user_message}</p>
              <strong>Assistant</strong>
              <p>{message.bot_response}</p>
              {message.retrieved_context && <small>{message.retrieved_context}</small>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
