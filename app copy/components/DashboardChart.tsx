"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Lun", reservas: 10 },
  { day: "Mar", reservas: 14 },
  { day: "Mié", reservas: 8 },
  { day: "Jue", reservas: 16 },
  { day: "Vie", reservas: 22 },
  { day: "Sáb", reservas: 30 },
  { day: "Dom", reservas: 18 },
];

export default function DashboardChart() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border h-[260px]">
      <h2 className="text-sm font-medium text-gray-600 mb-4">
        Reservas de la semana
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="reservas"
            stroke="#2563eb"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
