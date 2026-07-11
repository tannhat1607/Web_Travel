import { ArrowRight, Lock, Mail, Plane, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { login } from "../../store/authStore";

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Email hoặc mật khẩu không đúng.");
    }
  }

  async function requestReset() {
    setError("");
    if (!form.email) return setError("Nhập email để lấy mã đặt lại.");
    const response = await authApi.forgotPassword({ email: form.email });
    if (!response.data.reset_token) return setError("Không tìm thấy tài khoản demo với email này.");
    setResetToken(response.data.reset_token);
    setResetMode(true);
    setMessage("Đã tạo mã đặt lại demo. Nhập mật khẩu mới bên dưới.");
  }

  async function resetPassword() {
    setError("");
    try {
      await authApi.resetPassword({ token: resetToken, new_password: newPassword });
      setResetMode(false);
      setResetToken("");
      setNewPassword("");
      setMessage("Đã đổi mật khẩu. Bạn có thể đăng nhập.");
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể đặt lại mật khẩu.");
    }
  }

  return (
    <div className="auth-page auth-modal-page">
      <div className="auth-landing-copy" aria-hidden="true">
        <span>Travelora</span>
        <h2>Đặt tour nhanh hơn với trợ lý du lịch thông minh</h2>
        <p>Khám phá tour, kiểm tra lịch trình và quản lý booking trong một trải nghiệm gọn gàng.</p>
      </div>

      <form className="auth-card auth-modal-card" onSubmit={submit}>
        <Link className="auth-close" to="/" aria-label="Đóng">
          <X size={18} />
        </Link>
        <div className="auth-visual-banner">
          <div>
            <Plane size={22} />
            <strong>Ưu đãi đang chờ bạn</strong>
          </div>
          <span>Tour hè, biển xanh và lịch trình linh hoạt</span>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">Đăng nhập</span>
          <h1>Chào mừng quay lại</h1>
          <p>Tiếp tục đặt tour và lưu lịch sử trò chuyện với trợ lý Travelora.</p>
        </div>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <label className="auth-field">
          Email
          <span>
            <Mail size={18} />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="ten@email.com"
              required
            />
          </span>
        </label>

        {resetMode && (
          <label className="auth-field">
            Mật khẩu mới
            <span><Lock size={18} /><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Ít nhất 8 ký tự, đủ chữ hoa, số và ký tự đặc biệt" /></span>
          </label>
        )}

        <button className="link-button" type="button" onClick={resetMode ? resetPassword : requestReset}>
          {resetMode ? "Xác nhận mật khẩu mới" : "Quên mật khẩu?"}
        </button>

        <label className="auth-field">
          Mật khẩu
          <span>
            <Lock size={18} />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Nhập mật khẩu"
              required
            />
          </span>
        </label>

        <button className="primary-button wide auth-submit" type="submit">
          Đăng nhập <ArrowRight size={18} />
        </button>

        <div className="auth-trust">
          <ShieldCheck size={17} />
          <span>Dữ liệu tài khoản và booking được bảo vệ.</span>
        </div>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </div>
  );
}
