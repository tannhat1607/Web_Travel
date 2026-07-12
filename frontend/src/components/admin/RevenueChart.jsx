import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "../../utils/format";


export default function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis dataKey="label" />
        <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}tr`} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Bar dataKey="value" fill="#1769c2" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
