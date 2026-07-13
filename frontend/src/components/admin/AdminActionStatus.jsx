import { CheckCircle2, LoaderCircle, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ADMIN_STATUS_EVENT } from "../../utils/adminStatus.js";

export function AdminActionStatus() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let dismissTimer;
    function showNotice(event) {
      window.clearTimeout(dismissTimer);
      setNotice(event.detail);
      if (event.detail?.type !== "loading") {
        dismissTimer = window.setTimeout(() => setNotice(null), event.detail.type === "error" ? 5500 : 3500);
      }
    }
    window.addEventListener(ADMIN_STATUS_EVENT, showNotice);
    return () => {
      window.clearTimeout(dismissTimer);
      window.removeEventListener(ADMIN_STATUS_EVENT, showNotice);
    };
  }, []);

  if (!notice) return null;
  const Icon = notice.type === "loading" ? LoaderCircle : notice.type === "success" ? CheckCircle2 : XCircle;

  return (
    <div className={`admin-action-status ${notice.type}`} role="status" aria-live="polite">
      <Icon size={19} className={notice.type === "loading" ? "spinning" : ""} />
      <div><strong>{notice.message}</strong>{notice.detail && <span>{notice.detail}</span>}</div>
      {notice.type !== "loading" && <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo"><X size={16} /></button>}
    </div>
  );
}
