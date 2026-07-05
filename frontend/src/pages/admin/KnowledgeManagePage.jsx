import { FileUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

export function KnowledgeManagePage() {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  function load() {
    adminApi.knowledge({ source_type: "upload" }).then((response) => setDocuments(response.data)).catch(() => setDocuments([]));
  }

  useEffect(() => load(), []);

  async function remove(id) {
    await adminApi.deleteKnowledge(id);
    setMessage("Da xoa tai lieu PDF va cap nhat RAG.");
    load();
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("source_type", "upload");
      await adminApi.uploadKnowledge(formData);
      setMessage("Da upload PDF va cap nhat RAG.");
      load();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-page two-column-admin">
      <section className="admin-card">
        <div className="card-header-row">
          <h2>Knowledge/RAG</h2>
        </div>
        {message && <div className="alert success">{message}</div>}
        <label className="upload-drop">
          <FileUp size={18} />{uploading ? "Dang upload..." : "Upload PDF bo sung"}
          <input type="file" accept=".pdf,application/pdf" onChange={uploadFile} disabled={uploading} />
        </label>
      </section>
      <section className="admin-card">
        <h2>Tai lieu PDF bo sung</h2>
        <div className="knowledge-list">
          {documents.map((document) => (
            <article key={document.id}>
              <div>
                <strong>{document.title}</strong>
                <small>{document.source_type}:{document.source_id || document.id}</small>
                <p>{document.content}</p>
              </div>
              <button className="icon-button danger" onClick={() => remove(document.id)}><Trash2 size={16} /></button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
