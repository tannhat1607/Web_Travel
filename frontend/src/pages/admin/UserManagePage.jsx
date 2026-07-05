import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

export function UserManagePage() {
  const [users, setUsers] = useState([]);

  function load() {
    adminApi.users().then((response) => setUsers(response.data)).catch(() => setUsers([]));
  }

  useEffect(() => load(), []);

  async function toggle(user) {
    await adminApi.updateUser(user.id, { is_active: !user.is_active });
    load();
  }

  return (
    <div className="admin-page">
      <section className="admin-title">
        <span className="eyebrow">Người dùng</span>
        <h1>Quản lý tài khoản</h1>
      </section>
      <div className="table-card">
        <table>
          <thead><tr><th>Họ tên</th><th>Email</th><th>Phone</th><th>Role</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.role}</td>
                <td>{user.is_active ? "Active" : "Locked"}</td>
                <td><button className="ghost-button" onClick={() => toggle(user)}>{user.is_active ? "Khóa" : "Mở"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
