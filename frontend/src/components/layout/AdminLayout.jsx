import { BadgePercent, BarChart3, Bell, BookOpenText, CalendarCheck, CircleHelp, Inbox, LogOut, Map, MessageSquareText, PanelLeftClose, PanelLeftOpen, Plane, Plus, Star, Users } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../../store/authStore";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/admin/tours/new", label: "Thêm tour", icon: Plus },
  { to: "/admin/tours", label: "Quản lý tour", icon: Map, end: true },
  { to: "/admin/bookings", label: "Booking", icon: CalendarCheck },
  { to: "/admin/promotions", label: "Khuyến mãi", icon: BadgePercent },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/reviews", label: "Đánh giá", icon: Star },
  { to: "/admin/knowledge", label: "Knowledge/RAG", icon: BookOpenText },
  { to: "/admin/content", label: "CMS nội dung", icon: BookOpenText },
  { to: "/admin/chats", label: "Chat history", icon: MessageSquareText },
  { to: "/admin/contacts", label: "Liên hệ", icon: Inbox },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("admin-sidebar-collapsed") === "true");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      localStorage.setItem("admin-sidebar-collapsed", String(!current));
      return !current;
    });
  }

  return (
    <div className={sidebarCollapsed ? "admin-shell sidebar-collapsed" : "admin-shell"}>
      <aside className="admin-sidebar">
        <button
          className="admin-sidebar-toggle"
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
        <div className="admin-sidebar-top">
          <div className="brand admin-brand">
            <span className="admin-brand-mark"><Plane size={18} /></span>
            <span>Travelora<small>Operations</small></span>
          </div>
          {user && <div className="admin-operator"><span>{user.full_name?.slice(0, 1)?.toUpperCase()}</span><small>{user.full_name}</small></div>}
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div className="admin-nav-group" key={item.to} title={sidebarCollapsed ? item.label : undefined}>
                <NavLink to={item.to} end={item.end}>
                  <Icon size={18} /><span>{item.label}</span>
                </NavLink>
              </div>
            );
          })}
        </nav>
        <button className="admin-logout" onClick={handleLogout}>
          <LogOut size={18} /><span>Đăng xuất</span>
        </button>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-actions">
            <button type="button" aria-label="Thông báo"><Bell size={17} /><i /></button>
            <button type="button" aria-label="Trợ giúp"><CircleHelp size={17} /></button>
            <a href="/" target="_blank" rel="noreferrer">Xem website ↗</a>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
