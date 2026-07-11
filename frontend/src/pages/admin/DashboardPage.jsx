import { CalendarCheck, DollarSign, Map, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminApi } from "../../api/adminApi";
import { formatCurrency } from "../../utils/format";

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
  top_tours: [],
};

export function DashboardPage() {
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    adminApi.dashboard().then((response) => setStats(response.data)).catch(() => setStats(fallbackStats));
  }, []);

  const chartData = [
    { name: "Pending", value: stats.pending_bookings },
    { name: "Completed", value: stats.completed_bookings },
    { name: "Cancelled", value: stats.cancelled_bookings },
  ];

  return (
    <div className="admin-page">
      <section className="admin-title">
        <div>
          <span className="eyebrow">Tổng quan</span>
          <h1>Trung tâm vận hành</h1>
        </div>
        <p>Theo dõi nhanh hoạt động đặt tour và doanh thu toàn hệ thống.</p>
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
      <section className="admin-card chart-card">
        <div className="card-header-row">
          <div><span className="eyebrow">Đơn hàng</span><h2>Booking theo trạng thái</h2></div>
          <span className="chart-total">{stats.total_bookings} tổng booking</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#1769c2" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <div className="dashboard-report-grid">
        <section className="admin-card chart-card"><div className="card-header-row"><div><span className="eyebrow">Doanh thu</span><h2>7 ngày có giao dịch gần nhất</h2></div></div><ResponsiveContainer width="100%" height={260}><BarChart data={stats.revenue_by_day}><XAxis dataKey="label"/><YAxis/><Tooltip formatter={(value)=>formatCurrency(value)}/><Bar dataKey="value" fill="#1769c2" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></section>
        <section className="admin-card top-tour-report"><span className="eyebrow">Hiệu suất</span><h2>Tour được đặt nhiều nhất</h2><div>{stats.top_tours.map((item,index)=><article key={item.label}><i>{index+1}</i><span>{item.label}</span><strong>{item.value} booking</strong></article>)}</div></section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <div><span>{label}</span><Icon size={18} /></div>
      <strong>{value}</strong>
    </div>
  );
}
