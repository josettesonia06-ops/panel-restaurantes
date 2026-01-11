"use client";

const reviews = [
  {
    id: 1,
    nombre: "Laura Martínez",
    estrellas: 5,
    comentario: "Todo perfecto, repetiremos seguro.",
    fecha: "Hace 2 días",
  },
  {
    id: 2,
    nombre: "Ana Ruiz",
    estrellas: 2,
    comentario: "Tuvimos que esperar mucho.",
    fecha: "Hace 1 semana",
  },
];

export default function PendingReviews() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h2 className="text-sm font-semibold mb-4">
        Reseñas pendientes de respuesta
      </h2>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="flex items-start justify-between border-b pb-4 last:border-b-0"
          >
            <div>
              <p className="font-medium">{r.nombre}</p>
              <p className="text-sm text-gray-500">
                {"★".repeat(r.estrellas)}
              </p>
              <p className="text-sm mt-1">{r.comentario}</p>
              <p className="text-xs text-gray-400 mt-1">{r.fecha}</p>
            </div>

            <button className="px-4 py-2 text-sm rounded-md bg-black text-white">
              Responder
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
