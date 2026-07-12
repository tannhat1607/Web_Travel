import { ArrowRight, Lock, Mail, Plane, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../store/authStore";

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Email hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
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
        <Link className="auth-close" to="/" aria-label="Đóng"><X size={18} /></Link>
        <div className="auth-visual-banner">
          <div><Plane size={22} /><strong>Ưu đãi đang chờ bạn</strong></div>
          <span>Tour hè, biển xanh và lịch trình linh hoạt</span>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">Đăng nhập</span>
          <h1>Chào mừng quay lại</h1>
          <p>Tiếp tục đặt tour và quản lý hành trình cùng Travelora.</p>
        </div>

        {error && <div className="alert error">{error}</div>}

        <label className="auth-field">
          Email
          <span>
            <Mail size={18} />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="ten@email.com"
              autoComplete="email"
              required
            />
          </span>
        </label>

        <label className="auth-field">
          Mật khẩu
          <span>
            <Lock size={18} />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              required
            />
          </span>
        </label>

        <button className="primary-button wide auth-submit" type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập"} <ArrowRight size={18} />
        </button>

        <Link className="auth-forgot-link" to="/forgot-password">Quên mật khẩu?</Link>

        <div className="auth-trust">
          <ShieldCheck size={17} />
          <span>Dữ liệu tài khoản và booking được bảo vệ.</span>
        </div>

        <p className="auth-switch">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </form>
    </div>
  );
}
