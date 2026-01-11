"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ResponderResenaModal from "../components/ResponderResenaModal";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";


type Resena = {
  id: string;
  google_review_id: string;
  nombre_cliente: string | null;
  rating: number;
  comentario: string | null;
  responded: boolean;
  respuesta_texto: string | null;
  fecha_reseña: string;
};

export default function ResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [resenaSeleccionada, setResenaSeleccionada] = useState<string | null>(null);
  const [restauranteId, setRestauranteId] = useState<string | null>(null);

  useEffect(() => {
    const cargarRestaurante = async () => {
      const id = await getRestauranteUsuario();
      if (id) setRestauranteId(id);
    };

    cargarRestaurante();
  }, []);


const cargarResenas = async () => {
  if (!restauranteId) return;

  setLoading(true);

  const { data, error } = await supabase
    .from("resenas")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .order("fecha_reseña", { ascending: false });


    if (!error && data) {
      setResenas(data as Resena[]);
    }

    setLoading(false);
  };

 useEffect(() => {
  if (!restauranteId) return;
  cargarResenas();
}, [restauranteId]);


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reseñas</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Valoración</th>
              <th className="px-6 py-3 text-left">Comentario</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {resenas.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-6 py-4 font-medium">
                  {r.nombre_cliente ?? "Cliente"}
                </td>

                <td className="px-6 py-4">
                  {"⭐".repeat(r.rating)}
                </td>

                <td className="px-6 py-4 max-w-md">
                  {r.comentario ?? (
                    <span className="opacity-50">Sin texto</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {r.responded ? (
                    <span className="px-3 py-1 rounded-full text-xs bg-green-500/15 text-green-600">
                      Respondida
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/15 text-yellow-600">
                      Pendiente
                    </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {!r.responded && (
                    <button
                      onClick={() => {
                        setResenaSeleccionada(r.id);
                        setOpenModal(true);
                      }}
                      className="text-xs px-3 py-1 rounded-md bg-black text-white"
                    >
                      Responder
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {!loading && resenas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center opacity-60">
                  No hay reseñas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {resenaSeleccionada && (
        <ResponderResenaModal
          open={openModal}
          resenaId={resenaSeleccionada}
          onClose={() => setOpenModal(false)}
          onSaved={cargarResenas}
        />
      )}
    </div>
  );
}
