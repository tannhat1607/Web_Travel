import { ArrowLeft, ArrowRight, KeyRound, Mail, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/authApi";

export function ForgotPasswordPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get("reset_token") || "";
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (resetToken) {
        await authApi.resetPassword({ token: resetToken, new_password: newPassword });
        setNewPassword("");
        setSearchParams({});
        setMessage("Đã đổi mật khẩu. Bạn có thể quay lại đăng nhập.");
      } else {
        const response = await authApi.forgotPassword({ email });
        setMessage(response.data.message || "Nếu email tồn tại, liên kết đặt lại mật khẩu sẽ được gửi đến hộp thư.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || (resetToken ? "Liên kết không hợp lệ hoặc đã hết hạn." : "Không thể gửi yêu cầu lúc này."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-modal-page">
      <div className="auth-landing-copy" aria-hidden="true">
        <span>Travelora</span>
        <h2>Khôi phục tài khoản an toàn</h2>
        <p>Liên kết đặt lại mật khẩu chỉ có hiệu lực trong 15 phút và không được hiển thị trên trình duyệt.</p>
      </div>

      <form className="auth-card auth-modal-card" onSubmit={submit}>
        <Link className="auth-close" to="/login" aria-label="Đóng"><X size={18} /></Link>
        <div className="auth-heading">
          <span className="eyebrow">Bảo mật tài khoản</span>
          <h1>{resetToken ? "Đặt mật khẩu mới" : "Quên mật khẩu"}</h1>
          <p>{resetToken ? "Nhập mật khẩu mới đủ mạnh để hoàn tất." : "Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết khôi phục nếu tài khoản tồn tại."}</p>
        </div>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        {resetToken ? (
          <label className="auth-field">
            Mật khẩu mới
            <span>
              <KeyRound size={18} />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Ít nhất 8 ký tự, đủ chữ hoa, số và ký tự đặc biệt"
                autoComplete="new-password"
                required
              />
            </span>
          </label>
        ) : (
          <label className="auth-field">
            Email
            <span>
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ten@email.com"
                autoComplete="email"
                required
              />
            </span>
          </label>
        )}

        <button className="primary-button wide auth-submit" type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : resetToken ? "Đặt lại mật khẩu" : "Gửi liên kết"} <ArrowRight size={18} />
        </button>

        <Link className="auth-back-link" to="/login"><ArrowLeft size={16} /> Quay lại đăng nhập</Link>
      </form>
    </div>
  );
}
