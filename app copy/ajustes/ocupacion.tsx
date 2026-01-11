"use client";

type TurnoEstado = {
  nombre: string;
  personasReservadas: number;
  capacidad: number;
};

function estadoTurno(porcentaje: number) {
  if (porcentaje >= 100) return "completo";
  if (porcentaje >= 70) return "casi";
  return "ok";
}

export default function OcupacionTurnos() {
  const turnos: TurnoEstado[] = [
    { nombre: "Comidas", personasReservadas: 32, capacidad: 50 },
    { nombre: "Cenas", personasReservadas: 46, capacidad: 50 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <h2 className="font-medium">Ocupación por turno</h2>

      {turnos.map((t) => {
        const porcentaje = Math.round(
          (t.personasReservadas / t.capacidad) * 100
        );
        const estado = estadoTurno(porcentaje);

        return (
          <div
            key={t.nombre}
            className="flex items-center justify-between border rounded-lg p-4"
          >
            <div>
              <p className="font-medium">{t.nombre}</p>
              <p className="text-sm text-gray-500">
                {t.personasReservadas} / {t.capacidad} personas
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-40 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    estado === "ok"
                      ? "bg-green-500"
                      : estado === "casi"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(porcentaje, 100)}%` }}
                />
              </div>

              <span
                className={`text-sm font-medium ${
                  estado === "ok"
                    ? "text-green-600"
                    : estado === "casi"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {porcentaje}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
