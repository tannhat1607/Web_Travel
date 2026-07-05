import {
  Bell,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  Gift,
  History,
  LogOut,
  Menu,
  Plane,
  ReceiptText,
  UserCog,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ChatWidget } from "../chat/ChatWidget.jsx";
import { getStoredUser, logout } from "../../store/authStore";

export function ClientLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const accountRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onAuthChange = () => setUser(getStoredUser());
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function handleLogout() {
    logout();
    setAccountOpen(false);
    navigate("/");
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/"><Plane size={24} />Travelora</Link>
        <button className="icon-button mobile-only" onClick={() => setMenuOpen((value) => !value)} aria-label="Menu">
          <Menu size={22} />
        </button>
        <nav className={menuOpen ? "open" : ""}>
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/about">Giới thiệu</NavLink>
          <NavLink to="/destinations">Điểm đến</NavLink>
          <NavLink to="/tours">Tour</NavLink>
          <NavLink to="/travel-guides">Cẩm nang</NavLink>
          <NavLink to="/contact">Liên hệ</NavLink>
          {user && <NavLink to="/my-bookings">Đặt chỗ</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="header-actions">
          {user ? (
            <div className="account-menu" ref={accountRef}>
              <button
                className="account-trigger"
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="account-avatar">
                  {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} /> : <UserRound size={18} />}
                </span>
                <span className="account-name">{user.full_name}</span>
                <span className="account-points"><WalletCards size={15} />0 điểm</span>
                <ChevronDown size={16} className={accountOpen ? "open" : ""} />
              </button>

              {accountOpen && (
                <div className="account-dropdown" role="menu">
                  <div className="account-dropdown-hero">
                    <strong>{user.full_name}</strong>
                    <span>Bạn là thành viên Bronze Priority</span>
                  </div>
                  <div className="account-dropdown-body">
                    <div className="account-score">
                      <WalletCards size={21} />
                      <strong>0 điểm</strong>
                    </div>
                    <Link to="/profile" onClick={() => setAccountOpen(false)}>
                      <UserCog size={20} />Chỉnh sửa hồ sơ
                    </Link>
                    <button type="button" disabled>
                      <CreditCard size={20} />Thẻ của tôi
                    </button>
                    <button type="button" disabled>
                      <History size={20} />Danh sách giao dịch
                    </button>
                    <Link to="/my-bookings" onClick={() => setAccountOpen(false)}>
                      <ReceiptText size={20} />Đặt chỗ của tôi
                    </Link>
                    <button type="button" disabled>
                      <WalletCards size={20} />Hoàn tiền <small>Mới</small>
                    </button>
                    <button type="button" disabled>
                      <Bell size={20} />Thông báo giá tour
                    </button>
                    <button type="button" disabled>
                      <CalendarCheck size={20} />Thông tin hành khách
                    </button>
                    <button type="button" disabled>
                      <Gift size={20} />Khuyến mãi
                    </button>
                    <button type="button" className="account-logout" onClick={handleLogout}>
                      <LogOut size={20} />Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="ghost-button" to="/login">Đăng nhập</Link>
              <Link className="primary-button" to="/register">Đăng ký</Link>
            </>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer landing-footer">
        <div className="footer-brand-block">
          <Link className="brand footer-brand" to="/"><Plane size={28} />Travelora</Link>
          <p>Đặt tour, quản lý booking và hỏi trợ lý du lịch thông minh bằng dữ liệu thật từ hệ thống.</p>
          <Link className="footer-partner-button" to="/contact">Hợp tác với Travelora</Link>
        </div>
        <nav>
          <strong>Về Travelora</strong>
          <Link to="/about">Về chúng tôi</Link>
          <Link to="/contact">Liên hệ chúng tôi</Link>
          <Link to="/travel-guides">Cẩm nang du lịch</Link>
          <Link to="/my-bookings">Cách đặt chỗ</Link>
        </nav>
        <nav>
          <strong>Sản phẩm</strong>
          <Link to="/tours">Tour du lịch</Link>
          <Link to="/destinations">Điểm đến</Link>
          <Link to="/travel-guides">Hoạt động & vui chơi</Link>
          <Link to="/contact">Tư vấn lịch trình</Link>
        </nav>
        <div className="footer-support">
          <strong>Hỗ trợ</strong>
          <span>support@travelora.vn</span>
          <span>0900 000 000</span>
          <span>Chính sách quyền riêng tư</span>
          <span>Điều khoản & điều kiện</span>
        </div>
      </footer>
      <ChatWidget />
    </>
  );
}
