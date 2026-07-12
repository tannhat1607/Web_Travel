import { CalendarCheck, DollarSign, Map, TrendingUp, Users } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { formatCurrency } from "../../utils/format";

const RevenueChart = lazy(() => import("../../components/admin/RevenueChart.jsx"));

const fallbackStats = {
  total_users: 0,
  total_tours: 0,
  total_bookings: 0,
  pending_bookings: 0,
  completed_bookings: 0,
  cancelled_bookings: 0,
  paid_payments: 0,
  refunded_payments: 0,
  total_revenue: 0,
  revenue_by_day: [],
  booking_statuses: [],
  top_tours: [],
};

const statusTone = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
};

export function DashboardPage() {
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    adminApi.dashboard().then((response) => setStats(response.data)).catch(() => setStats(fallbackStats));
  }, []);

  const statusData = stats.booking_statuses?.length
    ? stats.booking_statuses
    : [
        { status: "pending", label: "Chờ xử lý", value: stats.pending_bookings },
        { status: "completed", label: "Hoàn thành", value: stats.completed_bookings },
        { status: "cancelled", label: "Đã hủy", value: stats.cancelled_bookings },
      ];

  return (
    <div className="admin-page">
      <section className="admin-title">
        <div>
          <span className="eyebrow">Tổng quan</span>
          <h1>Trung tâm vận hành</h1>
        </div>
        <p>Theo dõi doanh thu, trạng thái booking và các tour đang bán tốt trong hệ thống.</p>
      </section>

      <div className="dashboard-microstats">
        <span><strong>{stats.pending_bookings}</strong> chờ xử lý</span>
        <span><strong>{stats.completed_bookings}</strong> hoàn thành</span>
        <span><strong>{stats.paid_payments}</strong> đã thanh toán</span>
        <span><strong>{stats.refunded_payments}</strong> hoàn tiền</span>
      </div>

      <div className="stat-grid">
        <StatCard icon={Users} label="Người dùng" value={stats.total_users} />
        <StatCard icon={Map} label="Tour" value={stats.total_tours} />
        <StatCard icon={CalendarCheck} label="Booking" value={stats.total_bookings} />
        <StatCard icon={DollarSign} label="Doanh thu" value={formatCurrency(stats.total_revenue)} />
      </div>

      <div className="dashboard-report-grid">
        <section className="admin-card chart-card">
          <div className="card-header-row">
            <div><span className="eyebrow">Doanh thu</span><h2>7 ngày gần nhất</h2></div>
            <span className="chart-total">Tính theo giao dịch đã thanh toán</span>
          </div>
          <Suspense fallback={<ChartFallback />}>
            <RevenueChart data={stats.revenue_by_day} />
          </Suspense>
        </section>

        <section className="admin-card booking-status-report">
          <div className="card-header-row">
            <div><span className="eyebrow">Đơn hàng</span><h2>Booking theo trạng thái</h2></div>
            <span className="chart-total">{stats.total_bookings} tổng booking</span>
          </div>
          <div className="status-report-list">
            {statusData.map((item) => (
              <article key={item.status}>
                <span className={`status-dot ${statusTone[item.status] || "info"}`} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{stats.total_bookings ? Math.round((item.value / stats.total_bookings) * 100) : 0}% tổng booking</span>
                </div>
                <b>{item.value}</b>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-card top-tour-report">
        <div className="card-header-row">
          <div><span className="eyebrow">Hiệu suất</span><h2>Tour bán chạy</h2></div>
          <TrendingUp size={18} />
        </div>
        <div>
          {stats.top_tours.length ? stats.top_tours.map((item, index) => (
            <article key={item.label}>
              <i>{index + 1}</i>
              <span>{item.label}</span>
              <strong>{item.value} booking paid</strong>
            </article>
          )) : <p className="empty-report">Chưa có tour nào phát sinh thanh toán.</p>}
        </div>
      </section>
    </div>
  );
}

function ChartFallback() {
  return <div className="chart-loading" aria-label="Đang tải biểu đồ" />;
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <div><span>{label}</span><Icon size={18} /></div>
      <strong>{value}</strong>
    </div>
  );
}
