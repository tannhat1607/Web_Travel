import { ArrowRight, Check, Lock, Mail, Phone, Plane, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../store/authStore";

const passwordRules = [
  { key: "length", label: "Ít nhất 8 ký tự", test: (value) => value.length >= 8 },
  { key: "lowercase", label: "Có chữ thường", test: (value) => /[a-z]/.test(value) },
  { key: "uppercase", label: "Có chữ hoa", test: (value) => /[A-Z]/.test(value) },
  { key: "number", label: "Có chữ số", test: (value) => /\d/.test(value) },
  { key: "special", label: "Có ký tự đặc biệt", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

function getPasswordErrors(password) {
  return passwordRules.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

export function RegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    avatar_url: null,
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const passwordErrors = useMemo(() => getPasswordErrors(form.password), [form.password]);
  const passwordMatches = form.confirm_password.length > 0 && form.password === form.confirm_password;

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (passwordErrors.length > 0) {
      setError("Mật khẩu chưa đủ mạnh.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      const { confirm_password, ...payload } = form;
      await register(payload);
      navigate("/");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(detail || "Không thể đăng ký.");
      }
    }
  }

  return (
    <div className="auth-page auth-modal-page">
      <div className="auth-landing-copy" aria-hidden="true">
        <span>Travelora</span>
        <h2>Tạo tài khoản để quản lý chuyến đi dễ hơn</h2>
        <p>Lưu booking, theo dõi trạng thái thanh toán và giữ lịch sử chat khi quay lại.</p>
      </div>

      <form className="auth-card auth-modal-card register-modal-card" onSubmit={submit}>
        <Link className="auth-close" to="/" aria-label="Đóng">
          <X size={18} />
        </Link>
        <div className="auth-visual-banner">
          <div>
            <Plane size={22} />
            <strong>Khởi hành cùng Travelora</strong>
          </div>
          <span>Tài khoản miễn phí cho mọi hành trình</span>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">Đăng ký</span>
          <h1>Tạo tài khoản</h1>
          <p>Điền thông tin cơ bản để đặt tour và dùng trợ lý du lịch tốt hơn.</p>
        </div>

        {error && <div className="alert error">{error}</div>}

        <label className="auth-field">
          Họ tên
          <span>
            <UserRound size={18} />
            <input
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              placeholder="Tấn Nhật"
              required
            />
          </span>
        </label>

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

        <label className="auth-field">
          Số điện thoại
          <span>
            <Phone size={18} />
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="0900000000"
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
              placeholder="Ví dụ: Tannhat@123"
              required
            />
          </span>
        </label>

        <div className="password-rules">
          {passwordRules.map((rule) => {
            const valid = rule.test(form.password);
            return (
              <span className={valid ? "valid" : ""} key={rule.key}>
                {valid ? <Check size={14} /> : <X size={14} />}
                {rule.label}
              </span>
            );
          })}
        </div>

        <label className="auth-field">
          Nhập lại mật khẩu
          <span>
            <Lock size={18} />
            <input
              type="password"
              value={form.confirm_password}
              onChange={(event) => setForm({ ...form, confirm_password: event.target.value })}
              placeholder="Nhập lại mật khẩu"
              required
            />
          </span>
        </label>

        {form.confirm_password && (
          <small className={passwordMatches ? "field-hint valid" : "field-hint error"}>
            {passwordMatches ? "Mật khẩu khớp." : "Mật khẩu nhập lại chưa khớp."}
          </small>
        )}

        <button className="primary-button wide auth-submit" type="submit">
          Tạo tài khoản <ArrowRight size={18} />
        </button>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
