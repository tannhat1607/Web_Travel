import { BadgePercent, BarChart3, BookOpenText, CalendarCheck, Inbox, LogOut, Map, MessageSquareText, Plane, Plus, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { getStoredUser, logout } from "../../store/authStore";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/admin/tours", label: "Quản lý tour", icon: Map },
  { to: "/admin/bookings", label: "Booking", icon: CalendarCheck },
  { to: "/admin/promotions", label: "Khuyến mãi", icon: BadgePercent },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/reviews", label: "Đánh giá", icon: Star },
  { to: "/admin/knowledge", label: "Knowledge/RAG", icon: BookOpenText },
  { to: "/admin/chats", label: "Chat history", icon: MessageSquareText },
  { to: "/admin/contacts", label: "Liên hệ", icon: Inbox },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getStoredUser();
  const [tours, setTours] = useState([]);
  const isTourPage = location.pathname === "/admin/tours";
  const activeTourId = Number(searchParams.get("tourId") || 0);

  useEffect(() => {
    if (!isTourPage) return;
    function loadTours() {
      adminApi.tours().then((response) => setTours(response.data)).catch(() => setTours([]));
    }

    loadTours();
    window.addEventListener("admin-tours-change", loadTours);
    return () => window.removeEventListener("admin-tours-change", loadTours);
  }, [isTourPage]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function openNewTour() {
    navigate("/admin/tours");
  }

  function openTour(id) {
    navigate(`/admin/tours?tourId=${id}`);
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="brand admin-brand"><Plane size={22} />Travelora Admin</div>
          {user && <small>{user.full_name}</small>}
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div className="admin-nav-group" key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  <Icon size={18} />{item.label}
                </NavLink>
                {item.to === "/admin/tours" && isTourPage && (
                  <div className="sidebar-tour-list">
                    <button className={!activeTourId ? "active" : ""} type="button" onClick={openNewTour}>
                      <Plus size={14} />Thêm tour mới
                    </button>
                    {tours.map((tour) => (
                      <button className={activeTourId === tour.id ? "active" : ""} key={tour.id} type="button" onClick={() => openTour(tour.id)}>
                        <span>{tour.title}</span>
                        <small>{tour.destination}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <button className="admin-logout" onClick={handleLogout}>
          <LogOut size={18} />Đăng xuất
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
