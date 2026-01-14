"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AddReservaModal from "../components/AddReservaModal";
import { getRestauranteUsuario } from "../lib/getRestauranteUsuario";

type Estado = "confirmada" | "pendiente" | "cancelada";

type Reserva = {
  id: string;
  cliente: string;
  cliente_id: string;
  fecha: string;
  hora: string;
  personas: number;
  estado: Estado;
  telefono: string;
  restaurante_id: string;
  fecha_hora_reserva: string;
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
        cliente_id: r.cliente_id,
        telefono: r.telefono,
        restaurante_id: r.restaurante_id,
        fecha_hora_reserva: r.fecha_hora_reserva,
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
  if (procesando === reserva.id || reserva.atendida !== null) return;

  setProcesando(reserva.id);

  const { data, error } = await supabase
    .from("reservas")
    .update({ atendida: true })
    .eq("id", reserva.id)
    .is("atendida", null)
    .select("id");

  if (error || !data || data.length === 0) {
    setProcesando(null);
    return;
  }

  // 1️⃣ Buscar cliente real en tabla clientes
  const { data: clienteExistente } = await supabase
    .from("clientes")
    .select("id")
    .eq("restaurante_id", reserva.restaurante_id)
    .eq("telefono", reserva.telefono)
    .maybeSingle();

  let clienteIdFinal = clienteExistente?.id;

  // 2️⃣ Si no existe, crearlo
  if (!clienteIdFinal) {
    const { data: nuevoCliente, error: errNuevo } = await supabase
      .from("clientes")
      .insert({
        restaurante_id: reserva.restaurante_id,
        nombre: reserva.cliente,
        telefono: reserva.telefono,
        visitas_totales: 0,
      })
      .select("id")
      .single();

    if (errNuevo || !nuevoCliente) {
      setProcesando(null);
      return;
    }

    clienteIdFinal = nuevoCliente.id;
  }

  // 3️⃣ Guardar historial con el cliente_id correcto
  const fechaEvento = new Date(reserva.fecha_hora_reserva);

  await supabase
    .from("clientes_historial")
    .upsert(
      {
        cliente_id: clienteIdFinal, // 👈 ESTE ES EL CAMBIO CLAVE
        restaurante_id: reserva.restaurante_id,
        reserva_id: reserva.id,
        tipo: "visita",
        personas: reserva.personas,
        created_at: fechaEvento.toISOString(),
      },
      { onConflict: "reserva_id" }
    );

  // 4️⃣ Actualizar estado en el front
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
