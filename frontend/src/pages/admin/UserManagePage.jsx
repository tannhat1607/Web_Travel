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
    await adminApi.updateUser(user.id, { is_active: !user.is_active });
    load();
  }

  async function changeRole(user, role) {
    await adminApi.updateUser(user.id, { role });
    load();
  }

  const visibleUsers = users.filter((user) => `${user.full_name} ${user.email} ${user.phone || ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page">
      <section className="admin-title">
        <span className="eyebrow">Người dùng</span>
        <h1>Quản lý tài khoản</h1>
      </section>
      <div className="toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, email, số điện thoại" /></div>
      <div className="table-card">
        <table>
          <thead><tr><th>Họ tên</th><th>Email</th><th>Phone</th><th>Role</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td><select value={user.role} onChange={(event) => changeRole(user, event.target.value)}><option value="customer">Customer</option><option value="admin">Admin</option></select></td>
                <td>{user.is_active ? "Active" : "Locked"}</td>
                <td><button className="ghost-button" onClick={() => toggle(user)}>{user.is_active ? "Khóa" : "Mở"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} itemCount={users.length} onChange={setPage} />
    </div>
  );
}
