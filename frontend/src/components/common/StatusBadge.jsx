import { statusLabel } from "../../utils/format";

export function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{statusLabel(status)}</span>;
}
