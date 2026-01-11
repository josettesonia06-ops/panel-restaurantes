"use client";

const reservations = [
  {
    id: 1,
    cliente: "Juan Pérez",
    fecha: "Hoy",
    hora: "14:30",
    personas: 2,
    estado: "Confirmada",
  },
  {
    id: 2,
    cliente: "María López",
    fecha: "Hoy",
    hora: "15:00",
    personas: 4,
    estado: "Pendiente",
  },
  {
    id: 3,
    cliente: "Carlos Gómez",
    fecha: "Mañana",
    hora: "21:00",
    personas: 3,
    estado: "Confirmada",
  },
];

export default function LatestReservations() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-sm font-medium text-gray-600 mb-4">
        Últimas reservas
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Cliente</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Personas</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {reservations.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{r.cliente}</td>
                <td>{r.fecha}</td>
                <td>{r.hora}</td>
                <td>{r.personas}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      r.estado === "Confirmada"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {r.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
