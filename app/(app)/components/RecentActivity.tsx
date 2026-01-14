"use client";

type Activity = {
  time: string;
  text: string;
  status: "confirmada" | "pendiente" | "cancelada" | "nuevo";
};

const activity: Activity[] = [
  { time: "10:30", text: "Nueva reserva (2 personas)", status: "confirmada" },
  { time: "11:15", text: "Nueva reseña recibida", status: "pendiente" },
  { time: "12:00", text: "Reserva cancelada", status: "cancelada" },
  { time: "13:20", text: "Nuevo cliente registrado", status: "nuevo" },
];

function StatusBadge({ status }: { status: Activity["status"] }) {
  const styles: Record<Activity["status"], string> = {
    confirmada: "bg-green-100 text-green-700",
    pendiente: "bg-yellow-100 text-yellow-700",
    cancelada: "bg-red-100 text-red-700",
    nuevo: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-sm font-semibold mb-4">
        Actividad reciente
      </h2>

      <div className="space-y-4">
        {activity.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-4 text-sm"
          >
            <span className="text-gray-400 w-14 shrink-0">
              {item.time}
            </span>

            <div className="flex-1">
              <p>{item.text}</p>
            </div>

            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
