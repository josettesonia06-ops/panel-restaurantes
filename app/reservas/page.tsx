"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AddReservaModal from "../components/AddReservaModal";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";

type Estado = "confirmada" | "pendiente" | "cancelada";

type Reserva = {
  id: string;
  cliente: string;
  fecha: string;
  hora: string;
  personas: number;
  estado: Estado;
  telefono: string;
  restaurante_id: string;
  atendida: boolean | null;
};

type Filtro = "todas" | "hoy" | "pendientes";

function EstadoBadge({ estado }: { estado: Estado }) {
  if (estado === "confirmada") {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-green-500/15 text-green-500">
        Confirmada
      </span>
    );
  }
  if (estado === "pendiente") {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/15 text-yellow-500">
        Pendiente
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs bg-red-500/15 text-red-500">
      Cancelada
    </span>
  );
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [restauranteId, setRestauranteId] = useState<string | null>(null);

  /* ===== RESTAURANTE ===== */
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      console.log("NO USER AUN");
      return;
    }

    console.log("USER LISTO:", session.user.id);

    const id = await getRestauranteUsuario();
    console.log("REST ID CARGADO:", id);
    setRestauranteId(id);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);



  /* ===== CARGAR RESERVAS ===== */
  const cargarReservas = async () => {
    if (!restauranteId) return;

    const { data } = await supabase
      .from("reservas")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .order("fecha_hora_reserva", { ascending: true });

    if (!data) return;

    const formateadas: Reserva[] = data.map((r: any) => {
      const fechaDate = new Date(r.fecha_hora_reserva);

      return {
        id: r.id,
        cliente: r.nombre_cliente ?? "Cliente",
        telefono: r.telefono,
        restaurante_id: r.restaurante_id,
        fecha:
          fechaDate.toDateString() === new Date().toDateString()
            ? "Hoy"
            : fechaDate.toLocaleDateString(),
        hora: fechaDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        personas: r.personas,
        estado: r.estado,
        atendida: r.atendida,
      };
    });

    setReservas(formateadas);
  };

  useEffect(() => {
    if (restauranteId) cargarReservas();
  }, [restauranteId]);

  /* ===== CAMBIAR ESTADO ===== */
  const actualizarEstado = async (id: string, nuevoEstado: Estado) => {
    if (!restauranteId) return;

    await supabase
      .from("reservas")
      .update({ estado: nuevoEstado })
      .eq("id", id)
      .eq("restaurante_id", restauranteId);

    setReservas((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, estado: nuevoEstado } : r
      )
    );
  };

  /* ===== HA VENIDO ===== */
  const marcarHaVenido = async (reserva: Reserva) => {
    if (procesando === reserva.id || reserva.atendida === true) return;
    setProcesando(reserva.id);

    const ahora = new Date().toISOString();

    const { data: lock } = await supabase
      .from("reservas")
      .update({ atendida: true })
      .eq("id", reserva.id)
      .is("atendida", null)
      .select("id")
      .maybeSingle();

    if (!lock) {
      setProcesando(null);
      return;
    }

    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefono", reserva.telefono)
      .eq("restaurante_id", reserva.restaurante_id)
      .maybeSingle();

    let clienteId = cliente?.id;

    if (!clienteId) {
      const { data: nuevo } = await supabase
        .from("clientes")
        .insert({
          restaurante_id: reserva.restaurante_id,
          telefono: reserva.telefono,
          nombre: reserva.cliente,
          visitas_totales: 0,
          primera_visita: ahora,
          ultima_visita: ahora,
        })
        .select("id")
        .single();

      if (!nuevo) {
        setProcesando(null);
        return;
      }

      clienteId = nuevo.id;
    }

    await supabase.from("clientes_historial").insert({
      cliente_id: clienteId,
      tipo: "reserva",
      descripcion: "Visita desde reserva",
      personas: reserva.personas,
    });

    setReservas((prev) =>
      prev.map((r) =>
        r.id === reserva.id ? { ...r, atendida: true } : r
      )
    );

    setProcesando(null);
  };

  /* ===== FILTROS ===== */
  const reservasFiltradas = reservas
    .filter((r) => {
      if (filtro === "hoy") return r.fecha === "Hoy";
      if (filtro === "pendientes") return r.estado === "pendiente";
      return true;
    })
    .filter((r) =>
      r.cliente.toLowerCase().includes(busqueda.toLowerCase())
    );

  /* ===== RENDER ===== */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reservas</h1>

        <button
  type="button"
  onClick={() => {
    console.log("CLICK BOTON AÑADIR RESERVA");
    setOpenModal(true);
  }}
  className="px-4 py-2 rounded-md bg-black text-white text-sm"
>
  Añadir reserva
</button>

      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Fecha</th>
              <th className="px-6 py-3 text-left">Hora</th>
              <th className="px-6 py-3 text-left">Personas</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-left">Acciones</th>
              <th className="px-6 py-3 text-left">Ha venido</th>
            </tr>
          </thead>

          <tbody>
            {reservasFiltradas.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-6 py-4 font-medium">{r.cliente}</td>
                <td className="px-6 py-4">{r.fecha}</td>
                <td className="px-6 py-4">{r.hora}</td>
                <td className="px-6 py-4">{r.personas}</td>
                <td className="px-6 py-4">
                  <EstadoBadge estado={r.estado} />
                </td>

                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {r.estado === "pendiente" && (
                      <button
                        onClick={() =>
                          actualizarEstado(r.id, "confirmada")
                        }
                        className="text-xs px-3 py-1 rounded-md bg-green-600 text-white"
                      >
                        Confirmar
                      </button>
                    )}
                    {r.estado !== "cancelada" && (
                      <button
                        onClick={() =>
                          actualizarEstado(r.id, "cancelada")
                        }
                        className="text-xs px-3 py-1 rounded-md bg-red-600 text-white"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {r.atendida === null && r.estado !== "cancelada" && (
                    <button
                      disabled={procesando === r.id}
                      onClick={() => marcarHaVenido(r)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-green-600 text-green-600 disabled:opacity-40"
                    >
                      ✓
                    </button>
                  )}

                  {r.atendida === true && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-600">
                      Ha venido
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddReservaModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        restauranteId={restauranteId}
        onCreated={cargarReservas}
      />
    </div>
  );
}
