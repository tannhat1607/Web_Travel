import { Database, FileText, FileUp, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi";

export function KnowledgeManagePage() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return documents;
    return documents.filter((document) => `${document.title} ${document.content}`.toLowerCase().includes(keyword));
  }, [documents, search]);

  function load() {
    adminApi.knowledge({ source_type: "upload" }).then((response) => setDocuments(response.data)).catch(() => setDocuments([]));
  }

  useEffect(() => load(), []);

  async function remove(id) {
    if (!confirm("Xóa tài liệu này khỏi Knowledge/RAG?")) return;
    try {
      await adminApi.deleteKnowledge(id);
      setMessage("Đã xóa tài liệu PDF và cập nhật RAG.");
      setError("");
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể xóa tài liệu.");
    }
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("source_type", "upload");
      await adminApi.uploadKnowledge(formData);
      setMessage("Đã upload PDF và cập nhật RAG.");
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể upload PDF.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-page knowledge-admin-page">
      <section className="admin-title">
        <div>
          <span className="eyebrow">Knowledge/RAG</span>
          <h1>Quản lý tri thức chatbot</h1>
        </div>
        <p>Upload tài liệu PDF để bổ sung ngữ cảnh trả lời cho trợ lý du lịch.</p>
      </section>

      <div className="two-column-admin knowledge-workspace">
        <section className="admin-card knowledge-uploader">
          <div className="knowledge-icon"><Database size={22} /></div>
          <h2>Nguồn tri thức bổ sung</h2>
          <p>PDF sau khi upload sẽ được trích xuất nội dung và cập nhật lại chỉ mục RAG.</p>
          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}
          <label className="upload-drop knowledge-upload-drop">
            <FileUp size={18} />{uploading ? "Đang upload..." : "Upload PDF"}
            <input type="file" accept=".pdf,application/pdf" onChange={uploadFile} disabled={uploading} />
          </label>
          <div className="knowledge-stats">
            <article><strong>{documents.length}</strong><span>Tài liệu</span></article>
            <article><strong>{documents.reduce((total, document) => total + (document.content?.length || 0), 0).toLocaleString("vi-VN")}</strong><span>Ký tự</span></article>
          </div>
        </section>

        <section className="admin-table-card knowledge-library">
          <div className="admin-list-toolbar">
            <div>
              <span className="eyebrow">Tài liệu PDF</span>
              <h2>Kho tri thức</h2>
            </div>
            <label className="tour-table-search knowledge-search">
              <Search size={15} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tài liệu..." />
            </label>
          </div>

          <div className="knowledge-document-list">
            {filteredDocuments.map((document) => (
              <article key={document.id}>
                <span className="knowledge-file-icon"><FileText size={18} /></span>
                <div>
                  <strong>{document.title}</strong>
                  <small>{document.source_type}:{document.source_id || document.id}</small>
                  <p>{document.content}</p>
                </div>
                <button className="icon-button danger" type="button" onClick={() => remove(document.id)} title="Xóa tài liệu">
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
            {!filteredDocuments.length && <p className="empty-report">Chưa có tài liệu phù hợp.</p>}
          </div>

          <div className="admin-table-footer">
            <span>Hiển thị {filteredDocuments.length} trong {documents.length} tài liệu</span>
          </div>
        </section>
      </div>
    </div>
  );
}
