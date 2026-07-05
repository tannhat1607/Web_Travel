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
  total_revenue: 0,
};

export function DashboardPage() {
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    adminApi.dashboard().then((response) => setStats(response.data)).catch(() => setStats(fallbackStats));
  }, []);

  const chartData = [
    { name: "Pending", value: stats.pending_bookings },
    { name: "Completed", value: stats.completed_bookings },
    { name: "Total", value: stats.total_bookings },
  ];

  return (
    <div className="admin-page">
      <section className="admin-title">
        <span className="eyebrow">Tổng quan</span>
        <h1>Dashboard vận hành</h1>
      </section>
      <div className="stat-grid">
        <StatCard icon={Users} label="Người dùng" value={stats.total_users} />
        <StatCard icon={Map} label="Tour" value={stats.total_tours} />
        <StatCard icon={CalendarCheck} label="Booking" value={stats.total_bookings} />
        <StatCard icon={DollarSign} label="Doanh thu" value={formatCurrency(stats.total_revenue)} />
      </div>
      <section className="admin-card chart-card">
        <h2>Booking theo trạng thái</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#0f9f8f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
