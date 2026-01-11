"use client";

const alerts = [
  {
    id: 1,
    text: "3 reseñas pendientes de responder",
    type: "warning",
  },
  {
    id: 2,
    text: "Mesa completa prevista a las 14:30",
    type: "info",
  },
  {
    id: 3,
    text: "1 reserva cancelada hoy",
    type: "danger",
  },
];

const colors: Record<string, string> = {
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  danger: "bg-red-50 text-red-700 border-red-200",
};

export default function DailyAlerts() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-sm font-medium text-gray-600 mb-4">
        Avisos del día
      </h2>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border px-4 py-3 rounded-md text-sm ${colors[alert.type]}`}
          >
            {alert.text}
          </div>
        ))}
      </div>
    </div>
  );
}
