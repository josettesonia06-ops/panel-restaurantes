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
  email: string;
  estado: Estado;
  telefono: string;
  restaurante_id: string;
  fecha_hora_reserva: string;
  atendida: boolean | null;
  resena_solicitada: boolean;
  ya_dejo_resena: boolean;

  
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
      .select(`
  *,
  clientes:cliente_id (
    ya_dejo_resena
  )
`)

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
        email: r.email,
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
        resena_solicitada: r.resena_solicitada,
        ya_dejo_resena: r.clientes?.ya_dejo_resena ?? false,


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

  // 1. Update en Supabase (lo que ya funcionaba)
  const { error } = await supabase
    .from("reservas")
    .update({ estado: nuevoEstado })
    .eq("id", id)
    .eq("restaurante_id", restauranteId);

  if (error) {
    console.error("Error al actualizar estado", error);
    return;
  }

  // 2. Update en el estado local (lo que ya funcionaba)
  setReservas((prev) =>
    prev.map((r) =>
      r.id === id ? { ...r, estado: nuevoEstado } : r
    )
  );

  // 3. Avisar a n8n (NO crítico, NO rompe nada)
  try {
    await fetch("https://n8n.gastrohelp.es/webhook/reserva-estado-cambiado", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reserva_id: id,
        estado: nuevoEstado, // "confirmada" | "cancelada"
        restaurante_id: restauranteId,
      }),
    });
  } catch (e) {
    console.log("Webhook n8n no respondió, pero el estado se actualizó");
  }
};

/* ===== HA VENIDO ===== */
const marcarHaVenido = async (reserva: Reserva, valor: boolean) => {

  if (procesando === reserva.id || reserva.atendida !== null) return;

const { data, error } = await supabase
  .from("reservas")
  .update({ atendida: valor })
  .eq("id", reserva.id)
  .eq("restaurante_id", restauranteId)
  .select("id");

if (error) {
  console.error("Error real al marcar ha venido:", error);
  setProcesando(null);
  return;
}

// 👇 CLAVE: si no hay filas, NO es error
if (!data || data.length === 0) {
  console.warn("Reserva ya estaba atendida o no había cambios");
}



  
// ⛔ Si NO ha venido, paramos aquí
if (valor === false) {
  setReservas((prev) =>
    prev.map((r) =>
      r.id === reserva.id ? { ...r, atendida: false } : r
    )
  );
  setProcesando(null);
  return;
}

  // 1⃣ Buscar cliente real en tabla clientes
  const { data: clienteExistente } = await supabase
    .from("clientes")
    .select("id")
    .eq("restaurante_id", reserva.restaurante_id)
    .eq("telefono", reserva.telefono)
    .maybeSingle();

  let clienteIdFinal = clienteExistente?.id;

  // 2⃣ Si no existe, crearlo
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

  // 3⃣ Guardar historial con el cliente_id correcto
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

  // 4⃣ Actualizar estado en el front
  setReservas((prev) =>
    prev.map((r) =>
      r.id === reserva.id ? { ...r, atendida: true } : r
    )
  );
// 5⃣ Avisar a n8n para pedir reseña (solo si ha venido)
fetch("https://n8n.gastrohelp.es/webhook/resena-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    reserva_id: reserva.id,
    restaurante_id: reserva.restaurante_id,
    cliente_id: clienteIdFinal,
    email: reserva.email,
    nombre: reserva.cliente,
    telefono: reserva.telefono,
    resena_solicitada: reserva.resena_solicitada,
    ya_dejo_resena: reserva.ya_dejo_resena,

  }),
});

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
{r.atendida === null && r.estado === "confirmada" && (
  <div className="flex gap-2">
    <button
      disabled={procesando === r.id}
      onClick={() => marcarHaVenido(r, true)}
      className="w-7 h-7 flex items-center justify-center rounded border border-green-600 text-green-600"
      title="Ha venido"
    >
      ✓
    </button>

    <button
      disabled={procesando === r.id}
      onClick={() => marcarHaVenido(r, false)}
      className="w-7 h-7 flex items-center justify-center rounded border border-red-600 text-red-600"
      title="No ha venido"
    >
      ✕
    </button>
  </div>
)}


                  {r.atendida === true && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-600">
                      Ha venido
                    </span>
                    
                  )}
                  {r.atendida === false && (
  <span className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-600">
    No ha venido
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