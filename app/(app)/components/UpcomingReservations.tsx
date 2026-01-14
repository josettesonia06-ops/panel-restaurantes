"use client";

type Reserva = {
  id: number;
  cliente: string;
  hora: string;
  personas: number;
  estado: "confirmada" | "pendiente";
};

const reservasHoy: Reserva[] = [
  {
    id: 1,
    cliente: "Juan Pérez",
    hora: "14:30",
    personas: 2,
    estado: "confirmada",
  },
  {
    id: 2,
    cliente: "María López",
    hora: "15:00",
    personas: 4,
    estado: "pendiente",
  },
  {
    id: 3,
    cliente: "Carlos Gómez",
    hora: "21:00",
    personas: 3,
    estado: "confirmada",
  },
];

function EstadoBadge({ estado }: { estado: Reserva["estado"] }) {
  return (
    <span
      className={[
        "px-2 py-1 rounded-full text-xs font-medium",
        estado === "confirmada"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700",
      ].join(" ")}
    >
      {estado === "confirmada" ? "Confirmada" : "Pendiente"}
    </span>
  );
}

export default function UpcomingReservations() {
  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-6 py-4 border-b">
        <h2 className="font-semibold text-sm">Reservas de hoy</h2>
      </div>

      <div className="divide-y">
        {reservasHoy.map((r) => (
          <div
            key={r.id}
            className="px-6 py-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{r.cliente}</p>
              <p className="text-sm text-gray-500">
                {r.hora} · {r.personas} personas
              </p>
            </div>

            <div className="flex items-center gap-3">
              <EstadoBadge estado={r.estado} />
              <button className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50">
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
