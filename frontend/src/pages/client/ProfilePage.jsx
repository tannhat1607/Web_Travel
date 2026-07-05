import {
  Bell,
  CalendarCheck,
  Check,
  CreditCard,
  History,
  KeyRound,
  LogOut,
  Mail,
  ReceiptText,
  Save,
  Settings,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { logout, saveStoredUser } from "../../store/authStore";

const passwordRules = [
  { key: "length", label: "Ít nhất 8 ký tự", test: (value) => value.length >= 8 },
  { key: "lowercase", label: "Có chữ thường", test: (value) => /[a-z]/.test(value) },
  { key: "uppercase", label: "Có chữ hoa", test: (value) => /[A-Z]/.test(value) },
  { key: "number", label: "Có chữ số", test: (value) => /\d/.test(value) },
  { key: "special", label: "Có ký tự đặc biệt", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("account");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", avatar_url: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const passwordErrors = useMemo(() => {
    return passwordRules.filter((rule) => !rule.test(passwordForm.new_password));
  }, [passwordForm.new_password]);
  const passwordMatches = passwordForm.confirm_password.length > 0 && passwordForm.new_password === passwordForm.confirm_password;

  useEffect(() => {
    authApi.me().then((response) => {
      setForm({
        full_name: response.data.full_name || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        avatar_url: response.data.avatar_url || "",
      });
    });
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updatePassword(field, value) {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function submitProfile(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await authApi.updateProfile({
        full_name: form.full_name,
        phone: form.phone || null,
        avatar_url: form.avatar_url || null,
      });
      saveStoredUser(response.data);
      setMessage("Đã cập nhật hồ sơ.");
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể cập nhật hồ sơ.");
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (passwordErrors.length > 0) {
      setPasswordError("Mật khẩu mới chưa đủ mạnh.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      await authApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMessage("Đã đổi mật khẩu.");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPasswordError(err.response?.data?.detail || "Không thể đổi mật khẩu.");
    }
  }

  return (
    <div className="profile-settings-page">
      <aside className="settings-sidebar">
        <div className="settings-user">
          <div className="settings-avatar">
            {form.avatar_url ? <img src={form.avatar_url} alt={form.full_name} /> : <span>{getInitials(form.full_name)}</span>}
          </div>
          <div>
            <strong>{form.full_name || "Người dùng Travelora"}</strong>
            <small>{form.email || "Tài khoản Travelora"}</small>
          </div>
        </div>

        <div className="settings-priority">
          <span>Bạn là thành viên Bronze Priority</span>
        </div>

        <nav className="settings-menu">
          <span><WalletCards size={19} />0 điểm</span>
          <span><CreditCard size={19} />Thanh toán</span>
          <span><ReceiptText size={19} />Đặt chỗ của tôi</span>
          <span><History size={19} />Danh sách giao dịch</span>
          <span><WalletCards size={19} />Thanh toán & Hoàn tiền</span>
          <span><Bell size={19} />Thông báo giá tour</span>
          <span><CalendarCheck size={19} />Thông tin hành khách đã lưu</span>
          <span><Mail size={19} />Cài đặt thông báo</span>
          <button className="active" type="button"><Settings size={19} />Tài khoản</button>
          <button type="button" onClick={handleLogout}><LogOut size={19} />Đăng xuất</button>
        </nav>
      </aside>

      <main className="settings-main">
        <h1>Cài đặt</h1>
        <div className="settings-tabs">
          <button className={activeTab === "account" ? "active" : ""} type="button" onClick={() => setActiveTab("account")}>Thông tin tài khoản</button>
          <button className={activeTab === "security" ? "active" : ""} type="button" onClick={() => setActiveTab("security")}>Mật khẩu & Bảo mật</button>
        </div>

        {activeTab === "account" ? (
          <div className="settings-stack">
            <form className="settings-panel" onSubmit={submitProfile}>
              <header>
                <h2>Dữ liệu cá nhân</h2>
              </header>
              {message && <div className="alert success">{message}</div>}
              {error && <div className="alert error">{error}</div>}
              <div className="settings-panel-body">
                <label>
                  Tên đầy đủ
                  <input value={form.full_name} onChange={(event) => update("full_name", event.target.value)} required />
                  <small>Tên trong hồ sơ được rút ngắn từ họ tên của bạn.</small>
                </label>
                <div className="settings-row">
                  <label>
                    Giới tính
                    <select disabled defaultValue="Nam">
                      <option>Nam</option>
                      <option>Nữ</option>
                      <option>Khác</option>
                    </select>
                  </label>
                  <label>
                    Ngày sinh
                    <input disabled placeholder="Chưa hỗ trợ" />
                  </label>
                </div>
                <label>
                  Thành phố cư trú
                  <input disabled placeholder="Thành phố cư trú" />
                </label>
                <label>
                  Avatar URL
                  <input value={form.avatar_url} onChange={(event) => update("avatar_url", event.target.value)} placeholder="https://..." />
                </label>
                <div className="settings-actions">
                  <button className="ghost-button" type="button" disabled>Có lẽ để sau</button>
                  <button className="primary-button" type="submit"><Save size={16} />Lưu</button>
                </div>
              </div>
            </form>

            <section className="settings-panel compact">
              <header>
                <div>
                  <h2>Email</h2>
                  <p>Chỉ có thể sử dụng tối đa 3 email</p>
                </div>
              </header>
              <div className="settings-list-line">
                <strong>1. {form.email || "Chưa có email"}</strong>
                <span>Nơi nhận thông báo</span>
              </div>
            </section>

            <section className="settings-panel compact">
              <header>
                <div>
                  <h2>Số di động</h2>
                  <p>Chỉ có thể sử dụng tối đa 3 số di động</p>
                </div>
              </header>
              <div className="settings-list-line">
                <strong>{form.phone || "Chưa thêm số điện thoại"}</strong>
              </div>
            </section>
          </div>
        ) : (
          <form className="settings-panel" onSubmit={submitPassword}>
            <header>
              <h2>Đổi mật khẩu</h2>
            </header>
            {passwordMessage && <div className="alert success">{passwordMessage}</div>}
            {passwordError && <div className="alert error">{passwordError}</div>}
            <div className="settings-panel-body">
              <label>
                Mật khẩu hiện tại
                <input type="password" value={passwordForm.current_password} onChange={(event) => updatePassword("current_password", event.target.value)} required />
              </label>
              <label>
                Mật khẩu mới
                <input type="password" value={passwordForm.new_password} onChange={(event) => updatePassword("new_password", event.target.value)} required />
              </label>
              <div className="password-rules compact-rules">
                {passwordRules.map((rule) => {
                  const valid = rule.test(passwordForm.new_password);
                  return (
                    <span className={valid ? "valid" : ""} key={rule.key}>
                      {valid ? <Check size={14} /> : <X size={14} />}
                      {rule.label}
                    </span>
                  );
                })}
              </div>
              <label>
                Nhập lại mật khẩu mới
                <input type="password" value={passwordForm.confirm_password} onChange={(event) => updatePassword("confirm_password", event.target.value)} required />
              </label>
              {passwordForm.confirm_password && (
                <small className={passwordMatches ? "field-hint valid" : "field-hint error"}>
                  {passwordMatches ? "Mật khẩu khớp." : "Mật khẩu nhập lại chưa khớp."}
                </small>
              )}
              <div className="settings-actions">
                <button className="primary-button" type="submit"><KeyRound size={16} />Đổi mật khẩu</button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "TV";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
