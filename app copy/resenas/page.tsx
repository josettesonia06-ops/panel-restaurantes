"use client";

import { useState } from "react";

type Reseña = {
  id: number;
  nombre: string;
  inicial: string;
  estrellas: number;
  comentario: string;
  fecha: string;
  estado: "pendiente" | "respondida";
  respuesta?: string;
};

const reseñasIniciales: Reseña[] = [
  {
    id: 1,
    nombre: "Laura Martínez",
    inicial: "L",
    estrellas: 5,
    comentario: "Todo perfecto, repetiremos seguro.",
    fecha: "Hace 2 días",
    estado: "pendiente",
  },
  {
    id: 2,
    nombre: "Pedro Gómez",
    inicial: "P",
    estrellas: 4,
    comentario: "Buena comida, algo lento el servicio.",
    fecha: "Hace 4 días",
    estado: "respondida",
    respuesta:
      "Gracias por tu visita. Nos alegra saber que disfrutaste de la comida.",
  },
  {
    id: 3,
    nombre: "Ana Ruiz",
    inicial: "A",
    estrellas: 2,
    comentario: "Tuvimos que esperar mucho.",
    fecha: "Hace 1 semana",
    estado: "pendiente",
  },
];

const plantillas = {
  positiva:
    "Muchas gracias por tu valoración. Nos alegra saber que disfrutaste de la experiencia. ¡Te esperamos pronto!",
  neutra:
    "Gracias por tu comentario. Tomamos nota para seguir mejorando y ofrecerte una mejor experiencia.",
  negativa:
    "Sentimos que tu experiencia no haya sido la esperada. Agradecemos tu comentario y lo tendremos en cuenta para mejorar.",
};

export default function ReseñasPage() {
  const [reseñas, setReseñas] = useState<Reseña[]>(reseñasIniciales);
  const [filtro, setFiltro] = useState<"pendientes" | "todas">("pendientes");
  const [respondiendoId, setRespondiendoId] = useState<number | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");

  const reseñasFiltradas =
    filtro === "pendientes"
      ? reseñas.filter((r) => r.estado === "pendiente")
      : reseñas;

  const enviarRespuesta = (id: number) => {
    if (!textoRespuesta.trim()) return;

    setReseñas((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, estado: "respondida", respuesta: textoRespuesta }
          : r
      )
    );

    setRespondiendoId(null);
    setTextoRespuesta("");
  };

  return (
    <div className="space-y-6">
      {/* ✅ TÍTULO NEGRO EN FONDO BLANCO */}
      <h1 className="text-2xl font-semibold text-black">
        Reseñas
      </h1>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-4 py-2 rounded-md text-sm border ${
            filtro === "pendientes"
              ? "bg-black text-white"
              : "bg-white text-gray-900 hover:bg-gray-50"
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFiltro("todas")}
          className={`px-4 py-2 rounded-md text-sm border ${
            filtro === "todas"
              ? "bg-black text-white"
              : "bg-white text-gray-900 hover:bg-gray-50"
          }`}
        >
          Todas
        </button>
      </div>

      {/* Listado */}
      <div className="bg-white text-gray-900 rounded-xl border overflow-hidden">
        {reseñasFiltradas.map((r) => (
          <div
            key={r.id}
            className="px-6 py-5 border-t first:border-t-0 space-y-4"
          >
            <div className="flex justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
                  {r.inicial}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.nombre}</p>
                    <span className="text-sm text-gray-500">
                      {r.estrellas}★
                    </span>

                    {r.estado === "pendiente" ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        Pendiente
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Respondida
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mt-1">
                    {r.comentario}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {r.fecha}
                  </p>
                </div>
              </div>

              {r.estado === "pendiente" && (
                <button
                  onClick={() => {
                    setRespondiendoId(r.id);
                    setTextoRespuesta("");
                  }}
                  className="bg-black text-white px-4 py-2 rounded-md text-sm"
                >
                  Responder
                </button>
              )}
            </div>

            {r.estado === "respondida" && r.respuesta && (
              <div className="ml-14 bg-gray-50 border rounded-md p-4 text-sm text-gray-900">
                <p className="text-gray-600 mb-1 font-medium">
                  Respuesta del restaurante
                </p>
                <p>{r.respuesta}</p>
              </div>
            )}

            {respondiendoId === r.id && (
              <div className="ml-14 space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTextoRespuesta(plantillas.positiva)}
                    className="text-xs px-3 py-1 rounded-md border bg-white text-gray-900 hover:bg-gray-50"
                  >
                    ⭐ Positiva
                  </button>
                  <button
                    onClick={() => setTextoRespuesta(plantillas.neutra)}
                    className="text-xs px-3 py-1 rounded-md border bg-white text-gray-900 hover:bg-gray-50"
                  >
                    ⚠️ Neutra
                  </button>
                  <button
                    onClick={() => setTextoRespuesta(plantillas.negativa)}
                    className="text-xs px-3 py-1 rounded-md border bg-white text-gray-900 hover:bg-gray-50"
                  >
                    ❌ Negativa
                  </button>
                </div>

                <textarea
                  value={textoRespuesta}
                  onChange={(e) => setTextoRespuesta(e.target.value)}
                  placeholder="Escribe la respuesta del restaurante…"
                  className="w-full border rounded-md p-3 text-sm bg-white text-gray-900"
                  rows={3}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => enviarRespuesta(r.id)}
                    className="px-4 py-2 rounded-md bg-black text-white text-sm"
                  >
                    Enviar respuesta
                  </button>
                  <button
                    onClick={() => setRespondiendoId(null)}
                    className="px-4 py-2 rounded-md border text-sm bg-white text-gray-900"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
