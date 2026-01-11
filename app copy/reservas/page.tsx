"use client";

import { useState } from "react";

type Estado = "confirmada" | "pendiente" | "cancelada";

type Reserva = {
  id: number;
  cliente: string;
  fecha: string;
  hora: string;
  personas: number;
  estado: Estado;
};

const reservasIniciales: Reserva[] = [
  { id: 1, cliente: "Juan Pérez", fecha: "Hoy", hora: "14:30", personas: 2, estado: "confirmada" },
  { id: 2, cliente: "María López", fecha: "Hoy", hora: "15:00", personas: 4, estado: "pendiente" },
  { id: 3, cliente: "Carlos Gómez", fecha: "Mañana", hora: "21:00", personas: 3, estado: "confirmada" },
];

function EstadoBadge({ estado }: { estado: Estado }) {
  if (estado === "confirmada") {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
        Confirmada
      </span>
    );
  }
  if (estado === "pendiente") {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
        Pendiente
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700">
      Cancelada
    </span>
  );
}

type Filtro = "todas" | "hoy" | "pendientes";

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>(reservasIniciales);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");

  const actualizarEstado = (id: number, estado: Estado) => {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado } : r))
    );
  };

  const reservasFiltradas = reservas
    .filter((r) => {
      if (filtro === "hoy") return r.fecha === "Hoy";
      if (filtro === "pendientes") return r.estado === "pendiente";
      return true;
    })
    .filter((r) => r.cliente.toLowerCase().includes(busqueda.toLowerCase()));

  const totalHoy = reservas.filter((r) => r.fecha === "Hoy").length;
  const totalPendientes = reservas.filter((r) => r.estado === "pendiente").length;
  const total = reservas.length;

  const filaBg = (estado: Estado) => {
    if (estado === "confirmada") return "bg-green-50";
    if (estado === "pendiente") return "bg-yellow-50";
    return "bg-red-50";
  };

  return (
    <div className="space-y-6">
      {/* ✅ TÍTULO NEGRO EN FONDO BLANCO */}
    <h1 className="text-2xl font-semibold text-gray-900">
  Reservas
</h1>


      {/* Resumen */}
      <div className="flex gap-2 flex-wrap">
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-900">
          Total: {total}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-gray-900">
          Hoy: {totalHoy}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-gray-900">
          Pendientes: {totalPendientes}
        </span>
      </div>

      {/* Filtros + buscador */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { id: "todas", label: "Todas" },
          { id: "hoy", label: "Hoy" },
          { id: "pendientes", label: "Pendientes" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id as Filtro)}
            className={`px-4 py-2 rounded-md text-sm border ${
              filtro === f.id
                ? "bg-black text-white"
                : "bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}

        <input
          type="text"
          placeholder="Buscar cliente…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="ml-auto px-3 py-2 border rounded-md text-sm w-56 bg-white text-gray-900"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white text-gray-900 rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-6 py-3">Cliente</th>
              <th className="text-left px-6 py-3">Fecha</th>
              <th className="text-left px-6 py-3">Hora</th>
              <th className="text-left px-6 py-3">Personas</th>
              <th className="text-left px-6 py-3">Estado</th>
              <th className="text-left px-6 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {reservasFiltradas.map((r) => (
              <tr key={r.id} className={`border-t ${filaBg(r.estado)}`}>
                <td className="px-6 py-4 font-medium">{r.cliente}</td>
                <td className="px-6 py-4">{r.fecha}</td>
                <td className="px-6 py-4">{r.hora}</td>
                <td className="px-6 py-4">{r.personas}</td>
                <td className="px-6 py-4">
                  <EstadoBadge estado={r.estado} />
                </td>
                <td className="px-6 py-4 flex gap-2">
                  {r.estado === "pendiente" && (
                    <button
                      onClick={() => actualizarEstado(r.id, "confirmada")}
                      className="text-xs px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
                    >
                      Confirmar
                    </button>
                  )}
                  {r.estado !== "cancelada" && (
                    <button
                      onClick={() => actualizarEstado(r.id, "cancelada")}
                      className="text-xs px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {reservasFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
