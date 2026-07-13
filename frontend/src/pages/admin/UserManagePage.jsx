import { Lock, Search, ShieldCheck, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { Pagination } from "../../components/common/Pagination.jsx";

export function UserManagePage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function load() {
    adminApi.users({ skip: (page - 1) * pageSize, limit: pageSize }).then((response) => setUsers(response.data)).catch(() => setUsers([]));
  }

  useEffect(() => load(), [page]);

  async function toggle(user) {
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      load();
    } catch {
      // The global Admin status reports the API error.
    }
  }

  async function changeRole(user, role) {
    try {
      await adminApi.updateUser(user.id, { role });
      load();
    } catch {
      // The global Admin status reports the API error.
    }
  }

  const visibleUsers = users.filter((user) => `${user.full_name} ${user.email} ${user.phone || ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page">
      <section className="admin-title">
        <div><span className="eyebrow">Người dùng</span><h1>Quản lý tài khoản</h1></div>
        <p>Kiểm soát vai trò, trạng thái hoạt động, điểm thành viên và thông tin liên hệ của người dùng.</p>
      </section>

      <section className="admin-table-card">
        <div className="admin-list-toolbar">
          <label className="tour-table-search">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, email, số điện thoại..." />
          </label>
          <Pagination page={page} pageSize={pageSize} itemCount={users.length} onChange={setPage} />
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Điểm</th>
                <th>Hạng</th>
                <th>Role</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.full_name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.phone || "—"}</td>
                  <td>
                    <strong>{Number(user.loyalty_points || 0).toLocaleString("vi-VN")}</strong>
                    <small className="muted-cell">Tổng tích lũy {Number(user.lifetime_points || 0).toLocaleString("vi-VN")}</small>
                  </td>
                  <td><span className={`loyalty-tier tier-${user.loyalty_tier?.key || "member"}`}>{user.loyalty_tier?.label || "Thành viên"}</span></td>
                  <td>
                    <select className="table-select" value={user.role} onChange={(event) => changeRole(user, event.target.value)}>
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td><span className={user.is_active ? "stock-pill available" : "stock-pill soldout"}>{user.is_active ? "Active" : "Locked"}</span></td>
                  <td>
                    <button className="ghost-button" onClick={() => toggle(user)}>
                      {user.is_active ? <Lock size={15} /> : <Unlock size={15} />}
                      {user.is_active ? "Khóa" : "Mở"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visibleUsers.length && <p className="empty-report">Không tìm thấy tài khoản phù hợp.</p>}
        <div className="admin-table-footer"><span>Hiển thị {visibleUsers.length} trong {users.length} tài khoản</span><ShieldCheck size={15} /></div>
      </section>
    </div>
  );
}
