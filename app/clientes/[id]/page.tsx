"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import AddVisitaModal from "../../components/AddVisitaModal";

type Visita = {
  id: string;
  created_at: string;
};

export default function ClienteHistorialPage() {
  const { id } = useParams<{ id: string }>();

  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);

  /* NUEVO: modal visita */
  const [showAddVisita, setShowAddVisita] = useState(false);

  /* ===== CARGAR VISITAS ===== */
  const cargarVisitas = async () => {
    const { data } = await supabase
      .from("clientes_historial")
      .select("id, created_at")
      .eq("cliente_id", id)
      .eq("tipo", "visita")
      .order("created_at", { ascending: false });

    if (data) setVisitas(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) cargarVisitas();
  }, [id]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wider">
            Historial del cliente
          </h1>
          <p className="text-sm opacity-70">
            Visitas presenciales
          </p>
        </div>

        <button
          onClick={() => setShowAddVisita(true)}
          className="px-4 py-2 rounded-lg text-sm font-bold border
          hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Añadir visita
        </button>
      </div>

      {/* LISTADO VISITAS */}
      <div className="card rounded-2xl p-5 space-y-3">
        {loading && (
          <p className="text-sm opacity-70">
            Cargando visitas…
          </p>
        )}

        {!loading && visitas.length === 0 && (
          <p className="text-sm opacity-70">
            No hay visitas registradas
          </p>
        )}

        {!loading &&
          visitas.map((visita) => (
            <div
              key={visita.id}
              className="border-b last:border-none py-2 text-sm"
            >
              {new Date(visita.created_at).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </div>
          ))}
      </div>

      {/* MODAL AÑADIR VISITA */}
      {showAddVisita && id && (
        <AddVisitaModal
          clienteId={id}
          onClose={() => setShowAddVisita(false)}
          onSaved={cargarVisitas}
        />
      )}
    </div>
  );
}
